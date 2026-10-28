// Runs the ProCreators Docker image (../Dockerfile) on Cloudflare Containers. Every request is
// forwarded to a single container instance: rate limiting and generated files are per process,
// so the app must not be spread across several instances (see DEPLOY.md).
import { Container } from '@cloudflare/containers'

// Bindings that belong to the Worker itself and must not be copied into the container's env.
const WORKER_ONLY = new Set(['APP'])

export class ProCreatorsApp extends Container {
  defaultPort = 3000
  // The disk is wiped when the container stops, so keep it warm for a while after the last request.
  sleepAfter = '1h'
  enableInternet = true

  constructor(ctx, env) {
    super(ctx, env)
    // Worker vars and secrets (wrangler secret put ...) become the container's environment.
    this.envVars = Object.fromEntries(
      Object.entries(env).filter(([key, value]) => typeof value === 'string' && !WORKER_ONLY.has(key)),
    )
  }

  onError(error) {
    console.error('Container error:', error)
    throw error
  }
}

export default {
  async fetch(request, env) {
    return env.APP.getByName('main').fetch(request)
  },
}
