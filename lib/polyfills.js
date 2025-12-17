// Polyfills for @pdf-lib/fontkit which uses regenerator-runtime
import 'regenerator-runtime/runtime'

// Ensure regeneratorRuntime is available globally
if (typeof global !== 'undefined' && !global.regeneratorRuntime) {
  global.regeneratorRuntime = require('regenerator-runtime')
}

if (typeof globalThis !== 'undefined' && !globalThis.regeneratorRuntime) {
  globalThis.regeneratorRuntime = require('regenerator-runtime')
}
