import { runSimpleGeneration } from '@/lib/simple-generator'

export async function POST(request) {
  return runSimpleGeneration(request.clone(), {
    toolId: 'puzzle-book',
    creditCost: 8,
    systemPrompt: `You are a themed puzzle book creator for the Amazon KDP low-content book market. You produce complete, ready-to-format word-search puzzle books with themed word lists that outsell generic puzzle books 4:1.`,
    userPrompt: await puzzlePrompt(request),
    postProcess: (text, body) => {
      // Extract the word lists and generate a printable grid for each puzzle
      const puzzles = parseThemesFromMarkdown(text)
      const gridBlocks = puzzles.map((p, i) => renderPuzzleGrid(p, i + 1)).join('\n\n')
      return { content: text + (gridBlocks ? '\n\n---\n\n# Printable Puzzle Grids\n\n' + gridBlocks : '') }
    },
  })
}

async function puzzlePrompt(request) {
  const b = await request.json().catch(() => ({}))
  const theme = b.theme || 'Ocean Animals'
  const puzzleCount = Number(b.puzzleCount) || 20
  const difficulty = b.difficulty || 'Medium'
  const audience = b.audience || 'Adults'
  return `Create a themed word-search puzzle book.

Theme: ${theme}
Difficulty: ${difficulty} (Easy=8-12 words, Medium=12-16 words, Hard=16-22 words per puzzle)
Audience: ${audience}
Total puzzles: ${puzzleCount}

Structure:
# ${theme} Word Search: ${puzzleCount} Themed Puzzles

## Foreword
2 sentences explaining the theme and how to enjoy the book.

## Puzzles
Produce EXACTLY ${puzzleCount} puzzles. Each uses this exact structure so a downstream generator can build printable grids:

### Puzzle N: [Themed Sub-title]
Word list (all UPPERCASE, no spaces, no hyphens, one per line):
\`\`\`
WORD1
WORD2
WORD3
\`\`\`

---

## Answer Key Note
A short note that solutions appear in the printable grid section of the book.

Return Markdown only. Words must be single strings (no spaces).`
}

// -------- helpers --------
function parseThemesFromMarkdown(md) {
  const puzzles = []
  const re = /###\s+Puzzle\s+\d+:[^\n]*\n[^\n]*Word list[^\n]*\n```\n([\s\S]*?)\n```/g
  let m
  while ((m = re.exec(md))) {
    const words = m[1].split(/\n/).map(w => w.trim().toUpperCase().replace(/[^A-Z]/g, '')).filter(Boolean)
    puzzles.push({ words })
  }
  return puzzles
}

function renderPuzzleGrid({ words }, idx) {
  const size = Math.max(12, Math.min(20, Math.ceil(Math.sqrt(words.join('').length) * 1.4)))
  const grid = Array.from({ length: size }, () => Array(size).fill(''))
  // Simple placement: horizontal, vertical, diagonal down-right
  const dirs = [[0, 1], [1, 0], [1, 1]]
  const rand = (n) => Math.floor(Math.random() * n)
  for (const w of words) {
    if (w.length > size) continue
    let placed = false
    for (let attempt = 0; attempt < 60 && !placed; attempt++) {
      const [dr, dc] = dirs[rand(dirs.length)]
      const r = rand(size - dr * w.length)
      const c = rand(size - dc * w.length)
      let ok = true
      for (let i = 0; i < w.length; i++) {
        const cell = grid[r + dr * i][c + dc * i]
        if (cell && cell !== w[i]) { ok = false; break }
      }
      if (!ok) continue
      for (let i = 0; i < w.length; i++) grid[r + dr * i][c + dc * i] = w[i]
      placed = true
    }
  }
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const rendered = grid.map(row => row.map(ch => ch || alpha[rand(26)]).join(' ')).join('\n')
  return `### Puzzle ${idx} Grid\n\n\`\`\`\n${rendered}\n\`\`\`\n\n_Word list: ${words.join(', ')}_`
}
