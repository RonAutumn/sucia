# WebP Optimization Guide

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
