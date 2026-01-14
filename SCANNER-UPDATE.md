# Updated Scanner Installation Guide

## Changes Made

Replaced the basic scanner with **ZXing library** for real barcode/QR code scanning (same as barcode-logger-app).

## Installation Steps

### 1. Install Dependencies

```bash
cd /Users/dtzysy/Documents/stock-management-system
npm install @zxing/library
```

### 2. Test Locally

```bash
npm run dev
```

- Navigate to Scanner page
- Click "Start Camera Scanner"
- Grant camera permissions
- Point camera at barcode/QR code
- Scanner will automatically detect and process

### 3. Deploy

```bash
npm run build
# Deploy to Netlify
```

## How It Works

### ZXing Scanner
- Uses `BrowserMultiFormatReader` from @zxing/library
- Supports multiple barcode formats (QR, EAN, Code128, etc.)
- Automatically detects and decodes barcodes
- Works on mobile and desktop with camera

### Features
- ✅ Real barcode scanning (not simulation)
- ✅ Auto-detection (no capture button needed)
- ✅ Multiple format support
- ✅ Mobile-optimized
- ✅ Fallback to manual entry if camera unavailable

### Requirements
- HTTPS connection (required for camera access)
- Camera permissions granted
- Modern browser with camera support

## Testing

1. **Desktop**: Use webcam or manual entry
2. **Mobile**: Use rear camera for best results
3. **No Camera**: Automatic fallback to manual entry

## Troubleshooting

### Camera Not Working
- Ensure HTTPS (localhost is OK for dev)
- Check browser permissions
- Try different browser
- Use manual entry as fallback

### Scanner Not Detecting
- Ensure good lighting
- Hold barcode steady
- Try different distance
- Ensure barcode is clear and not damaged

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS & macOS)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ Requires HTTPS in production
