// =====================================================
// Cloudflare R2 (S3-compatible) object storage helper
// =====================================================
// Used by /api/upload to persist blog cover images / inline images
// in a durable, multi-pod-safe location. Returns CDN-style public URLs.
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let _client = null

function getClient() {
  if (_client) return _client

  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.'
    )
  }

  _client = new S3Client({
    region: 'auto', // R2 uses "auto"
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // forcePathStyle is NOT required for R2 when using the account endpoint
  })
  return _client
}

export function isR2Configured() {
  return Boolean(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  )
}

/**
 * Upload a Buffer or Uint8Array to R2 under the given key.
 * Returns { url, key } where url is publicly reachable.
 */
export async function uploadToR2({ key, body, contentType, cacheControl }) {
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_BASE_URL
  if (!bucket || !publicBase) {
    throw new Error('R2_BUCKET and R2_PUBLIC_BASE_URL must be set')
  }

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
    CacheControl: cacheControl || 'public, max-age=31536000, immutable',
  })

  await getClient().send(cmd)

  const url = `${publicBase.replace(/\/+$/, '')}/${encodeURI(key)}`
  return { url, key, bucket }
}

/**
 * Delete an object from R2 (best-effort).
 */
export async function deleteFromR2(key) {
  const bucket = process.env.R2_BUCKET
  if (!bucket || !key) return
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  } catch (e) {
    console.warn('[R2] delete failed:', e?.message)
  }
}
