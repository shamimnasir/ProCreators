// Generate PNG versions of logos in multiple sizes
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const mediaKitDir = '/app/public/media-kit';

// Size configurations for different use cases
const iconSizes = [
  { size: 16, suffix: '16' },    // Favicon small
  { size: 32, suffix: '32' },    // Favicon
  { size: 48, suffix: '48' },    // Icon
  { size: 64, suffix: '64' },    // Icon large
  { size: 128, suffix: '128' },  // App icon
  { size: 256, suffix: '256' },  // High-res icon
  { size: 512, suffix: '512' },  // Very high-res
  { size: 1024, suffix: '1024' }, // Ultra high-res
];

const fullLogoSizes = [
  { width: 200, suffix: 'sm' },
  { width: 400, suffix: 'md' },
  { width: 800, suffix: 'lg' },
  { width: 1600, suffix: 'xl' },
];

async function generatePNGs() {
  console.log('Generating PNG versions...\n');

  // Generate icon PNGs
  const iconSvg = fs.readFileSync(path.join(mediaKitDir, 'logo-icon.svg'));
  for (const { size, suffix } of iconSizes) {
    const outputPath = path.join(mediaKitDir, `logo-icon-${suffix}.png`);
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: logo-icon-${suffix}.png (${size}x${size})`);
  }

  // Generate mono purple icon PNGs
  const monoPurpleSvg = fs.readFileSync(path.join(mediaKitDir, 'logo-mono-purple.svg'));
  for (const { size, suffix } of [{ size: 256, suffix: '256' }, { size: 512, suffix: '512' }]) {
    const outputPath = path.join(mediaKitDir, `logo-mono-purple-${suffix}.png`);
    await sharp(monoPurpleSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: logo-mono-purple-${suffix}.png (${size}x${size})`);
  }

  // Generate mono black icon PNGs
  const monoBlackSvg = fs.readFileSync(path.join(mediaKitDir, 'logo-mono-black.svg'));
  for (const { size, suffix } of [{ size: 256, suffix: '256' }, { size: 512, suffix: '512' }]) {
    const outputPath = path.join(mediaKitDir, `logo-mono-black-${suffix}.png`);
    await sharp(monoBlackSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: logo-mono-black-${suffix}.png (${size}x${size})`);
  }

  // Generate full logo PNGs (with text)
  const fullSvg = fs.readFileSync(path.join(mediaKitDir, 'logo-full.svg'));
  for (const { width, suffix } of fullLogoSizes) {
    const outputPath = path.join(mediaKitDir, `logo-full-${suffix}.png`);
    await sharp(fullSvg)
      .resize(width)
      .png()
      .toFile(outputPath);
    console.log(`Created: logo-full-${suffix}.png (${width}px wide)`);
  }

  // Generate full logo white PNGs
  const fullWhiteSvg = fs.readFileSync(path.join(mediaKitDir, 'logo-full-white.svg'));
  for (const { width, suffix } of fullLogoSizes) {
    const outputPath = path.join(mediaKitDir, `logo-full-white-${suffix}.png`);
    await sharp(fullWhiteSvg)
      .resize(width)
      .png()
      .toFile(outputPath);
    console.log(`Created: logo-full-white-${suffix}.png (${width}px wide)`);
  }

  // Generate social banner PNG
  const socialSvg = fs.readFileSync(path.join(mediaKitDir, 'social-banner.svg'));
  await sharp(socialSvg)
    .resize(1200, 630)
    .png()
    .toFile(path.join(mediaKitDir, 'social-banner.png'));
  console.log('Created: social-banner.png (1200x630)');

  // Generate favicon ICO sizes
  const faviconSvg = fs.readFileSync(path.join(mediaKitDir, 'favicon.svg'));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(mediaKitDir, 'favicon-32.png'));
  console.log('Created: favicon-32.png');

  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(mediaKitDir, 'apple-touch-icon.png'));
  console.log('Created: apple-touch-icon.png (180x180)');

  console.log('\n✅ All PNG files generated!');
  
  // List all files
  const files = fs.readdirSync(mediaKitDir);
  console.log(`\nTotal files in media kit: ${files.length}`);
  console.log('\nAll files:');
  files.forEach(f => console.log(`  - ${f}`));
}

generatePNGs().catch(console.error);
