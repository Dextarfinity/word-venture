#!/usr/bin/env node
/**
 * Prepare model files for build
 * This script ensures model files are available before building
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, '..', 'public', 'models');

console.log('\n📦 Preparing model files for build...\n');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('📁 Created models directory');
}

// Check for English model (required)
const englishModel = path.join(modelsDir, 'vosk-model-small-en-us-0.15.tar.gz');
if (fs.existsSync(englishModel)) {
  const size = fs.statSync(englishModel).size;
  console.log(`✅ English model found: ${(size / 1024 / 1024).toFixed(1)} MB`);
} else {
  console.warn('⚠️  English model not found: vosk-model-small-en-us-0.15.tar.gz');
  console.warn('   - For web/Vercel: Uses Web Speech API fallback (no model needed)');
  console.warn('   - For Android: Download from https://alphacephei.com/vosk/models');
}

// Check for Filipino model (optional)
const filipinoModel = path.join(modelsDir, 'vosk-model-tl-ph-generic-0.6.zip');
if (fs.existsSync(filipinoModel)) {
  const size = fs.statSync(filipinoModel).size;
  console.log(`✅ Filipino model found: ${(size / 1024 / 1024).toFixed(1)} MB`);
} else {
  console.log('ℹ️  Filipino model not found (optional)');
  console.log('   - For Filipino language support, download from https://alphacephei.com/vosk/models');
}

console.log('\n✨ Model preparation complete!\n');
