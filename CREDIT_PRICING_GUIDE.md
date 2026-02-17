# ProCreators Credit Pricing System - Complete Overhaul

## Pricing Model Summary

**Base Values:**
- 1 credit = $0.001 (1,000 credits = $1)
- Target profit margin: 55% for most tools
- AI Video margin: 20% (competitive pricing)

---

## Subscription Plans (Updated)

| Plan | Price | Monthly Credits | What You Can Create |
|------|-------|-----------------|---------------------|
| Free | $0 | 500 | ~100 text generations |
| Creator | $19 | 19,000 | ~60 AI images OR 1-2 AI videos |
| Pro | $49 | 49,000 | ~160 AI images OR 4-5 AI videos |
| Business | $99 | 99,000 | ~330 AI images OR 9-10 AI videos |

---

## Credit Packs (One-time Purchases)

| Pack | Price | Credits | Bonus |
|------|-------|---------|-------|
| Starter | $5 | 5,000 | 0% |
| Creator | $14 | 15,000 | 7% |
| Pro | $45 | 50,000 | 11% |
| Business | $130 | 150,000 | 15% |

---

## Tool Pricing by Category

### 💬 Text Tools (Gemini 2.0 Flash) - Very Cheap!
API Cost: ~$0.0005 per call | 55% margin

| Tool | Credits | USD Value |
|------|---------|-----------|
| Jokes, Fortune | 5 | $0.005 |
| Emails, Letters | 8 | $0.008 |
| Blog Posts, Stories | 15-20 | $0.015-0.020 |
| Business Plans | 30 | $0.030 |

### 📄 PDF Tools (Text Only)

| Tool | Credits | USD Value |
|------|---------|-----------|
| Planners, Worksheets | 20 | $0.020 |
| Checklists | 15 | $0.015 |
| Slides | 25 | $0.025 |
| Business Plan PDF | 30 | $0.030 |
| Pitch Deck | 35 | $0.035 |

### 🖼️ Image Tools (Nano Banana Pro @ $0.134/image)
55% margin = 300 credits per image

| Tool | Credits | Images | USD Value |
|------|---------|--------|-----------|
| Single Image | 300 | 1 | $0.30 |
| Carousels | 600 | 2 | $0.60 |
| Storybook | 3,000 | 10 | $3.00 |
| Activity Book | 4,500 | 15 | $4.50 |
| Coloring Book | 7,500 | 25 | $7.50 |

### 🎬 Video Tools

#### Stock Video (Pexels FREE + TTS)
| Tool | Credits | USD Value |
|------|---------|-----------|
| Quick Reels (Stock) | 40 | $0.04 |
| Auto Subtitles | 30 | $0.03 |
| Video Editor | 50 | $0.05 |

#### AI Video (Kling @ $2.80/10s clip) - 20% margin
Base: 10,000 credits for 30 seconds

| Duration | Credits | USD Value | API Cost |
|----------|---------|-----------|----------|
| 15s | 5,000 | $5.00 | $4.20 |
| 30s | 10,000 | $10.00 | $8.40 |
| 60s | 20,000 | $20.00 | $16.80 |
| 5 min | 100,000 | $100.00 | $84.00 |

---

## Profitability Analysis

### Example: Creator Plan ($19/month = 19,000 credits)

**If user creates 60 AI images:**
- User credits spent: 60 × 300 = 18,000 credits
- Our API cost: 60 × $0.134 = $8.04
- Our revenue: $19.00
- **Profit: $10.96 (58%)**

**If user creates 2 AI videos (30s each):**
- User credits spent: 2 × 10,000 = 20,000 credits
- Our API cost: 2 × $8.40 = $16.80
- Our revenue: $19.00
- **Profit: $2.20 (12%)** ← Lower margin on video

### Blended Margin Estimate
Most users will use a mix of text (very profitable) and media (moderate profit).
Expected blended margin: **45-55%**

---

## Files Updated

1. `/app/lib/credits.js` - Backend credit costs
2. `/app/lib/membership.js` - Subscription plan credits
3. `/app/components/CreditCostBadge.jsx` - Frontend cost display
4. `/app/app/pricing/page.js` - Pricing page UI
5. `/app/app/api/stripe/checkout/route.js` - Credit pack pricing
6. `/app/app/dashboard/billing/page.js` - Billing page info

---

## Key Changes from Previous System

| Item | Before | After | Change |
|------|--------|-------|--------|
| Creator Plan Credits | 400 | 19,000 | +4,650% |
| AI Image Cost | 35 | 300 | +757% |
| AI Video (30s) | 200 | 10,000 | +4,900% |
| Coloring Book | 30 | 7,500 | +24,900% |
| Text Tools | 8-20 | 5-20 | ~Same |

The massive increase in credits given with subscriptions balances out the higher individual tool costs.
Users get **47x more credits** for the same price, but tools cost **proportionally more** to reflect actual API costs.

---

## Summary

✅ Every tool is now profitable at 55% margin (20% for AI video)
✅ Subscription credits scaled proportionally (1 credit = $0.001)
✅ Text tools remain affordable for users
✅ Image-heavy tools properly priced for sustainability
✅ AI video priced competitively but profitably
