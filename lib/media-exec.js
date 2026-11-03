// Run ffmpeg/ffprobe without a shell. Arguments are passed as an array, so request data can
// never be interpreted as shell syntax (the previous exec() template strings allowed
// `$(...)`, `;` and quote break-outs).
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export function runMedia(binary, args, { maxBuffer = 100 * 1024 * 1024 } = {}) {
  if (binary !== 'ffmpeg' && binary !== 'ffprobe') throw new Error('Unsupported binary')
  return execFileAsync(binary, args.map(String), { maxBuffer })
}

// Extension of an uploaded file, restricted to an allowlist. The raw name is client-controlled
// ("x./../../etc" would otherwise escape the temp directory when joined into a path).
export function safeExt(fileName, allowed, fallback) {
  const ext = String(fileName || '').split('.').pop().toLowerCase()
  return allowed.includes(ext) ? ext : fallback
}

export class MediaInputError extends Error {}

// A finite, non-negative number of seconds, or a MediaInputError.
export function seconds(value, name) {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n) || n < 0 || n > 24 * 3600) throw new MediaInputError(`Invalid ${name}`)
  return n
}
