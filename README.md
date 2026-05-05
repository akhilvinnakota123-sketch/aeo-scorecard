# 🎯 AI Visibility Scorecard — AEO Diagnostic for Amazon Sellers

> Ask GPT-4o, Claude, and Gemini the same question your customer would. See exactly where you rank, why you're losing, and get your listing rewritten in one click.

**Built for Pixii.ai Founding Engineer take-home**

---

## ⚡ DEPLOY IN 10 MINUTES — STEP BY STEP

### STEP 1 — Clone & Open

```bash
# If you downloaded as ZIP — unzip and open folder
# If cloning from GitHub:
git clone https://github.com/YOUR_USERNAME/aeo-scorecard.git
cd aeo-scorecard
```

### STEP 2 — Install

```bash
npm install
```

### STEP 3 — Set API Keys

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

| Key | Where to get it | Free tier? |
|-----|----------------|------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | $5 credit for new accounts |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | $5 credit for new accounts |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey | Free |
| `RAINFOREST_API_KEY` | https://www.rainforestapi.com | Free trial (for Amazon scraping) |

> ⚠️ **No Rainforest key?** The app still works — just paste listing text manually.

### STEP 4 — Run locally

```bash
npm run dev
```

Open: http://localhost:3000

### STEP 5 — Deploy to Vercel (free, 2 minutes)

1. Push to a public GitHub repo
2. Go to https://vercel.com/new
3. Import your repo
4. Add your API keys in **Project Settings → Environment Variables**
5. Click **Deploy**

Done. Share the URL.

---

## 🎯 DEMO MODE (no API keys needed)

Click **"Try Demo"** on the homepage — shows a pre-built analysis for:
> *"best magnesium supplement for seniors"*

Full score, all 3 AI engine results, competitor analysis, and rewrite.
Perfect for showing judges without burning API credits.

---

## 🛠️ What It Does

| Section | What it shows |
|---------|--------------|
| **AI Visibility Score** | 0–100 score across all 3 AI engines |
| **AI Engine Results** | Side-by-side: mentioned? rank? sentiment? |
| **Why You're Losing** | Root causes + missing keywords + winning competitor keywords |
| **Listing Rewrite** | Claude rewrites your title, bullets, description for AI search |

---

## 🔧 APIs Used

- **OpenAI GPT-4o** — AI engine 1
- **Anthropic Claude Opus** — AI engine 2 + listing rewrite
- **Google Gemini 1.5 Pro** — AI engine 3
- **Rainforest API** — Amazon product data scraping

---

## 📁 Project Structure

```
aeo-scorecard/
├── app/
│   ├── page.jsx              ← Main UI (all in one file)
│   ├── layout.js             ← Root layout
│   ├── globals.css           ← Tailwind + animations
│   ├── lib/
│   │   └── demoData.js       ← Demo mode mock data
│   └── api/
│       ├── analyze/route.js  ← Calls all 3 AIs in parallel
│       └── rewrite/route.js  ← Claude listing rewriter
├── .env.example              ← Copy to .env.local
├── package.json
└── vercel.json               ← One-click Vercel deploy
```

---

## 🚀 If I Had More Time

1. **Weekly monitoring** — sellers get an email every Monday with their score change
2. **Competitor tracker** — track 5 competitors alongside your own listing
3. **Score history chart** — see how your visibility changes as you update your listing
4. **Batch analysis** — upload a CSV of 50 products, get all scores
5. **Shopify / Amazon integration** — push the rewritten listing back to your store

---

## 👤 Built by Akhil Vinnakota

- Product Developer at Amadeus
- MBA candidate at MAHE (GPA 9.6)
- akhilvinnakota123@gmail.com
