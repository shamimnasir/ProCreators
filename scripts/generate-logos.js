// Script to generate high-res logo images for media kit
const fs = require('fs');
const path = require('path');

// Create public/media-kit directory
const mediaKitDir = '/app/public/media-kit';
if (!fs.existsSync(mediaKitDir)) {
  fs.mkdirSync(mediaKitDir, { recursive: true });
}

// Logo SVG - Icon Only (Square)
const logoIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradient)" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
  <circle cx="72" cy="54" r="2" fill="white" opacity="0.4" />
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a78bfa" />
    </linearGradient>
  </defs>
</svg>`;

// Logo with Text (Horizontal)
const logoFullSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Icon -->
  <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradient)" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
  <circle cx="72" cy="54" r="2" fill="white" opacity="0.4" />
  
  <!-- Text -->
  <text x="115" y="62" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="700" fill="#1f2937">ProCreators</text>
  
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a78bfa" />
    </linearGradient>
  </defs>
</svg>`;

// Logo with Text - White version (for dark backgrounds)
const logoFullWhiteSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Icon -->
  <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradient)" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
  <circle cx="72" cy="54" r="2" fill="white" opacity="0.4" />
  
  <!-- Text - White -->
  <text x="115" y="62" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="700" fill="white">ProCreators</text>
  
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a78bfa" />
    </linearGradient>
  </defs>
</svg>`;

// Monochrome Icon (Purple only, no gradient)
const logoMonoPurpleSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="90" rx="22" fill="#7c3aed" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
</svg>`;

// Monochrome Icon - White outline (for dark backgrounds)
const logoMonoWhiteSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="90" rx="22" stroke="white" stroke-width="2" fill="none" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
</svg>`;

// Monochrome Icon - Black (for light backgrounds)
const logoMonoBlackSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="90" rx="22" fill="#1f2937" />
  <path
    d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
    stroke="white"
    stroke-width="8"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <path
    d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
    fill="white"
    opacity="0.9"
  />
  <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
</svg>`;

// Favicon (Simple, works at small sizes)
const faviconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="100" height="100" rx="20" fill="url(#bgGradient)" />
  <path
    d="M30 25 L30 75 M30 25 L55 25 C67 25 75 35 75 47.5 C75 60 67 70 55 70 L30 70"
    stroke="white"
    stroke-width="10"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#a78bfa" />
    </linearGradient>
  </defs>
</svg>`;

// Social media banner version
const socialBannerSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1200" height="630" fill="#0f0f1a"/>
  
  <!-- Gradient overlay -->
  <rect width="1200" height="630" fill="url(#bgOverlay)" opacity="0.3"/>
  
  <!-- Logo Icon (larger) -->
  <g transform="translate(420, 165) scale(3)">
    <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradient)" />
    <path
      d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
      stroke="white"
      stroke-width="8"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
      fill="white"
      opacity="0.9"
    />
    <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
    <circle cx="72" cy="54" r="2" fill="white" opacity="0.4" />
  </g>
  
  <!-- Text -->
  <text x="600" y="520" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="72" font-weight="700" fill="white">ProCreators</text>
  <text x="600" y="580" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="28" fill="#a78bfa">AI-Powered Content Creation Platform</text>
  
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#a78bfa" />
    </linearGradient>
    <linearGradient id="bgOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#4c1d95" />
    </linearGradient>
  </defs>
</svg>`;

// Save all SVG files
const files = [
  { name: 'logo-icon.svg', content: logoIconSVG },
  { name: 'logo-full.svg', content: logoFullSVG },
  { name: 'logo-full-white.svg', content: logoFullWhiteSVG },
  { name: 'logo-mono-purple.svg', content: logoMonoPurpleSVG },
  { name: 'logo-mono-white.svg', content: logoMonoWhiteSVG },
  { name: 'logo-mono-black.svg', content: logoMonoBlackSVG },
  { name: 'favicon.svg', content: faviconSVG },
  { name: 'social-banner.svg', content: socialBannerSVG },
];

files.forEach(file => {
  fs.writeFileSync(path.join(mediaKitDir, file.name), file.content);
  console.log(`Created: ${file.name}`);
});

console.log('\n✅ All SVG logos created in /public/media-kit/');
console.log('\nFiles created:');
console.log('- logo-icon.svg (Square icon with gradient)');
console.log('- logo-full.svg (Icon + "ProCreators" text, dark text)');
console.log('- logo-full-white.svg (Icon + "ProCreators" text, white text)');
console.log('- logo-mono-purple.svg (Solid purple background)');
console.log('- logo-mono-white.svg (White outline, transparent)');
console.log('- logo-mono-black.svg (Black/dark background)');
console.log('- favicon.svg (Simplified for small sizes)');
console.log('- social-banner.svg (1200x630 for social sharing)');
