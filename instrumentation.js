// This file runs before any other code in Next.js
// Used to set up global polyfills

import 'regenerator-runtime/runtime'

export async function register() {
  // regenerator-runtime is loaded at module level above
  console.log('Instrumentation: regenerator-runtime polyfill loaded')
}
