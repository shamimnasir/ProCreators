// Map a site-relative path such as "/worksheets/abc.pdf" to a file under the public directory,
// refusing anything that would escape it ("../", encoded traversal, absolute paths).
import path from 'path'

const PUBLIC_ROOT = path.resolve(process.env.PUBLIC_DIR || path.join(process.cwd(), 'public'))

export function resolvePublicPath(urlPath, { allowedDirs = null } = {}) {
  if (typeof urlPath !== 'string' || !urlPath || urlPath.includes('\0')) return null
  let decoded
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0])
  } catch {
    return null
  }
  // Reject traversal outright instead of letting normalization clamp it to another file
  if (decoded.split(/[\\/]/).includes('..')) return null
  const absolute = path.resolve(PUBLIC_ROOT, '.' + path.posix.normalize('/' + decoded))
  if (!absolute.startsWith(PUBLIC_ROOT + path.sep)) return null
  if (allowedDirs) {
    const top = path.relative(PUBLIC_ROOT, absolute).split(path.sep)[0]
    if (!allowedDirs.includes(top)) return null
  }
  return absolute
}
