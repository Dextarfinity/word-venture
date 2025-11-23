@echo off
REM This script ensures model files are available for Android builds
REM Run this before building for Android

echo.
echo 📦 Preparing model files for Android build...
echo.

REM Create models directory if it doesn't exist
if not exist "public\models" mkdir "public\models"

REM Check for English model
if exist "public\models\vosk-model-small-en-us-0.15.tar.gz" (
    echo ✅ English model found
) else (
    echo ❌ English model missing! Download from: https://alphacephei.com/vosk/models
)

REM Check for Filipino model (optional)
if exist "public\models\vosk-model-tl-ph-generic-0.6.zip" (
    echo ✅ Filipino model found
) else (
    echo ⚠️  Filipino model not found (optional, for Filipino language support)
    echo    Download from: https://alphacephei.com/vosk/models if needed
)

echo.
echo 📁 Model files are ready for build!
echo.
