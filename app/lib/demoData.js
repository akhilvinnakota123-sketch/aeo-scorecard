// app/lib/demoData.js
// Pre-baked demo results — used when ?demo=true or no API keys set

export const DEMO_QUERY = "best magnesium supplement for seniors"

export const DEMO_RESULT = {
  score: 38,
  modelData: [
    {
      model: "GPT-4o",
      icon: "⚡",
      error: false,
      mentioned: false,
      rank: null,
      sentiment: "neutral",
      summary: "Your product didn't appear in the top 5. GPT-4o recommended brands emphasising 'high absorption', 'gentle on stomach', and 'doctor-recommended' — none of which appear in your current listing.",
      topRecs: [
        { rank: 1, name: "Pure Encapsulations Magnesium Glycinate", reason: "Doctor-recommended, high absorption, gentle formula" },
        { rank: 2, name: "Thorne Magnesium Bisglycinate", reason: "Trusted by healthcare professionals, third-party tested" },
        { rank: 3, name: "Life Extension Magnesium Caps", reason: "Science-backed, bioavailable, senior-focused dosing" },
      ],
    },
    {
      model: "Claude",
      icon: "🔮",
      error: false,
      mentioned: true,
      rank: 4,
      sentiment: "neutral",
      summary: "Your product ranked #4 but Claude flagged missing trust signals. Competitors outrank you on 'third-party tested', 'no laxative effect', and 'senior-appropriate dose' messaging.",
      topRecs: [
        { rank: 1, name: "MagMD Plus", reason: "Specifically marketed for seniors, cardiovascular support" },
        { rank: 2, name: "NOW Foods Magnesium Glycinate", reason: "Widely trusted, affordable, strong review count" },
        { rank: 3, name: "Designs for Health Magnesium Buffered Chelate", reason: "Practitioner-grade, clean label" },
      ],
    },
    {
      model: "Gemini 1.5 Pro",
      icon: "✨",
      error: false,
      mentioned: false,
      rank: null,
      sentiment: "negative",
      summary: "Gemini did not mention your product. It flagged that your listing lacks clinical language and social proof. The description reads as generic — not optimised for AI recommendation systems.",
      topRecs: [
        { rank: 1, name: "Magnesium Breakthrough by BiOptimizers", reason: "7 forms of magnesium, viral brand, strong SEO" },
        { rank: 2, name: "Klaire Labs Magnesium Glycinate Complex", reason: "Hypoallergenic, practitioner trusted" },
        { rank: 3, name: "Pure Encapsulations", reason: "Gold standard in clean supplements" },
      ],
    },
  ],
  insights: {
    topReasons: [
      "Missing 'high absorption' or 'bioavailable' language — top AI trigger for supplement queries",
      "No 'doctor-recommended' or 'healthcare professional' trust signals in listing",
      "No senior-specific benefit callouts (sleep, muscle cramps, heart health)",
      "Competitor review counts are 10x higher — AI models use popularity as a proxy for quality",
    ],
    missingKeywords: [
      "high absorption", "bioavailable", "doctor-recommended",
      "gentle on stomach", "no laxative effect", "senior formula",
    ],
    topCompetitors: [
      "Pure Encapsulations", "Thorne", "Life Extension", "BiOptimizers", "NOW Foods",
    ],
    winningKeywords: [
      "magnesium glycinate", "high absorption", "third-party tested",
      "doctor-recommended", "sleep support", "muscle cramps",
      "gentle formula", "senior-appropriate",
    ],
  },
  listing: `Title: Magnesium Supplement 400mg
Bullets:
- High quality magnesium capsules
- Easy to swallow
- 60 count per bottle
- Made in USA
- Suitable for adults`,
}

export const DEMO_REWRITE = {
  title: "Magnesium Glycinate 400mg for Seniors — High Absorption, Gentle on Stomach, Doctor-Formulated | 60 Capsules | Third-Party Tested | USA Made",
  bullets: [
    "🎯 HIGH ABSORPTION MAGNESIUM GLYCINATE — Unlike cheap oxide forms, our chelated magnesium glycinate is clinically shown to absorb 3x better — so seniors actually feel the difference in sleep, muscle relaxation, and energy within days.",
    "💊 GENTLE ON STOMACH, NO LAXATIVE EFFECT — Specifically formulated for sensitive senior digestive systems. Zero stomach upset, no cramping, no bathroom emergencies. Take it morning or night with confidence.",
    "👩‍⚕️ DOCTOR-RECOMMENDED FORMULA — Developed with board-certified physicians. Thousands of seniors trust this as their #1 magnesium. Third-party tested for purity and potency — no fillers, no surprises.",
    "❤️ SUPPORTS SLEEP, HEART & MUSCLE HEALTH — Magnesium deficiency affects 70% of adults over 60. Our senior-appropriate 400mg dose supports deep sleep, healthy blood pressure, and relief from nighttime leg cramps.",
    "✅ 60-DAY MONEY BACK GUARANTEE — Try it risk-free. If you don't feel better in 30 days, we'll refund you completely. Made in an FDA-registered, GMP-certified USA facility.",
  ],
  description: "As we age, magnesium absorption naturally declines — yet it's the mineral behind 300+ essential body functions. Our Magnesium Glycinate 400mg is specifically designed for seniors who want real results without digestive discomfort.\n\nUnlike generic magnesium supplements, we use the chelated glycinate form — the most bioavailable and gentle option available. Healthcare professionals recommend it precisely because it works without the laxative side effects common in cheaper formulations.\n\nWhether you're struggling with poor sleep, muscle cramps, occasional anxiety, or low energy — this is the supplement your doctor would recommend. Third-party tested, made in the USA, and backed by a 60-day guarantee.",
  addedKeywords: ["magnesium glycinate", "high absorption", "doctor-recommended", "gentle on stomach", "senior formula", "third-party tested", "no laxative effect", "chelated"],
  rationale: "Repositioned from generic supplement to senior-endorsed, doctor-recommended solution — using the exact trust signals AI engines scan for when recommending health products.",
}
