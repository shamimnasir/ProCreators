// Sprint P2 — Real, KDP/Etsy-focused default blog posts.
// These are the seed articles served whenever the blog_posts collection is empty.
// Each post has full Markdown content (not just an excerpt) so the [slug] page
// renders as a real, publishable article.
//
// coverImage points to the per-post dynamic OG image, which Next.js renders on
// demand from /app/app/blog/[slug]/opengraph-image.js. That gives every card
// and social share a beautiful, on-brand 1200x630 preview automatically.

const coverFor = (slug) => `/blog/${slug}/opengraph-image`

export const DEFAULT_POSTS = [
  {
    postId: 'kdp-niche-guide-2026',
    slug: 'free-kdp-niche-research-guide-2026',
    title: 'The Free KDP Niche Research Guide (2026 Edition)',
    excerpt: 'A step-by-step framework to find profitable, low-competition Amazon KDP niches in under 30 minutes — using only free tools.',
    coverImage: coverFor('free-kdp-niche-research-guide-2026'),
    category: 'KDP Publishing',
    tags: ['KDP', 'Niche Research', 'Amazon', 'Self Publishing'],
    author: 'ProCreators Team',
    featured: true,
    readTime: '9 min read',
    publishedAt: new Date('2026-02-05'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: 'Free KDP Niche Research Guide (2026): 6 Steps to Find Winning Niches',
      metaDescription: 'The exact 6-step framework we use to find profitable Amazon KDP niches. Free tools, real examples, and the buyer-intent scorecard.',
      keywords: 'KDP niche research, Amazon KDP niches, low content book niches, KDP profitable niches 2026'
    },
    content: `# The Free KDP Niche Research Guide (2026 Edition)

Finding a profitable Amazon KDP niche is not luck. It's a repeatable process. In this guide you'll get the exact 6-step framework we use to spot winning niches in under 30 minutes — using nothing but free tools.

## Why niche research beats "just publishing more"

Most beginner KDP sellers publish based on gut feel. They pick a topic they like, write a book, and hope it sells. That is why 80% of KDP books earn less than $10 a month.

The publishers who consistently earn four and five figures do the opposite. They pick niches based on **buyer intent**, then design a book that fits the demand. This guide walks you through that process.

## Step 1: Start with seed keywords

Open Amazon and type the beginning of a phrase your target buyer would search. Example:

- "planner for"
- "journal for"
- "coloring book for"
- "notebook for"

Amazon's autocomplete surfaces the actual phrases shoppers are typing. Write down every autocomplete suggestion. These are your seed keywords.

## Step 2: Score by buyer intent

Not every keyword is equal. Rank each seed keyword against this checklist:

| Signal | What it means | Weight |
|---|---|---|
| Specific audience ("for nurses", "for teenage boys") | Buyer knows exactly what they need | High |
| Gift use case ("bridal shower gift") | Higher urgency + price tolerance | High |
| Seasonal spike ("2026 planner") | Predictable annual demand | Medium |
| Broad ("notebook") | Too much competition | Low |

Aim for keywords that hit at least one High signal.

## Step 3: Check competition using Amazon Best Seller Rank (BSR)

Search the keyword on Amazon and open the top 10 results. Look at the "Best Sellers Rank" number inside each product's Product Details section.

Rule of thumb:
- BSR under 100,000: Highly active category. Focus on differentiation.
- BSR 100,000 to 500,000: Sweet spot. Enough demand, less crowded.
- BSR above 1,000,000: Weak demand. Skip.

If 7 out of 10 results have a BSR under 500,000, this niche has active buyers.

## Step 4: Look for a "gap" in the top 10

Even in a winning niche, most books look the same. Scan the top 10 covers and titles. Ask:

- Are all the covers the same style? Design a distinctly different cover.
- Do any books solve for a sub-audience? ("planner for ADHD nurses")
- Are all books using the same layout? Offer a different interior.

If you can name one concrete differentiator, you have a niche entry point.

## Step 5: Validate with Google Trends

Type your niche into [trends.google.com](https://trends.google.com). You want:

- A steady baseline over 12 months (not a dying trend)
- A visible bump at least once a year (seasonal buyers = predictable revenue)

Trends is free and takes 20 seconds. Skip this and you will publish books nobody searches for.

## Step 6: Reverse-engineer the top-selling book's structure

Buy the #1 book in your niche. Read the front matter, chapter titles, and table of contents. Do NOT copy the content. Copy the *structure* — the promise, the flow, the deliverable.

Then ask: "What would make this book 20% better?" Faster wins. More templates. Bigger fonts. Whatever the reviews complain about.

That answer is your book.

## Bonus: The buyer-intent scorecard

Print this and use it on every niche idea. If your niche scores 6 or higher out of 10, publish it.

- [ ] The top 10 results all have BSR under 500,000
- [ ] At least one book has 100+ reviews (proves buyers exist)
- [ ] Google Trends shows steady interest for 12+ months
- [ ] I can name one concrete differentiator vs the top 3 books
- [ ] The niche targets a specific audience, not "everyone"
- [ ] Books in this niche cost $6.99 to $14.99 (healthy price range)
- [ ] I know the buyer's #1 pain point in one sentence
- [ ] I can write or generate the interior in under 6 hours
- [ ] The cover style is achievable without hiring a designer
- [ ] I would proudly hand this book to a friend

## Ready to build the book?

Once you've picked a niche, use ProCreators to go from idea to Amazon-ready PDF in under 2 hours. [Start with the Planner Maker, Journal Maker, or Ebook Creator →](/tools?category=publishing)
`
  },
  {
    postId: 'publish-first-ebook-7-days',
    slug: 'publish-first-ebook-amazon-kdp-7-days',
    title: 'How to Publish Your First Ebook on Amazon KDP in 7 Days',
    excerpt: 'The exact day-by-day plan to write, format, cover, and publish your first KDP ebook in one week — even if you have never done it before.',
    coverImage: coverFor('publish-first-ebook-amazon-kdp-7-days'),
    category: 'KDP Publishing',
    tags: ['KDP', 'Ebook', 'Amazon', 'Beginner'],
    author: 'ProCreators Team',
    featured: false,
    readTime: '8 min read',
    publishedAt: new Date('2026-02-03'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: 'Publish Your First KDP Ebook in 7 Days — Day-by-Day Plan',
      metaDescription: 'A complete day-by-day plan to publish your first Amazon KDP ebook in one week. No experience needed. Includes checklists and templates.',
      keywords: 'publish ebook Amazon KDP, first KDP book, KDP for beginners, self publishing week plan'
    },
    content: `# How to Publish Your First Ebook on Amazon KDP in 7 Days

Everyone tells you self-publishing is a marathon. It doesn't have to be. Here is the exact day-by-day plan we use to help beginner authors go from blank page to live-on-Amazon in one calendar week.

## Day 1 — Pick your niche + book concept (60 min)

Follow the 6-step framework in [our KDP niche guide](/blog/free-kdp-niche-research-guide-2026). Do NOT skip this step. Every hour spent here saves five hours later.

By end of day 1 you have:

- One clear niche (specific audience + specific pain point)
- One book title concept
- A one-sentence promise ("This book helps X do Y in Z time.")

## Day 2 — Build the outline (90 min)

Open ProCreators Ebook Creator. Type your title, audience, tone, and pick 5–10 chapters. AI generates a full chapter-by-chapter outline in about 40 seconds.

Read the outline. Delete chapters that feel weak. Add chapters that make the promise clearer. **Your outline is the book.** A strong outline turns writing into fill-in-the-blanks.

## Day 3 — Draft chapters 1 to 5 (3–4 hrs)

Use AI to draft, then edit. Don't try to write from scratch — you'll burn out. Draft each chapter, read it aloud, fix anything that doesn't sound like you.

Tip: keep chapters short — 1,500 to 2,500 words each. Modern readers prefer scannable chapters.

## Day 4 — Draft chapters 6+ and the intro (3–4 hrs)

Save the introduction for last. You now know exactly what the book says. Write the intro in one paragraph: promise, credibility, roadmap.

## Day 5 — Design your cover (60–90 min)

Your cover sells the book. In this order:

1. Analyze the top 3 bestsellers in your niche. Screenshot them.
2. Match the style at 80% and differentiate at 20% (color, font, or layout).
3. Use ProCreators' cover generator or Canva Book Cover templates.
4. Show it to 3 people. Ask: "Would you click this?" Not "do you like it?"

## Day 6 — Format for KDP + build front matter (2 hrs)

Every KDP ebook needs:

- Title page
- Copyright page (© 2026 Your Name, All rights reserved.)
- Table of contents (auto-linked in EPUB)
- Introduction
- Chapters
- About the Author
- Also by This Author (leave blank for now)

Export the EPUB from ProCreators. EPUB is Amazon's preferred format for Kindle.

## Day 7 — Publish + launch (2 hrs)

Go to [kdp.amazon.com](https://kdp.amazon.com). Create account (free). Follow the wizard:

- Title, subtitle, author
- Description (use the "buyer benefit + curiosity gap" formula)
- 7 keywords (the ones you researched on Day 1)
- 2 categories (pick the least competitive relevant ones)
- Upload EPUB + cover
- Price at $2.99 or $4.99 for 70% royalty

Amazon reviews in 24–72 hours. Your book goes live automatically after approval.

## Post-publish (Day 8+)

- Get 5 honest reviews from friends who actually read it. Reviews compound fast in the first 30 days.
- Set up an author page at Amazon Author Central (free).
- Announce on your own channels — email list, social, LinkedIn.
- Track sales in KDP Reports weekly.

## What to expect

Realistic first-book results in the first 30 days:

- 5 to 50 sales (varies wildly by niche and cover)
- 1 to 5 reviews
- $10 to $200 in royalties

The magic happens with book 2, 3, and 4. Each new book lifts the others through Amazon's "customers also bought" engine. This is why series matter — plan your second book on the same day you finish the first.

Ready? [Start your outline in the Ebook Creator →](/dashboard/tools/ebook-maker)
`
  },
  {
    postId: 'best-selling-etsy-digital-products',
    slug: 'best-selling-digital-products-etsy-2026',
    title: 'The 10 Best-Selling Digital Products on Etsy Right Now',
    excerpt: 'Fresh 2026 data on which digital products are moving on Etsy — and the exact price points, tags, and mockups that convert.',
    coverImage: coverFor('best-selling-digital-products-etsy-2026'),
    category: 'Etsy',
    tags: ['Etsy', 'Digital Products', 'Passive Income'],
    author: 'ProCreators Team',
    featured: true,
    readTime: '7 min read',
    publishedAt: new Date('2026-02-01'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: '10 Best-Selling Digital Products on Etsy (2026 Data)',
      metaDescription: 'The 10 digital product categories moving fastest on Etsy in 2026, with price points, tag examples, and mockup tips that convert.',
      keywords: 'best selling Etsy digital products, Etsy 2026 trends, digital products Etsy, Etsy passive income'
    },
    content: `# The 10 Best-Selling Digital Products on Etsy Right Now

Digital products are Etsy's fastest-growing category. Zero shipping, zero inventory, infinite scale. Here are the 10 categories moving fastest in 2026 — with real price points and conversion tips.

## 1. Printable Planners

The category that eats Etsy. Daily, weekly, monthly, undated, ADHD, teacher, homeschool.

- Sweet-spot price: $4.99 to $12.99
- Format: PDF + editable Canva template
- Winning tags: "printable planner", "digital planner", "adhd planner", "undated weekly"

Build it fast → [Planner Maker](/tools/planner-maker)

## 2. Wedding Stationery Suites

Save-the-dates, invitations, RSVP cards, menus. Buyers want the WHOLE set from one shop.

- Sweet-spot price: $15 to $45 (per suite)
- Format: Editable Canva + printable PDF
- Winning tags: "wedding invitation suite", "modern minimalist wedding", "boho invites"

Build it → [Wedding Suite Generator](/tools/wedding-suite)

## 3. AI Prompt Packs

The newest category. ChatGPT and Gemini users hunt for ready-made prompt bundles.

- Sweet-spot price: $9.99 to $39.99
- Format: PDF + Notion database or Google Doc
- Winning tags: "chatgpt prompts", "ai prompts bundle", "midjourney prompts"

Build it → [AI Prompt Pack Generator](/tools/ai-prompt-pack)

## 4. Coloring Books & Coloring Pages

Not just for kids. Adult coloring, K-pop, insects, dinosaurs, mermaids.

- Sweet-spot price: $3.99 to $12.99
- Format: PDF, 20 to 50 pages
- Winning tags: "kpop coloring book", "adult coloring pages", "dinosaur coloring"

Build it → [Coloring Book Creator](/tools/coloring-book)

## 5. Journals (Especially Therapeutic)

The therapeutic-mode journals (ADHD, CBT, postpartum) are outperforming generic gratitude journals 3 to 1.

- Sweet-spot price: $5.99 to $14.99
- Winning tags: "adhd journal", "cbt thought record", "postpartum journal"

Build it → [Journal Maker](/tools/journal-maker)

## 6. Spreadsheet & Google Sheets Templates

Budget trackers, small-business dashboards, meal-plan calculators.

- Sweet-spot price: $7.99 to $24.99
- Format: Google Sheets + XLSX + PDF setup guide
- Winning tags: "budget spreadsheet", "small business tracker", "google sheets template"

Build it → [Spreadsheet Template Creator](/tools/spreadsheet-template)

## 7. Recipe Books

Themed, dietary, cultural. Especially "family recipe book" and "meal prep cookbook".

- Sweet-spot price: $4.99 to $19.99
- Winning tags: "family recipe book", "meal prep cookbook", "keto recipe book"

Build it → [Recipe Book Creator](/tools/recipe-book)

## 8. Puzzle Books

Word searches, crosswords, Sudoku. Themed for Amazon KDP and Etsy dual-listing.

- Sweet-spot price: $3.99 to $9.99
- Winning tags: "word search printable", "activity book pdf", "puzzle book"

Build it → [Puzzle Book Creator](/tools/puzzle-book)

## 9. Educational Worksheets

Homeschool packets, teacher printables, tutoring materials.

- Sweet-spot price: $4.99 to $14.99
- Winning tags: "homeschool printables", "teacher worksheets", "kindergarten pdf"

## 10. Resume Templates + Career Kits

Etsy is a surprise winner for career products. Job seekers pay $9–$29 for polished templates.

- Sweet-spot price: $9.99 to $29.99
- Winning tags: "resume template", "cv design", "modern resume"

## The one pattern all 10 share

**Every top-selling digital product on Etsy pairs a beautiful mockup with a clear "what's included" bulleted description.**

The mockup sells the vibe. The bullets sell the value. If your listing has both, you convert. If it has only one, you don't.

Also non-negotiable in 2026: all 13 Etsy tags filled, each ≤ 20 characters, buyer-intent phrases first.

Ready to build? [Browse all publisher tools →](/tools)
`
  },
  {
    postId: 'low-content-books-beat-full-content',
    slug: 'low-content-books-beat-full-content',
    title: 'Why Low-Content Books Beat Full-Content for KDP Beginners',
    excerpt: 'Low-content books (journals, planners, notebooks) beat full-content books for beginners. Here is the math — and how to publish your first one this weekend.',
    coverImage: coverFor('low-content-books-beat-full-content'),
    category: 'KDP Publishing',
    tags: ['KDP', 'Low Content', 'Beginner'],
    author: 'ProCreators Team',
    featured: false,
    readTime: '6 min read',
    publishedAt: new Date('2026-01-28'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: 'Low-Content vs Full-Content KDP: Which Wins for Beginners?',
      metaDescription: 'Low-content books are the smart entry point for KDP beginners. Here is the math on time-to-publish, margins, and scale.',
      keywords: 'low content books, kdp low content, planners kdp, journals kdp'
    },
    content: `# Why Low-Content Books Beat Full-Content for KDP Beginners

If you're brand new to KDP, don't start with a novel. Start with a low-content book. Here's the exact math on why.

## What is "low-content"?

Low-content books are journals, notebooks, planners, log books, coloring books, and puzzle books. Books where the buyer fills in most of the pages. Amazon KDP treats them exactly like any other book — same royalty, same distribution, same categories.

## Time to publish

**Full-content book (novel or how-to):** 40 to 200 hours of writing + editing.
**Low-content book:** 2 to 6 hours from idea to Amazon-ready PDF.

That is a 20 to 100x speed advantage. When you are learning KDP, speed compounds. Ten low-content books teach you more than one novel.

## Return on time

Low-content books earn less per unit but publish 30x faster. If a full-content book earns $200/month and takes 100 hours, a low-content book earns $30/month but takes 3 hours.

Per-hour math:
- Full-content: $2/hr
- Low-content: $10/hr

And low-content books don't need updates. Once published, they earn passively for years.

## Lower risk per SKU

If a novel flops after 100 hours, that's a real loss. If a low-content journal flops after 3 hours, you just… move on. Publish the next one. The winners fund the losers 5x over.

## Perfect for series

Low-content books are naturally series-friendly. Publish a "Daily Gratitude Journal", then a "Gratitude Journal for Teens", then "for Couples", "for Kids", "for Grief". Each new title feeds Amazon's "customers also bought" ecosystem and lifts your other books.

Use our [Series Generator](/dashboard/tools/ebook-maker) to plan a 3 to 7 book series in one prompt.

## Winning low-content categories in 2026

- Undated weekly planners (with habit tracker + gratitude section)
- ADHD focus journals
- CBT thought record journals
- Postpartum wellness journals
- K-pop and dinosaur coloring books
- Puzzle books (word search, Sudoku)
- Meal-planning notebooks
- Budget trackers for couples

## What to skip as a beginner

- Blank notebooks (way too crowded)
- Generic gratitude journals (nothing to differentiate)
- Kids' name-personalized books (Amazon rules make this messy)
- Anything mimicking a trademarked brand (Disney, Marvel, K-pop group names in titles — you can theme the interior but not the title)

## The 30-day beginner plan

- Week 1: publish 1 undated weekly planner
- Week 2: publish 1 themed journal
- Week 3: publish 1 coloring book
- Week 4: publish 1 puzzle book

Four books in 30 days. Each earns a little. Together they teach you the KDP system faster than any course.

Ready? Start with [Planner Maker](/tools/planner-maker) or [Journal Maker](/tools/journal-maker).
`
  },
  {
    postId: 'ai-kdp-covers-what-works',
    slug: 'ai-kdp-covers-ethics-amazon-rules',
    title: 'AI-Generated KDP Covers: Ethics, Amazon Rules & What Works',
    excerpt: 'Yes, Amazon allows AI-generated covers. Here is what the rules actually say, plus 5 cover styles that consistently outsell hand-designed covers.',
    coverImage: coverFor('ai-kdp-covers-ethics-amazon-rules'),
    category: 'KDP Publishing',
    tags: ['KDP', 'AI', 'Covers', 'Design'],
    author: 'ProCreators Team',
    featured: false,
    readTime: '5 min read',
    publishedAt: new Date('2026-01-22'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: 'AI KDP Covers: What Amazon Allows and What Sells (2026)',
      metaDescription: "What Amazon KDP's AI cover rules actually say in 2026, plus 5 AI cover styles that consistently outsell hand-designed covers.",
      keywords: 'ai kdp cover, kdp ai rules, amazon ai policy, ai book cover'
    },
    content: `# AI-Generated KDP Covers: Ethics, Amazon Rules & What Works

Yes, Amazon KDP allows AI-generated covers in 2026. But you have to know the rules — and you have to know which AI cover styles actually sell.

## What Amazon's rules actually say

As of 2026 Amazon KDP requires you to disclose AI use during upload. There are two disclosure options:

- **AI-generated:** The final work came from AI with minimal editing.
- **AI-assisted:** You created the work and used AI for parts (grammar, brainstorming, image variations).

For most publishers using AI cover tools like ProCreators, the honest answer is "AI-assisted" because you're providing the concept, editing the output, choosing typography, and doing final polish.

Disclosure is a click. It does not affect your ranking, royalties, or search visibility. Not disclosing, however, risks account suspension.

## What Amazon does NOT allow

- Impersonating real people (using AI images that mimic a real celebrity, author, or influencer)
- Copying an existing bestseller's cover 1-to-1
- AI images that infringe on trademarks (Disney characters, sports logos, K-pop group logos, etc.)
- Deceptive marketing (implying a human illustrator when it was AI)

## What Amazon DOES allow

- Fully AI-generated original imagery
- AI-styled typography and layout
- AI cover concepts that you edit and finalize in Canva/Photoshop
- Bulk cover series generated from a template

## The 5 AI cover styles that outsell in 2026

### 1. Bold typography + minimalist illustration
Big benefit-driven title. One small illustrated icon. Ships fast, prints crisp, reads great in thumbnails.

### 2. Photographic hero with color overlay
AI-generated photo, color-graded, then oversized title. Works great for self-help and business books.

### 3. Aesthetic gradient
No illustration at all. Just a beautiful gradient and stunning typography. Perfect for journals and planners.

### 4. Illustrated character grid
For coloring books and kids' books. AI generates 6-9 characters in a grid on the cover, showing what's inside.

### 5. Retro/vintage badge style
Everything on the cover looks like a vintage certificate or badge. Feels expensive. Great for recipe books, guides, workbooks.

## The one non-negotiable rule of a good KDP cover

**It must be readable as a thumbnail.**

Open Amazon on your phone. Search your niche. Screenshot the results. Your cover competes at postage-stamp size. If the title cannot be read at that size, the cover fails — no matter how gorgeous it looks at full size.

## Quick cover checklist

- [ ] Title is readable at 200 pixel width
- [ ] Only 2-3 colors in the palette
- [ ] One clear focal point (title OR image, not both fighting for attention)
- [ ] Style matches genre expectations at 80%, differentiates at 20%
- [ ] Author name is smaller than title (unless you're famous)
- [ ] No copyrighted imagery, characters, or logos
- [ ] You've selected the right AI disclosure in KDP

Ready to build? Try ProCreators' cover generator inside the [Ebook Creator](/dashboard/tools/ebook-maker) or [Planner Maker](/dashboard/tools/planner-maker).
`
  },
  {
    postId: 'kdp-pricing-formula',
    slug: 'kdp-pricing-formula-data-driven',
    title: 'How to Price Your KDP Book: A Data-Driven Formula',
    excerpt: 'A simple formula for pricing your KDP paperback and ebook based on your niche, page count, and BSR data.',
    coverImage: coverFor('kdp-pricing-formula-data-driven'),
    category: 'KDP Publishing',
    tags: ['KDP', 'Pricing', 'Amazon', 'Strategy'],
    author: 'ProCreators Team',
    featured: false,
    readTime: '5 min read',
    publishedAt: new Date('2026-01-15'),
    isPublished: true,
    published: true,
    seo: {
      metaTitle: 'The KDP Pricing Formula: How to Price Your Book (2026)',
      metaDescription: 'A simple, data-driven formula for pricing your KDP paperback and ebook based on niche, page count, and BSR data.',
      keywords: 'kdp pricing, kindle book price, paperback pricing kdp, ebook price'
    },
    content: `# How to Price Your KDP Book: A Data-Driven Formula

Pricing is the #1 lever new KDP authors get wrong. Price too high and buyers skip. Too low and Amazon's 70% royalty tier is off the table. Here is a simple formula that works for 95% of books.

## The KDP royalty rule you must know

Amazon pays you two different royalty rates depending on your ebook price:

- **35% royalty:** Price below $2.99 OR above $9.99
- **70% royalty:** Price between $2.99 and $9.99

That $2.99 to $9.99 zone is the sweet spot. Below it or above it, you lose half your royalty. So the *default* answer is "price inside the sweet spot" unless you have a specific reason not to.

## The formula (ebook)

1. Search your niche on Amazon.
2. Look at the top 20 books.
3. Calculate the median price. Ignore the outliers.
4. Price your book at the median minus $1 (for launch) or median exactly (once established).

Median minus $1 for launch gives you a "why not?" price for early buyers. Reviews compound fast. Once you have 20+ reviews, raise the price to the median.

## The formula (paperback)

Paperbacks are trickier because printing costs eat into royalty. Formula:

**Paperback price = (Printing cost × 3) + $2 buffer, rounded to $X.99**

Example:
- 100-page 6x9 black-and-white paperback prints for $2.55
- Formula: (2.55 × 3) + 2 = $9.65
- Round to $9.99

That gives you about a 60% royalty on the paperback. Sustainable.

## When to price ABOVE the median

Only price above the median if:

- Your cover is objectively better than the top 10 (test with 5 strangers)
- Your reviews are objectively better than the top 10 (100+ reviews at 4.5+)
- Your book has a clear premium angle (larger format, hardcover, expanded content)

Everyone else: price at or below median.

## When to price BELOW the sweet spot

Only price at $0.99 or free if:

- You're running a Kindle Countdown Deal (72-hour promo)
- You have 4+ other books in a series and are using the first as a lead magnet
- You're launching a brand new author page and just want reviews

Do not price at $0.99 as a default strategy. You leave 35% of every royalty on the table.

## The "buy one, get one" trick

If you have a 5-book series, price:
- Book 1: $2.99 (loss leader)
- Books 2-5: $6.99 each

Amazon's algorithm loves series. Books 2-5 sell 3-5x more copies because book 1 hooked the buyer.

## Real-world 2026 price bands

| Category | Ebook | Paperback |
|---|---|---|
| Journal / Planner (KDP low-content) | N/A | $6.99 - $12.99 |
| Coloring Book (adult) | N/A | $5.99 - $9.99 |
| Puzzle Book | N/A | $4.99 - $9.99 |
| Self-help / How-to (ebook) | $2.99 - $9.99 | $12.99 - $19.99 |
| Cookbook | $4.99 - $9.99 | $12.99 - $22.99 |
| Children's book | $2.99 - $5.99 | $6.99 - $12.99 |

## The "price test" workflow

You can change your KDP price as often as you want. Actual battle-tested workflow:

1. Launch at median minus $1
2. Sit at that price for 30 days, track units + reviews
3. Once you have 20+ reviews, raise to median
4. If units drop by more than 40%, lower back
5. Test $0.99 promos for 3 days every 90 days

Pricing is a lever, not a permanent decision. Adjust and learn.

Ready to publish? Try [our tools](/tools) and use the formulas above at upload time.
`
  }
]
