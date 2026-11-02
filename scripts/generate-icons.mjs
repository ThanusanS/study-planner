// Generate PWA icons from SVG using canvas
// This creates simple gradient icons matching the Study Planner brand

import fs from 'fs';

// Since we can't easily convert SVG to PNG without sharp/canvas in Node,
// we'll create a simple HTML file that generates the icons using browser canvas
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const generateIconSVG = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const iconSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <g transform="translate(${cx - iconSize * 0.25}, ${cy - iconSize * 0.28}) scale(${iconSize / 48})">
    <path d="M4.5 8.5 12 5l7.5 3.5-7.5 3.5-7.5-3.5Z" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 11.5v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3.5" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19.5 9.5v4" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19.5 13.5c0 .9-.7 1.6-1.6 1.6" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
};

// Write SVG icons (they work as PWA icons too)
for (const size of sizes) {
  const svg = generateIconSVG(size);
  fs.writeFileSync(`public/icons/icon-${size}x${size}.svg`, svg);
  console.log(`✅ Generated icon-${size}x${size}.svg`);
}

// Maskable icon
const maskableSvg = generateIconSVG(512, true);
fs.writeFileSync('public/icons/maskable-icon-512x512.svg', maskableSvg);
console.log('✅ Generated maskable-icon-512x512.svg');

console.log('\n✅ All PWA icons generated!');
console.log('Note: SVG icons work for PWA. For maximum compatibility, convert to PNG using a tool like https://cloudconvert.com/svg-to-png');
