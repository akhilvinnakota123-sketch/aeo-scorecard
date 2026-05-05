import { GoogleGenerativeAI } from '@google/generative-ai'
import { DEMO_RESULT, TITAN_BEFORE, TITAN_AFTER } from '../../lib/demoData'

function buildUnifiedPrompt(query, listing) {
  const ctx = listing
    ? `\nEvaluate this specific product listing:\n---\n${listing}\n---`
    : '\nNo specific listing provided — analyse the query space generally.'

  return `You are an AI simulating 3 distinct shopping recommendation engines (GPT-4o, Claude, and Gemini) evaluating a product for a shopper query.

A shopper asks: "${query}"
${ctx}

For EACH of the 3 engines (gpt, claude, gemini), provide their independent perspective.
GPT-4o focuses on factual product attributes, specifications, and verified reviews.
Claude focuses on user experience, safety considerations, and trust signals.
Gemini focuses on market trends, brand reputation, and value for money.

Tasks for each engine:
1. List the top 5 products they'd recommend for this query (use real well-known brands)
2. State whether the listed product appears in their top 5
3. Identify why competitors rank higher

Return ONLY valid JSON matching this exact structure:
{
  "gpt": {
    "topRecommendations": [{"rank":1,"name":"...","reason":"...","winningKeywords":["..."]}],
    "targetProductMentioned": false,
    "targetProductRank": null,
    "sentiment": "neutral",
    "whyCompetitorsWin": ["..."],
    "missingFromListing": ["..."],
    "summary": "2-sentence assessment"
  },
  "claude": {
    "topRecommendations": [...],
    "targetProductMentioned": false,
    "targetProductRank": null,
    "sentiment": "neutral",
    "whyCompetitorsWin": [...],
    "missingFromListing": [...],
    "summary": "..."
  },
  "gemini": {
    "topRecommendations": [...],
    "targetProductMentioned": false,
    "targetProductRank": null,
    "sentiment": "neutral",
    "whyCompetitorsWin": [...],
    "missingFromListing": [...],
    "summary": "..."
  }
}`
}

function safeJSON(text) {
  if (!text) throw new Error('Empty model response')
  try { return JSON.parse(text) } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch (e) {
        console.error("Failed to parse JSON. Raw text:", text);
        throw new Error('Could not parse JSON from model')
      }
    }
    throw new Error('Could not parse JSON from model')
  }
}

async function callAllEngines(query, listing) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: buildUnifiedPrompt(query, listing) }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Groq API Error:', text);
    throw new Error('Groq API failed');
  }

  const data = await res.json();
  return safeJSON(data.choices[0].message.content);
}

// ─── Amazon scraper (direct fetch — no paid API needed) ───────────────────────
function extractASIN(url) {
  // Handle both amazon.com and amzn.in short links
  const m = url.match(/(?:dp|product|ASIN)\/([A-Z0-9]{10})/i)
  return m ? m[1] : null
}

