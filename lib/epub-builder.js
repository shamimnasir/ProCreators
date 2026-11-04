// Minimal EPUB 3 writer for the Ebook Maker.
// Assembles the required OPF, NAV, XHTML chapter files, and package structure
// into a valid .epub archive using JSZip.

import JSZip from 'jszip'

const escapeXml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

// Convert plain-text (with double-newline paragraph breaks) to XHTML paragraphs.
function textToXhtmlParagraphs(text = '') {
  if (!text) return '<p></p>'
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n')
}

function xhtmlWrap({ title, bodyHtml, lang = 'en' }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

const CSS = `body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; margin: 5%; color: #222; }
h1 { font-size: 1.8em; margin-top: 1.5em; page-break-before: always; }
h2 { font-size: 1.35em; margin-top: 1.2em; }
h3 { font-size: 1.15em; margin-top: 1em; }
p  { text-indent: 1.2em; margin: 0.4em 0; }
p.first, h1 + p, h2 + p, h3 + p { text-indent: 0; }
blockquote { margin: 1em 2em; font-style: italic; color: #555; }
ul, ol { margin: 0.6em 1.4em; }
.cover { text-align: center; margin-top: 25%; }
.cover h1 { font-size: 2.4em; page-break-before: avoid; }
.cover .subtitle { font-size: 1.2em; color: #666; font-style: italic; }
.cover .author { margin-top: 3em; font-size: 1.1em; }
.toc a { text-decoration: none; color: #444; }`

/**
 * Build an EPUB 3 file (Buffer) from the given book payload.
 *
 * @param {Object} book
 * @param {Object} book.cover        - { title, subtitle, author }
 * @param {Object} [book.introduction] - { title, content }
 * @param {Array}  book.chapters      - [{ title, content, sections?: [{title, content}] }]
 * @param {Object} [book.conclusion]   - { title, content }
 * @param {String} [book.language]     - BCP-47 language code, default 'en'
 * @param {String} [book.identifier]   - unique id (uuid), auto-generated if omitted
 * @returns {Promise<Buffer>}  EPUB file contents
 */
export async function buildEpub(book) {
  const {
    cover = {},
    introduction,
    chapters = [],
    conclusion,
    language = 'en',
    identifier = 'urn:uuid:' + cryptoRandomUuid(),
  } = book

  const title = cover.title || 'Untitled Book'
  const subtitle = cover.subtitle || ''
  const author = cover.author || cover.authorName || 'ProCreators'

  const zip = new JSZip()

  // Mandatory files ---------------------------------------------------------
  // 1. mimetype must be first + uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // 2. META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  // 3. Content files (in OEBPS/) ------------------------------------------
  const chapterEntries = []

  // Cover page
  chapterEntries.push({
    id: 'cover',
    filename: 'cover.xhtml',
    title: title,
    inSpine: true,
    html: xhtmlWrap({
      title,
      lang: language,
      bodyHtml: `<section class="cover" epub:type="cover">
  <h1>${escapeXml(title)}</h1>
  ${subtitle ? `<p class="subtitle">${escapeXml(subtitle)}</p>` : ''}
  <p class="author">${escapeXml(author)}</p>
</section>`,
    }),
  })

  // Introduction (optional)
  if (introduction && introduction.content) {
    chapterEntries.push({
      id: 'intro',
      filename: 'intro.xhtml',
      title: introduction.title || 'Introduction',
      inSpine: true,
      html: xhtmlWrap({
        title: introduction.title || 'Introduction',
        lang: language,
        bodyHtml: `<h1>${escapeXml(introduction.title || 'Introduction')}</h1>
${textToXhtmlParagraphs(introduction.content)}`,
      }),
    })
  }

  // Chapters
  chapters.forEach((ch, i) => {
    const chapterHtmlParts = [`<h1>${escapeXml(ch.title || `Chapter ${i + 1}`)}</h1>`]
    if (ch.summary) chapterHtmlParts.push(`<p><em>${escapeXml(ch.summary)}</em></p>`)
    if (ch.sections && Array.isArray(ch.sections) && ch.sections.length) {
      ch.sections.forEach((sec) => {
        if (sec.title) chapterHtmlParts.push(`<h2>${escapeXml(sec.title)}</h2>`)
        if (sec.content) chapterHtmlParts.push(textToXhtmlParagraphs(sec.content))
      })
    } else if (ch.content) {
      chapterHtmlParts.push(textToXhtmlParagraphs(ch.content))
    }
    if (ch.keyTakeaways && ch.keyTakeaways.length) {
      chapterHtmlParts.push('<h2>Key Takeaways</h2><ul>')
      ch.keyTakeaways.forEach((t) => chapterHtmlParts.push(`<li>${escapeXml(t)}</li>`))
      chapterHtmlParts.push('</ul>')
    }
    chapterEntries.push({
      id: `ch${i + 1}`,
      filename: `chapter-${i + 1}.xhtml`,
      title: ch.title || `Chapter ${i + 1}`,
      inSpine: true,
      html: xhtmlWrap({ title: ch.title || `Chapter ${i + 1}`, lang: language, bodyHtml: chapterHtmlParts.join('\n') }),
    })
  })

  // Conclusion (optional)
  if (conclusion && conclusion.content) {
    chapterEntries.push({
      id: 'conclusion',
      filename: 'conclusion.xhtml',
      title: conclusion.title || 'Conclusion',
      inSpine: true,
      html: xhtmlWrap({
        title: conclusion.title || 'Conclusion',
        lang: language,
        bodyHtml: `<h1>${escapeXml(conclusion.title || 'Conclusion')}</h1>
${textToXhtmlParagraphs(conclusion.content)}`,
      }),
    })
  }

  // Navigation (EPUB 3 requirement)
  const navItems = chapterEntries
    .filter((c) => c.id !== 'cover')
    .map((c) => `      <li><a href="${c.filename}">${escapeXml(c.title)}</a></li>`)
    .join('\n')
  const navXhtml = xhtmlWrap({
    title: 'Table of Contents',
    lang: language,
    bodyHtml: `<nav epub:type="toc" id="toc" xmlns:epub="http://www.idpf.org/2007/ops">
  <h1>Table of Contents</h1>
  <ol>
${navItems}
  </ol>
</nav>`,
  })

  // Write chapter and nav xhtml
  chapterEntries.forEach((c) => zip.file(`OEBPS/${c.filename}`, c.html))
  zip.file('OEBPS/nav.xhtml', navXhtml)
  zip.file('OEBPS/styles.css', CSS)

  // content.opf — package definition
  const manifestItems = [
    `    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `    <item id="css" href="styles.css" media-type="text/css"/>`,
    ...chapterEntries.map(
      (c) => `    <item id="${c.id}" href="${c.filename}" media-type="application/xhtml+xml"/>`,
    ),
  ].join('\n')

  const spineItems = chapterEntries
    .filter((c) => c.inSpine)
    .map((c) => `    <itemref idref="${c.id}"/>`)
    .join('\n')

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="${language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="pub-id">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>${escapeXml(language)}</dc:language>
    ${subtitle ? `<dc:description>${escapeXml(subtitle)}</dc:description>` : ''}
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`
  zip.file('OEBPS/content.opf', opf)

  return zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' })
}

function cryptoRandomUuid() {
  // Use Node's crypto.randomUUID() when available (Node 14.17+)
  try {
    // eslint-disable-next-line global-require
    const { randomUUID } = require('crypto')
    if (randomUUID) return randomUUID()
  } catch {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
