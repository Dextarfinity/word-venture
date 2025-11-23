# Android Build Setup - Voice Recognition Models

## Overview

CapyBuddy uses Vosk speech recognition models for offline voice support in Android builds. These model files are too large to commit to GitHub, so you need to download them manually for Android development.

## Model Files

### Required for Android
- **vosk-model-small-en-us-0.15.tar.gz** (41.1 MB) - English language model
  - Status: ✅ Committed to GitHub (included in repo)
  - Location: `public/models/vosk-model-small-en-us-0.15.tar.gz`

### Optional
- **vosk-model-tl-ph-generic-0.6.zip** (313 MB) - Filipino language model
  - Status: ⚠️ NOT committed (exceeds GitHub 100MB limit)
  - Location: `public/models/vosk-model-tl-ph-generic-0.6.zip`
  - Only needed if you want Filipino language support

## Setup for Android Studio

### Step 1: Clone/Update Repository
```bash
git clone https://github.com/Dextarfinity/word-venture.git
cd word-venture
npm install
```

The English model (41.1 MB) will be automatically included.

### Step 2: Optional - Add Filipino Model

If you need Filipino language support:

1. Download from: https://alphacephei.com/vosk/models
2. Find **vosk-model-tl-ph-generic-0.6.zip**
3. Download and place in: `public/models/vosk-model-tl-ph-generic-0.6.zip`

### Step 3: Verify Models
```bash
# Windows
npm run prepare-models

# Or manually run:
node scripts/prepare-models.js
```

Expected output:
```
✅ English model found: 41.1 MB
ℹ️  Filipino model not found (optional)
```

### Step 4: Build for Android
```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open Android Studio
npx cap open android
```

## How It Works

### Web (Vercel)
- ✅ **Web Speech API** - Automatic fallback when Vosk model unavailable
- No models needed
- Works on all browsers

### Android (Capacitor)
- ✅ **Vosk (offline)** - If model files are present
- ✅ **Native Speech Recognition** - Fallback when Vosk unavailable
- Works offline with models, requires internet as fallback

## Troubleshooting

### Models not included in Android build
**Issue**: Built APK doesn't have voice recognition
**Solution**: 
1. Ensure `public/models/vosk-model-small-en-us-0.15.tar.gz` exists
2. Run `npm install` to update dependencies
3. Run `npm run build` to include models in dist
4. Run `npx cap sync` to copy to Android project

### "Model not found" error at runtime
**Issue**: App runs but voice recognition fails
**Solution**:
- Web: Uses Web Speech API automatically ✅
- Android: Falls back to native speech recognition ✅
- Model is optional, app works without it

### File size limits
**Q**: Why is Filipino model not in git?
**A**: GitHub has a 100MB file size limit. Filipino model is 313MB.

**Q**: Can I use Git LFS?
**A**: Yes, if you enable Git LFS:
```bash
git lfs install
git lfs track "public/models/vosk-model-tl-ph-generic-0.6.zip"
git add .gitattributes
git add public/models/vosk-model-tl-ph-generic-0.6.zip
```

## Build Pipeline

```
npm install
    ↓
npm run build (runs prepare-models.js first)
    ↓
dist/ includes all models
    ↓
npx cap sync
    ↓
Models copied to Android project
    ↓
Build successful ✅
```

## For CI/CD (GitHub Actions, etc.)

If you set up automated builds, add this step:

```yaml
- name: Prepare models
  run: npm run prepare-models

- name: Build
  run: npm run build
```

## Links

- Vosk Models: https://alphacephei.com/vosk/models
- Vosk Documentation: https://github.com/alphacephei/vosk-api
- Capacitor Guide: https://capacitorjs.com/docs
