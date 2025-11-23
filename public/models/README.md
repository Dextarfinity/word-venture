# Vosk Models Directory

This directory is for storing Vosk speech recognition models for offline functionality.

## How to add a Vosk model:

1. Download a Vosk model from: https://alphacephei.com/vosk/models
   
   Recommended small models for English:
   - `vosk-model-small-en-us-0.15` (39 MB) - Good balance of size and accuracy
   - `vosk-model-small-en-us-0.4` (39 MB) - Alternative small model
   - `vosk-model-en-us-0.22-lgraph` (128 MB) - Larger, more accurate model

2. Download the **.tar.gz** version (not .zip) and save directly to this directory

3. The final structure should look like:
   ```
   public/models/
   ├── README.md (this file)
   ├── vosk-model-small-en-us-0.15.tar.gz (required format)
   ├── vosk-model-small-en-us-0.15.zip (can be deleted)
   └── vosk-model-small-en-us-0.15/ (can be deleted)
   ```

4. The app will automatically try to load models from these file paths:
   - `/models/vosk-model-small-en-us-0.15.tar.gz`
   - `/models/vosk-model-en-us-0.22-lgraph.tar.gz`
   - `/models/vosk-model-small-en-us-0.4.tar.gz`

## Notes:
- Models must be in **.tar.gz format** (not .zip or extracted directories)
- The app will try each model path in order until one loads successfully
- If no model is found, the app will fall back to online Web Speech API (if available)
- Offline mode provides more privacy and works without internet connection

## Current Setup:
✅ `vosk-model-small-en-us-0.15.tar.gz` is installed and ready to use

## Troubleshooting:
- Make sure the model file is in .tar.gz format (not .zip)
- Check browser console for model loading messages
- Ensure your web server can serve .tar.gz files from the public directory
- Grant microphone permissions when prompted