// =====================================================
// HTML → Markdown conversion for blog editor paste support
// =====================================================
// Converts pasted HTML (from Google Docs, Word, web pages) into
// clean Markdown that the blog renderer (react-markdown + remark-gfm)
// can render as headings, lists, tables, links, images, etc.
//
// Lazy-loaded on the client only.
import TurndownService from 'turndown'

let _service = null

function getService() {
  if (_service) return _service

  const td = new TurndownService({
    headingStyle: 'atx',          // # H1 instead of underline
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  })

  // Strip out Office/Docs garbage that comes in the clipboard HTML
  td.remove(['script', 'style', 'meta', 'link', 'title', 'head'])

  // Drop conditional Word comments and namespaces
  td.addRule('stripMsoComments', {
    filter: (node) => {
      if (node.nodeType === 8) return true // comment node
      return false
    },
    replacement: () => '',
  })

  // --- GFM tables ---
  td.addRule('table', {
    filter: 'table',
    replacement: (_content, node) => {
      const rows = Array.from(node.querySelectorAll('tr'))
      if (!rows.length) return ''

      // Helper: extract cell text, escape pipes, collapse whitespace
      const cellText = (cell) =>
        (cell.textContent || '')
          .replace(/\|/g, '\\|')
          .replace(/\r?\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

      // Determine header row: first row with <th> OR first row in <thead>, else first row
      let headerCells = []
      const thead = node.querySelector('thead')
      if (thead) {
        const firstHeadRow = thead.querySelector('tr')
        if (firstHeadRow) headerCells = Array.from(firstHeadRow.children)
      }
      if (!headerCells.length) {
        const firstRowThs = rows[0].querySelectorAll('th')
        if (firstRowThs.length) headerCells = Array.from(firstRowThs)
      }
      if (!headerCells.length) {
        headerCells = Array.from(rows[0].children)
      }

      const colCount = headerCells.length
      if (!colCount) return ''

      const lines = []
      lines.push('| ' + headerCells.map(cellText).join(' | ') + ' |')
      lines.push('|' + Array(colCount).fill(' --- ').join('|') + '|')

      // Body rows: skip the row we used as header
      const headerRowEl = headerCells[0] && headerCells[0].parentElement
      for (const row of rows) {
        if (row === headerRowEl) continue
        const cells = Array.from(row.children)
        if (!cells.length) continue
        // Pad/truncate to colCount
        const padded = []
        for (let i = 0; i < colCount; i++) {
          padded.push(cells[i] ? cellText(cells[i]) : '')
        }
        lines.push('| ' + padded.join(' | ') + ' |')
      }

      return '\n\n' + lines.join('\n') + '\n\n'
    },
  })

  // Don't escape inside table cells (turndown's default escapes pipes already in cellText)
  // Preserve <br> as space inside cells
  td.addRule('brInCells', {
    filter: (node) => node.nodeName === 'BR' && node.closest && node.closest('td, th'),
    replacement: () => ' ',
  })

  // Preserve <u> as it has no markdown equivalent (keep as HTML)
  td.keep(['u', 'sub', 'sup'])

  _service = td
  return _service
}

/**
 * Convert HTML clipboard string → Markdown.
 * Returns null if input is empty or conversion fails.
 */
export function htmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return null
  try {
    // Pre-clean Office-flavored HTML
    const cleaned = html
      // Strip XML declarations and Word conditionals
      .replace(/<\?xml[^>]*>/gi, '')
      .replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      // Drop class/style/lang on every tag (Docs adds tons of inline styles that confuse turndown)
      .replace(/\s(class|style|lang|dir|id)="[^"]*"/gi, '')
      .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')

    const md = getService().turndown(cleaned)
    // Collapse 3+ blank lines to 2
    return md.replace(/\n{3,}/g, '\n\n').trim()
  } catch (e) {
    console.error('htmlToMarkdown failed:', e)
    return null
  }
}
