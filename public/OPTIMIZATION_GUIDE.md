
# Logo Optimization Required

## Current Status
- All logo files are ~133KB each (total: ~1MB)
- Target: <50KB total for all logo assets
- Need 95% size reduction

## Immediate Actions Needed
1. **Main Logo (sucia-logo.png)**:
   - Target size: ~15KB
   - Use TinyPNG, Squoosh.app, or similar tool
   - Test quality at 48px display size

2. **Favicon Files**:
   - favicon.ico: Target ~5KB
   - favicon-16x16.png: Target ~2KB  
   - favicon-32x32.png: Target ~3KB
   - Use actual 16x16 and 32x32 source images, not scaled down large images

3. **Mobile Icons**:
   - apple-touch-icon.png (180x180): Target ~8KB
   - android-chrome-192x192.png: Target ~10KB
   - android-chrome-512x512.png: Target ~7KB (can be more compressed since it's scaled down)

## Tools for Optimization
- **Online**: TinyPNG, Squoosh.app, Compressor.io
- **CLI**: imagemin, sharp, cwebp
- **Design**: Create simplified versions of complex logos

## Performance Impact
- Current load time likely >200ms (fails requirement)
- Target: <100ms load time
- Optimized files should load in ~20-50ms on 4G

## Quality Guidelines
- Test logo visibility at 48px height
- Ensure favicon is recognizable at 16x16
- Maintain brand colors and basic shape
- Accept some detail loss for performance gains
