'use client'
import { useState, useEffect, useRef } from 'react'
import { DEMO_QUERY } from './lib/demoData'

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function scoreColor(s) {
  if (s >= 65) return { ring: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Strong Visibility', emoji: '🟢' }
  if (s >= 35) return { ring: '#f59e0b', text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Low Visibility',    emoji: '🟡' }
  return           { ring: '#ef4444', text: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Near Invisible',    emoji: '🔴' }
}

function sentimentClass(s) {
  if (s === 'positive') return 'bg-emerald-100 text-emerald-700'
  if (s === 'negative') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

// ═══════════════════════════════════════════════════════════════
// SCORE RING
// ═══════════════════════════════════════════════════════════════
function ScoreRing({ score, size = 148 }) {
  const [displayed, setDisplayed] = useState(0)
  const R = size / 2 - 12
  const circ = 2 * Math.PI * R
  const col = scoreColor(score)

  useEffect(() => {
    let n = 0
    const step = Math.ceil(score / 50)
    const t = setInterval(() => {
      n = Math.min(n + step, score)
      setDisplayed(n)
      if (n >= score) clearInterval(t)
    }, 25)
    return () => clearInterval(t)
  }, [score])

  const dash = (displayed / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx={size/2} cy={size/2} r={R} fill="none"
          stroke={col.ring} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${col.text}`} style={{ fontSize: size > 120 ? 32 : 22 }}>{displayed}</span>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// LOADING — sequential model reveal
// ═══════════════════════════════════════════════════════════════
function LoadingScreen({ query }) {
  const models = [
    { name: 'GPT-4o',         icon: '⚡', delay: 0    },
    { name: 'Claude Opus',    icon: '🔮', delay: 1400 },
    { name: 'Gemini 1.5 Pro', icon: '✨', delay: 2600 },
  ]
  const [done, setDone] = useState([])

  useEffect(() => {
    const timers = models.map((m, i) =>
      setTimeout(() => setDone(d => [...d, i]), m.delay + 800)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8 fade-up">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 spin-loader mx-auto mb-4" />
        <p className="text-sm text-gray-400 mb-1">Scanning AI engines for</p>
        <p className="font-semibold text-gray-800 text-lg max-w-xs mx-auto">"{query}"</p>
      </div>
      <div className="flex flex-col gap-3 w-72">
        {models.map((m, i) => (
          <div key={m.name}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
              done.includes(i)
                ? 'bg-white border-emerald-200 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <span className="text-lg">{m.icon}</span>
            <span className="text-sm font-medium text-gray-700 flex-1">{m.name}</span>
            {done.includes(i)
              ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">✓ Done</span>
              : <span className="text-xs text-gray-300 font-medium">Querying…</span>
            }
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Running in parallel • ~8 seconds</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function Page() {
  const [step,        setStep]    = useState('input')     // input | loading | results
  const [query,       setQuery]   = useState('')
  const [amazonUrl,   setUrl]     = useState('')
  const [manualText,  setML]      = useState('')
  const [showPaste,   setShowP]   = useState(false)
  const [error,       setError]   = useState('')
  const [results,     setResults] = useState(null)
  const [rewrite,     setRewrite] = useState(null)
  const [rewriting,   setRewing]  = useState(false)
  const [copied,      setCopied]  = useState(false)
  const [activeModel, setActive]  = useState(null)       // for rec expand
  const topRef = useRef(null)

  // ── Run analysis ──────────────────────────────────────────────
  async function run(isDemo = false) {
    const q = isDemo ? DEMO_QUERY : query.trim()
    if (!isDemo && !q) { setError('Enter a search query first'); return }
    setError('')
    if (!isDemo) setQuery(q)
    setStep('loading')
    try {
      const res  = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, amazonUrl, manualListing: manualText, demo: isDemo }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults({ ...data, query: q })
      setStep('results')
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    } catch (e) {
      setError(e.message || 'Something went wrong. Check your API keys.')
      setStep('input')
    }
  }

  // ── Rewrite ────────────────────────────────────────────────────
  async function doRewrite(isDemo = false) {
    if (!results) return
    setRewing(true)
    try {
      const listing = manualText || results.listing || ''
      const res  = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: results.query, listing, insights: results.insights, demo: isDemo }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRewrite(data)
    } catch (e) { alert('Rewrite failed: ' + e.message) }
    finally { setRewing(false) }
  }

  // ── Copy rewrite ───────────────────────────────────────────────
  function copyRewrite() {
    if (!rewrite) return
    const txt = [
      `TITLE:\n${rewrite.title}`,
      `\nBULLET POINTS:\n${rewrite.bullets?.map((b,i)=>`${i+1}. ${b}`).join('\n')}`,
      `\nDESCRIPTION:\n${rewrite.description}`,
    ].join('\n')
    navigator.clipboard.writeText(txt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() { setStep('input'); setResults(null); setRewrite(null); setError(''); setActive(null) }

  const col = results ? scoreColor(results.score) : null
  const hasListing = !!(manualText || results?.listing)
  const isDemo = results?.score === 38 // rough demo check

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── NAV ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">AI Visibility Scorecard</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline">AEO Diagnostic</span>
          </div>
          <div className="flex items-center gap-3">
            {step === 'results' && (
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-800 transition">
                ← New scan
              </button>
            )}
            <span className="text-xs text-gray-400 hidden sm:inline">GPT · Claude · Gemini</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ════════════════════ INPUT ════════════════════ */}
        {step === 'input' && (
          <div className="max-w-2xl mx-auto fade-up">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                🔍 Answer Engine Optimisation
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                How does AI see<br className="hidden sm:block" /> your product?
              </h1>
              <p className="text-gray-500 text-base max-w-md mx-auto">
                Ask GPT-4o, Claude, and Gemini the same question your customer would — see exactly where you rank, why you're losing, and how to fix it.
              </p>
            </div>

            {/* Input card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              {/* Query */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  What would your customer ask AI?
                </label>
                <input
                  type="text" value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && run(false)}
                  placeholder='"best magnesium supplement for seniors"'
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-gray-300"
                />
              </div>

              {/* Amazon URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Amazon URL <span className="font-normal text-gray-400">(optional — needs Rainforest API key)</span>
                </label>
                <input
                  type="text" value={amazonUrl}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/B08XYZ..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder:text-gray-300"
                />
              </div>

              {/* Manual paste */}
              <div>
                <button
                  type="button" onClick={() => setShowP(v => !v)}
                  className="text-sm text-indigo-500 hover:text-indigo-700 transition"
                >
                  {showPaste ? '▲ Hide' : '▼ Paste listing manually (no API needed)'}
                </button>
                {showPaste && (
                  <textarea
                    value={manualText} onChange={e => setML(e.target.value)}
                    rows={5} placeholder="Paste your product title, bullet points, description here…"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none placeholder:text-gray-300"
                  />
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>
              )}

              {/* CTA */}
              <button
                onClick={() => run(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition text-sm"
              >
                Run AI Visibility Scan →
              </button>

              {/* Demo */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button
                onClick={() => run(true)}
                className="w-full border border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 font-medium py-3 rounded-xl transition text-sm"
              >
                🎯 Try Demo (no API keys needed)
              </button>
            </div>

            {/* Powered by */}
            <p className="text-center text-xs text-gray-400 mt-6">
              Queries <strong>GPT-4o</strong> · <strong>Claude</strong> · <strong>Gemini</strong> simultaneously
              via <strong>Rainforest API</strong> for Amazon data
            </p>
          </div>
        )}

        {/* ════════════════════ LOADING ════════════════════ */}
        {step === 'loading' && <LoadingScreen query={query || DEMO_QUERY} />}

        {/* ════════════════════ RESULTS ════════════════════ */}
        {step === 'results' && results && (
          <div ref={topRef} className="space-y-5 fade-up">

            {/* ①  SCORE CARD ───────────────────────────────── */}
            <div className={`card border-2 ${col.border}`}>
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Ring */}
                  <div className="flex-shrink-0">
                    <ScoreRing score={results.score} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">AI Visibility Score</p>
                    <h2 className={`text-2xl sm:text-3xl font-bold ${col.text} mb-1`}>
                      {col.emoji} {col.label}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Across GPT-4o, Claude & Gemini for{' '}
                      <strong>"{results.query}"</strong>
                    </p>
                    {/* mini bars */}
                    <div className="space-y-2 max-w-xs mx-auto sm:mx-0">
                      {[
                        { label: 'Mention Frequency', val: results.modelData.filter(m=>m.mentioned).length, max: 3, zeroText: 'Not mentioned in any top 5' },
                        { label: 'Top Ranking Achieved', val: results.modelData.filter(m=>m.rank).length>0 ? Math.min(...results.modelData.filter(m=>m.rank).map(m=>m.rank)) : 0, max: 5, invert: true, zeroText: 'None — not in top 5' },
                        { label: 'Sentiment Score', val: results.modelData.filter(m=>m.sentiment==='positive').length, max: 3 },
                      ].map(item => {
                        const pct = item.invert
                          ? item.val > 0 ? Math.round(((6-item.val)/5)*100) : 0
                          : Math.round((item.val/item.max)*100)
                        
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-36">{item.label}</span>
                            {pct === 0 && item.zeroText ? (
                              <span className="text-xs font-medium text-gray-400 italic flex-1 text-right">{item.zeroText}</span>
                            ) : (
                              <>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${col.text.replace('text-','bg-')}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ② MODEL RESULTS TABLE ──────────────────────────── */}
            <div className="card">
              <div className="section-head">
                <span className="text-lg">🤖</span>
                <div>
                  <h3 className="font-semibold text-gray-800">AI Engine Results</h3>
                  <p className="text-xs text-gray-400 mt-0.5">How each AI responded to your query</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Model</th>
                      <th className="text-center px-4 py-3">Mentioned?</th>
                      <th className="text-center px-4 py-3">Rank</th>
                      <th className="text-center px-4 py-3">Sentiment</th>
                      <th className="text-left px-4 py-3">Summary</th>
                      <th className="text-center px-4 py-3">Top Picks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.modelData.map(m => (
                      <>
                        <tr
                          key={m.model}
                          className={`transition-colors ${m.mentioned ? 'bg-white' : 'bg-red-50/20'} cursor-pointer hover:bg-slate-50`}
                          onClick={() => setActive(activeModel === m.model ? null : m.model)}
                        >
                          <td className="px-5 py-4 font-semibold text-gray-800">
                            {m.icon} {m.model}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {m.error
                              ? <span className="pill bg-gray-100 text-gray-400">Error</span>
                              : m.mentioned
                                ? <span className="pill bg-emerald-100 text-emerald-700">✓ Yes</span>
                                : <span className="pill bg-red-100 text-red-600">✗ No</span>
                            }
                          </td>
                          <td className="px-4 py-4 text-center">
                            {m.rank
                              ? <span className={`text-base font-bold ${m.rank===1?'text-emerald-600':m.rank<=3?'text-amber-600':'text-gray-500'}`}>#{m.rank}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-4 text-center">
                            {m.sentiment && (
                              <span className={`pill capitalize ${sentimentClass(m.sentiment)}`}>{m.sentiment}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500 max-w-xs leading-relaxed">{m.summary}</td>
                          <td className="px-4 py-4 text-center text-gray-400 text-xs">
                            {activeModel === m.model ? '▲ hide' : '▼ show'}
                          </td>
                        </tr>
                        {/* Expandable top recs */}
                        {activeModel === m.model && m.topRecs?.length > 0 && (
                          <tr key={`${m.model}-recs`}>
                            <td colSpan={6} className="px-5 py-4 bg-slate-50">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {m.model} recommended instead:
                              </p>
                              <div className="space-y-2">
                                {m.topRecs.map(r => (
                                  <div key={r.rank} className="flex items-start gap-3 bg-white rounded-lg px-4 py-3 border border-gray-100">
                                    <span className={`text-xs font-bold w-6 flex-shrink-0 mt-0.5 ${r.rank===1?'text-emerald-600':r.rank===2?'text-amber-600':'text-gray-400'}`}>#{r.rank}</span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{r.name}</p>
                                      <p className="text-xs text-gray-500">{r.reason}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Competitor strip */}
              {results.insights.topCompetitors.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-50 bg-slate-50">
                  <p className="text-xs text-gray-500 font-medium mb-2">Brands AI recommended instead of yours:</p>
                  <div className="flex flex-wrap gap-2">
                    {results.insights.topCompetitors.map(c => (
                      <span key={c} className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ③ WHY YOU'RE LOSING ────────────────────────────── */}
            <div className="card border-red-100">
              <div className="section-head bg-red-50/40 border-b border-red-100">
                <span className="text-lg">🔍</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Why You're Losing to Competitors</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Patterns extracted from AI recommendation logic</p>
                </div>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-6">
                {/* Root causes */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Root Causes</p>
                  <ul className="space-y-3">
                    {results.insights.topReasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center mt-0.5">{i+1}</span>
                        <span className="text-sm text-gray-700 leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Keywords */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Missing From Your Listing</p>
                    <div className="flex flex-wrap gap-2">
                      {results.insights.missingKeywords.map(k => (
                        <span key={k} className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Winning Keywords (Competitors)</p>
                    <div className="flex flex-wrap gap-2">
                      {results.insights.winningKeywords.map(k => (
                        <span key={k} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ④ REWRITE ──────────────────────────────────────── */}
            <div className="card border-indigo-100">
              <div className="section-head bg-indigo-50/40 border-b border-indigo-100">
                <span className="text-lg">✍️</span>
                <div>
                  <h3 className="font-semibold text-gray-800">AI-Optimised Listing Rewrite</h3>
                  <p className="text-xs text-gray-400 mt-0.5">AI rewrites your listing to rank #1 in AI search</p>
                </div>
              </div>

              {!rewrite ? (
                <div className="p-6 flex flex-col items-center gap-3">
                  {!hasListing && !isDemo && (
                    <p className="text-sm text-gray-400 text-center max-w-sm">
                      Paste your listing above or provide an Amazon URL with a Rainforest API key to enable rewrite.
                      You can also try the demo.
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => doRewrite(false)}
                      disabled={rewriting || (!hasListing && !isDemo)}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white font-semibold px-8 py-3 rounded-xl text-sm transition"
                    >
                      {rewriting ? '✍️ AI is rewriting…' : '✨ Rewrite My Listing for AI'}
                    </button>
                    {isDemo && !rewriting && (
                      <button
                        onClick={() => doRewrite(true)}
                        className="border border-dashed border-indigo-200 text-indigo-500 hover:bg-indigo-50 font-medium px-6 py-3 rounded-xl text-sm transition"
                      >
                        🎯 Demo Rewrite
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-5 fade-up">
                  {/* Strategy */}
                  <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-800">
                    <strong>Strategy: </strong>{rewrite.rationale}
                  </div>
                  {/* Title */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Optimised Title</p>
                    <div className="bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 leading-snug">
                      {rewrite.title}
                    </div>
                  </div>
                  {/* Bullets */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bullet Points</p>
                    <ul className="space-y-2">
                      {rewrite.bullets?.map((b, i) => (
                        <li key={i} className="bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Description */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                    <div className="bg-slate-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {rewrite.description}
                    </div>
                  </div>
                  {/* Added keywords */}
                  {rewrite.addedKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Keywords Added</p>
                      <div className="flex flex-wrap gap-2">
                        {rewrite.addedKeywords.map(k => (
                          <span key={k} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-3 py-1">+ {k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Copy */}
                  <button
                    onClick={copyRewrite}
                    className="flex items-center gap-2 text-sm border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-600 rounded-xl px-4 py-2.5 transition"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy All to Clipboard'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="text-center py-4 space-y-1">
              <p className="text-xs text-gray-400">
                Powered by <strong>GPT-4o</strong> · <strong>Claude Opus</strong> · <strong>Gemini 1.5 Pro</strong> · <strong>Rainforest API</strong>
              </p>
              <button onClick={reset} className="text-sm text-indigo-500 hover:text-indigo-700 transition">
                ← Scan another product
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
