import { GoogleGenerativeAI } from '@google/generative-ai'
import { DEMO_REWRITE } from '../../lib/demoData'

export async function POST(req) {
  try {
    const { query, listing, insights, demo } = await req.json()

    if (demo) {
      await new Promise(r => setTimeout(r, 1500))
      return Response.json(DEMO_REWRITE)
    }

    if (!listing?.trim()) return Response.json({ error: 'Listing text required' }, { status: 400 })

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    const prompt = `You are an Amazon listing AEO (Answer Engine Optimisation) specialist. Your job is to rewrite product listings so they rank #1 when AI assistants answer shopping queries.

Rewrite this Amazon listing to rank #1 when AI engines answer: "${query}"

CURRENT LISTING:
${listing}

WHY IT'S LOSING:
${insights.topReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

MISSING KEYWORDS COMPETITORS USE:
${insights.missingKeywords.join(', ')}

Respond ONLY with valid JSON — no markdown fences, no prose:
{
  "title": "optimised title under 200 chars",
  "bullets": ["bullet 1","bullet 2","bullet 3","bullet 4","bullet 5"],
  "description": "2-3 paragraph description optimised for AI recommendations",
  "addedKeywords": ["kw1","kw2","kw3"],
  "rationale": "1 sentence on core positioning change"
}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) throw new Error('Groq API failed');
    const data = await res.json();
    const text = data.choices[0].message.content;

    try { return Response.json(JSON.parse(text)) }
    catch {
      const m = text.match(/\{[\s\S]*\}/)
      if (m) return Response.json(JSON.parse(m[0]))
      throw new Error('Could not parse rewrite')
    }
  } catch (err) {
    console.error(err)
    return Response.json({ error: err.message || 'Rewrite failed' }, { status: 500 })
  }
}
