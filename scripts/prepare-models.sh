#!/bin/bash
# This script ensures model files are available for Android builds
# Run this before building for Android

echo "📦 Preparing model files for Android build..."

# Create models directory if it doesn't exist
mkdir -p public/models

# Check for English model
if [ -f "public/models/vosk-model-small-en-us-0.15.tar.gz" ]; then
    echo "✅ English model found: $(du -h public/models/vosk-model-small-en-us-0.15.tar.gz | cut -f1)"
else
    echo "❌ English model missing! Download from: https://alphacephei.com/vosk/models"
fi

# Check for Filipino model (optional)
if [ -f "public/models/vosk-model-tl-ph-generic-0.6.zip" ]; then
    echo "✅ Filipino model found: $(du -h public/models/vosk-model-tl-ph-generic-0.6.zip | cut -f1)"
else
    echo "⚠️  Filipino model not found (optional, for Filipino language support)"
    echo "   Download from: https://alphacephei.com/vosk/models if needed"
fi

echo "📁 Model files are ready for build!"
