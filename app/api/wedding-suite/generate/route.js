import { runSimpleGeneration } from '@/lib/simple-generator'

export async function POST(request) {
  return runSimpleGeneration(request.clone(), {
    toolId: 'wedding-suite',
    creditCost: 12,
    systemPrompt: `You are a wedding stationery copywriter. You write the exact wording that appears on printable wedding stationery suites that sell for $25-$65 on Etsy.

You produce a COMPLETE 8-piece stationery suite in one output, matched to the requested style and details.`,
    userPrompt: await weddingPrompt(request),
  })
}

async function weddingPrompt(request) {
  const b = await request.json().catch(() => ({}))
  const style = b.style || 'Rustic'
  const couple = b.couple || 'Alex & Jordan'
  const date = b.weddingDate || 'June 15, 2026'
  const venue = b.venue || 'Riverside Estate, Napa Valley'
  const time = b.time || '4:00 PM ceremony, reception to follow'
  const dressCode = b.dressCode || 'Cocktail attire'
  const rsvpBy = b.rsvpBy || 'May 1, 2026'
  return `Write a complete 8-piece wedding stationery suite.

Couple: ${couple}
Wedding date: ${date}
Venue: ${venue}
Ceremony + reception: ${time}
Dress code: ${dressCode}
RSVP deadline: ${rsvpBy}
Aesthetic style: ${style}

Produce EXACTLY 8 pieces in this order. Each piece uses ### as the header and delivers the ready-to-print copy with layout notes in italics.

# ${style} Wedding Suite for ${couple}

### 1. Save-the-Date Card
[full copy, formatted as it would appear]

*Design notes:* Layout, font pairing suggestion, and accent element for ${style} theme.

### 2. Formal Invitation
[full formal wording using traditional structure]

*Design notes:* ...

### 3. RSVP Card
[headers, response lines, meal choice options if relevant]

*Design notes:* ...

### 4. Details Card
[accommodation, dress code, transportation, wedding website]

*Design notes:* ...

### 5. Ceremony Program
[Processional, readings, vows, unity ritual, recessional]

*Design notes:* ...

### 6. Reception Menu
[Menu items with elegant descriptions - courses assumed]

*Design notes:* ...

### 7. Table Numbers & Seating Chart Header
[Table number card copy for tables 1-10 + seating chart header]

*Design notes:* ...

### 8. Thank You Card
[warm, personal wording]

*Design notes:* ...

---

## Brand Kit for this Suite
- Color palette (3-5 colors) suited to ${style}
- 2 font pairing suggestions (heading + body)
- 3 motif ideas (florals, monograms, illustrations)

Return Markdown only.`
}