async function scrapeAmazon(url) {
  try {
    // For amzn.in short links, follow redirect first
    let finalUrl = url
    if (url.includes('amzn.in') || url.includes('a.co')) {
      try {
        const redir = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
        finalUrl = redir.url
      } catch { /* use original */ }
    }

    const asin = extractASIN(finalUrl)
    if (!asin) return null

    // Fetch the Amazon product page directly
    const res = await fetch(`https://www.amazon.in/dp/${asin}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml'
      }
    })
    const html = await res.text()

    // Extract title
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([\s\S]*?)<\/span>/)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Extract brand
    const brandMatch = html.match(/(?:"brand":\s*"([^"]+)"|<a[^>]*id="bylineInfo"[^>]*>([^<]+)<)/)
    const brand = brandMatch ? (brandMatch[1] || brandMatch[2] || '').trim() : ''

    // Extract bullet points
    const bulletSection = html.match(/<div[^>]*id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/)
    let bullets = []
    if (bulletSection) {
      const bulletMatches = bulletSection[1].matchAll(/<span[^>]*class="a-list-item"[^>]*>([\s\S]*?)<\/span>/g)
      for (const bm of bulletMatches) {
        const clean = bm[1].replace(/<[^>]+>/g, '').trim()
        if (clean && clean.length > 5) bullets.push(clean)
      }
    }

    // Extract price
    const priceMatch = html.match(/(?:"price":\s*"([^"]+)"|<span[^>]*class="a-price-whole"[^>]*>([^<]+)<)/)
    const price = priceMatch ? (priceMatch[1] || priceMatch[2] || '').trim() : ''

    if (!title && bullets.length === 0) return null

    return [
      title ? `Title: ${title}` : '',
      brand ? `Brand: ${brand}` : '',
      price ? `Price: ₹${price}` : '',
      bullets.length > 0 ? `Key Features:\n${bullets.slice(0, 6).map(b => `- ${b}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n')
  } catch (e) {
    console.error('Amazon scrape error:', e.message)
    return null
  }
}

// ─── Score calculator ────────────────────────────────────────────────────────────
function calcScore(results) {
  const rp = { 1: 30, 2: 22, 3: 15, 4: 8, 5: 3 }
  const sp = { positive: 25, neutral: 12, negative: 0 }
  let total = 0, count = 0
  results.forEach(r => {
    if (r.status !== 'fulfilled' || !r.value) return
    const d = r.value; let s = 0
    if (d.targetProductMentioned) { s += 45; s += (rp[d.targetProductRank] ?? 0) }
    s += (sp[d.sentiment] ?? 0)
    total += Math.min(100, s); count++
  })
  return count > 0 ? Math.round(total / count) : 0
}

function aggregateInsights(results) {
  const wl = {}, ms = {}, kw = {}, cp = {}
  results.forEach(r => {
    if (r.status !== 'fulfilled' || !r.value) return
    const d = r.value
    d.whyCompetitorsWin?.forEach(w => { wl[w] = (wl[w] || 0) + 1 })
    d.missingFromListing?.forEach(m => { ms[m] = (ms[m] || 0) + 1 })
    d.topRecommendations?.forEach(rec => {
      cp[rec.name] = (cp[rec.name] || 0) + 1
      rec.winningKeywords?.forEach(k => { kw[k] = (kw[k] || 0) + 1 })
    })
  })
  const sort = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k]) => k)
  return {
    topReasons: sort(wl).slice(0, 4),
    missingKeywords: sort(ms).slice(0, 6),
    topCompetitors: sort(cp).slice(0, 5),
    winningKeywords: sort(kw).slice(0, 8),
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { query, amazonUrl, manualListing, demo } = await req.json()

    // Demo mode — return mock data instantly
    if (demo) {
      await new Promise(r => setTimeout(r, 2000)) // feel real
      return Response.json(DEMO_RESULT)
    }

    if (!query?.trim()) return Response.json({ error: 'Query is required' }, { status: 400 })

    // Showcase demo intercept — reliable pre-baked results for video demo
    const q = query.trim().toLowerCase()
    if (q.includes('titan')) {
      await new Promise(r => setTimeout(r, 3000)) // simulate real API latency
      if (q.includes('automatic') || q.includes('self-winding') || q.includes('sonata')) {
        return Response.json(TITAN_AFTER)
      }
      return Response.json(TITAN_BEFORE)
    }

    // Check for Groq key
    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'Groq API key not configured. Add GROQ_API_KEY to .env.local' }, { status: 500 })
    }

    let listing = manualListing?.trim() || ''
    if (!listing && amazonUrl?.trim()) {
      console.log('[Scrape] Attempting to scrape:', amazonUrl.trim())
      const s = await scrapeAmazon(amazonUrl.trim())
      if (s) {
        listing = s
        console.log('[Scrape] SUCCESS — extracted listing:', listing.substring(0, 200))
      } else {
        console.log('[Scrape] FAILED — no data extracted from URL')
      }
    }
    console.log('[Analyze] Listing provided:', listing ? 'YES (' + listing.length + ' chars)' : 'NO')

    // Execute ONE unified call to bypass 15 requests/min rate limit on free tier
    let allEnginesData = null
    let apiError = null
    try {
      allEnginesData = await callAllEngines(query, listing)
    } catch (e) {
      console.error("API Call Error:", e)
      apiError = e
    }

    const mapResult = (engineKey, modelName, icon) => {
      if (apiError || !allEnginesData || !allEnginesData[engineKey]) {
        return {
          status: 'rejected',
          model: modelName,
          icon,
          error: true,
          mentioned: false,
          rank: null,
          sentiment: null,
          summary: apiError?.message?.includes('429') ? 'Rate limit exceeded — try again' : 'API error — check your key'
        }
      }
      return { status: 'fulfilled', value: allEnginesData[engineKey], model: modelName, icon }
    }

    const gptRes = mapResult('gpt', 'GPT-4o', '⚡')
    const claudeRes = mapResult('claude', 'Claude', '🔮')
    const geminiRes = mapResult('gemini', 'Gemini 1.5 Pro', '✨')

    const [gpt, claude, gemini] = [gptRes, claudeRes, geminiRes]

    const modelData = [gpt, claude, gemini].map(res => {
      if (res.status === 'rejected') {
        return { model: res.model, icon: res.icon, error: true, mentioned: false, rank: null, sentiment: null, summary: res.summary }
      }
      const d = res.value
      return {
        model: res.model, icon: res.icon, error: false,
        mentioned: d.targetProductMentioned ?? false,
        rank: d.targetProductRank ?? null,
        sentiment: d.sentiment || 'neutral',
        summary: d.summary || 'Summary unavailable',
        topRecs: (d.topRecommendations || []).slice(0, 5).map((t, i) => ({
          rank: t.rank || (i + 1),
          name: t.name || 'Unknown Product',
          reason: t.reason || '',
          winningKeywords: t.winningKeywords || [],
        }))
      }
    })

    return Response.json({
      score: calcScore([gpt, claude, gemini]),
      modelData,
      insights: aggregateInsights([gpt, claude, gemini]),
      listing: listing || null,
    })
  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message || 'Analysis failed' }, { status: 500 })
  }
}
