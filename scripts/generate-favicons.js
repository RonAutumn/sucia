import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// This script will create the favicon files
// For now, we'll copy the original file and rename it for different uses
// In a production environment, you would use image processing libraries like sharp or jimp

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'sucia-logo-original.png');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('Sucia logo not found! Please ensure sucia-logo-original.png exists in public directory.');
  process.exit(1);
}

// Create the logo files for header use
const logoFiles = [
  { source: logoPath, dest: path.join(publicDir, 'sucia-logo.png'), description: 'Main logo for header use' },
  { source: logoPath, dest: path.join(publicDir, 'sucia-logo-small.png'), description: 'Small logo for mobile' }
];

// Create favicon files (we'll use the same image for different sizes initially)
const faviconFiles = [
  { source: logoPath, dest: path.join(publicDir, 'favicon.ico'), description: 'Standard favicon' },
  { source: logoPath, dest: path.join(publicDir, 'favicon-16x16.png'), description: '16x16 favicon' },
  { source: logoPath, dest: path.join(publicDir, 'favicon-32x32.png'), description: '32x32 favicon' },
  { source: logoPath, dest: path.join(publicDir, 'apple-touch-icon.png'), description: '180x180 Apple touch icon' },
  { source: logoPath, dest: path.join(publicDir, 'android-chrome-192x192.png'), description: '192x192 Android icon' },
  { source: logoPath, dest: path.join(publicDir, 'android-chrome-512x512.png'), description: '512x512 Android icon' }
];

console.log('🎨 Generating Sucia logo and favicon files...\n');

// Copy logo files
logoFiles.forEach(file => {
  try {
    fs.copyFileSync(file.source, file.dest);
    console.log(`✅ Created: ${path.basename(file.dest)} - ${file.description}`);
  } catch (error) {
    console.error(`❌ Failed to create ${path.basename(file.dest)}:`, error.message);
  }
});

// Copy favicon files  
faviconFiles.forEach(file => {
  try {
    fs.copyFileSync(file.source, file.dest);
    console.log(`✅ Created: ${path.basename(file.dest)} - ${file.description}`);
  } catch (error) {
    console.error(`❌ Failed to create ${path.basename(file.dest)}:`, error.message);
  }
});

console.log('\n🎉 Logo and favicon generation complete!');
console.log('\n📝 Note: In production, you should optimize these images using tools like:');
console.log('   - TinyPNG/TinyJPG for compression');
console.log('   - Sharp/Jimp for proper resizing');  
console.log('   - WebP conversion for modern browsers');

// Create a simple WebP placeholder file content guide
const webpGuide = `# WebP Optimization Guide

To create optimized WebP versions of the logo:

1. Use online tools like Cloudinary, TinyPNG, or Squoosh.app
2. Convert sucia-logo.png to sucia-logo.webp 
3. Ensure WebP is ~50-80% smaller than PNG
4. Implement fallback strategy: WebP with PNG fallback

Example HTML implementation:
<picture>
  <source srcset="/sucia-logo.webp" type="image/webp">
  <img src="/sucia-logo.png" alt="Sucia logo" />
</picture>
`;

fs.writeFileSync(path.join(publicDir, 'webp-optimization-guide.md'), webpGuide);
console.log('\n📋 Created WebP optimization guide in public/webp-optimization-guide.md'); 