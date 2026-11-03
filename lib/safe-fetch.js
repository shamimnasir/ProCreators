// fetch() for URLs that come from users. Blocks requests to private, loopback, link-local and
// cloud-metadata addresses (SSRF), and re-checks every redirect hop instead of letting fetch
// follow redirects blindly.
//
// Limitation: the address is checked by resolving DNS before the request; fetch resolves again
// when it connects, so a DNS-rebinding host with a near-zero TTL could still race the check.
// It stops the direct cases (literal IPs, names pointing at internal addresses, redirects).
import dns from 'dns/promises'
import net from 'net'

export class UnsafeUrlError extends Error {}

function ipv4ToInt(ip) {
  return ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0
}

const V4_BLOCKED = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([base, bits]) => [ipv4ToInt(base), bits])

export function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const n = ipv4ToInt(ip)
    return V4_BLOCKED.some(([base, bits]) => (n >>> (32 - bits)) === (base >>> (32 - bits)))
  }
  if (net.isIPv6(ip)) {
    const v6 = ip.toLowerCase()
    const mapped = v6.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/) || v6.match(/^::(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isBlockedIp(mapped[1])
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(v6)) return true // hex-form mapped IPv4
    return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || /^ff/.test(v6) || v6.startsWith('64:ff9b:')
  }
  return true
}

export async function assertPublicUrl(raw) {
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new UnsafeUrlError('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new UnsafeUrlError('Only http(s) URLs are allowed')
  if (url.username || url.password) throw new UnsafeUrlError('URLs with credentials are not allowed')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  let addresses
  if (net.isIP(host)) {
    addresses = [host]
  } else {
    try {
      addresses = (await dns.lookup(host, { all: true, verbatim: true })).map((a) => a.address)
    } catch {
      throw new UnsafeUrlError('Could not resolve host')
    }
  }
  if (addresses.length === 0 || addresses.some(isBlockedIp)) throw new UnsafeUrlError('URL points to a private or reserved address')
  return url
}

export async function safeFetch(raw, options = {}, maxRedirects = 5) {
  let current = raw
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const url = await assertPublicUrl(current)
    const res = await fetch(url, { ...options, redirect: 'manual' })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).toString()
      continue
    }
    return res
  }
  throw new UnsafeUrlError('Too many redirects')
}
