// OpenAI Service for auto-generating words and stories
// 
// IMPORTANT SECURITY NOTES:
// 1. Get your API key from: https://platform.openai.com/api-keys
// 2. Add it to your .env file as: VITE_OPENAI_API_KEY=sk-proj-your-key-here
// 3. NEVER commit your API key to Git
// 4. The .env file is protected by .gitignore
//
// To use this service:
// 1. Copy .env.example to .env
// 2. Add your actual OpenAI API key in the .env file
// 3. Restart the dev server (npm run dev or ionic serve)

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Check if API key is configured
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
  console.warn('⚠️ OpenAI API key not configured! Please add VITE_OPENAI_API_KEY to your .env file.');
  console.warn('📝 Instructions: Copy .env.example to .env and add your API key.');
}

// Dictionary API for word validation
const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Validate if a word exists in English dictionary
async function validateWord(word) {
  try {
    const response = await fetch(`${DICTIONARY_API_URL}${word.toLowerCase()}`);
    return response.ok; // Returns true if word exists, false if not found
  } catch (error) {
    console.warn(`⚠️ Could not validate word "${word}":`, error);
    return true; // Default to true if validation fails to avoid blocking
  }
}

// Validate multiple words
async function validateWords(words) {
  const validatedWords = [];
  
  for (const wordObj of words) {
    const word = wordObj.word || wordObj;
    const isValid = await validateWord(word);
    
    if (isValid) {
      validatedWords.push(wordObj);
      console.log(`✅ "${word}" is a valid English word`);
    } else {
      console.log(`❌ "${word}" is not a valid English word - skipping`);
    }
  }
  
  return validatedWords;
}

// Fallback words - all verified English dictionary words appropriate for Grade 1
const FALLBACK_WORDS = [
  // CVC Words (Consonant-Vowel-Consonant)
  { word: "BAT", category: "CVC" },
  { word: "CAR", category: "CVC" },
  { word: "DOG", category: "CVC" },
  { word: "EGG", category: "CVC" },
  { word: "FOX", category: "CVC" },
  { word: "HAT", category: "CVC" },
  { word: "JAR", category: "CVC" },
  { word: "KEY", category: "CVC" },
  { word: "LEG", category: "CVC" },
  { word: "MAP", category: "CVC" },
  { word: "NET", category: "CVC" },
  { word: "OWL", category: "CVC" },
  { word: "PIG", category: "CVC" },
  { word: "RUN", category: "CVC" },
  { word: "SUN", category: "CVC" },
  { word: "TOP", category: "CVC" },
  { word: "VAN", category: "CVC" },
  { word: "WIG", category: "CVC" },
  { word: "BOX", category: "CVC" },
  { word: "ZIP", category: "CVC" },
  { word: "CUP", category: "CVC" },
  { word: "BED", category: "CVC" },
  { word: "RED", category: "CVC" },
  { word: "BIG", category: "CVC" },
  { word: "HIT", category: "CVC" },
  
  // Blending Words
  { word: "STAR", category: "Blending" },
  { word: "STOP", category: "Blending" },
  { word: "FROG", category: "Blending" },
  { word: "BLUE", category: "Blending" },
  { word: "TRUE", category: "Blending" },
  { word: "TREE", category: "Blending" },
  { word: "FREE", category: "Blending" },
  { word: "PLAY", category: "Blending" },
  { word: "GRAY", category: "Blending" },
  { word: "GLAD", category: "Blending" },
  
  // Silent Letter Words
  { word: "KNEE", category: "Silent Letter" },
  { word: "LAMB", category: "Silent Letter" },
  { word: "THUMB", category: "Silent Letter" },
  { word: "KNIFE", category: "Silent Letter" },
  { word: "CLIMB", category: "Silent Letter" },
  
  // Phonics Merger Words
  { word: "CHAIR", category: "Phonics Merger" },
  { word: "SHIP", category: "Phonics Merger" },
  { word: "THAT", category: "Phonics Merger" },
  { word: "WHEN", category: "Phonics Merger" },
  { word: "PHONE", category: "Phonics Merger" }
];

// Generate new words using OpenAI with fallback and vocabulary validation
export async function generateNewWords(currentWords = [], count = 5) {
  console.log('🤖 Attempting to generate new words with OpenAI...');
  
  // First try OpenAI
  try {
    const result = await tryOpenAIGeneration(currentWords, count);
    if (result && result.length > 0) {
      // Validate words with dictionary API
      console.log('📚 Validating words with dictionary API...');
      const validatedWords = await validateWords(result);
      
      if (validatedWords.length > 0) {
        console.log(`✅ Successfully generated ${validatedWords.length} validated words with OpenAI`);
        return validatedWords;
      } else {
        console.log('⚠️ No valid words from OpenAI, using fallback');
      }
    }
  } catch (error) {
    console.warn('⚠️ OpenAI generation failed, using fallback method:', error.message);
  }
  
  // Fallback to predefined words (already validated)
  console.log('📝 Using fallback word generation...');
  return generateFallbackWords(currentWords, count);
}

// Try OpenAI generation with enhanced vocabulary requirements
async function tryOpenAIGeneration(currentWords, count) {
  const existingWords = currentWords.map(w => w.word || w).join(', ');
  
  const prompt = `Generate exactly ${count} REAL English words that exist in standard dictionaries with their phonics categories.

CRITICAL REQUIREMENTS:
- Words MUST be real English words found in dictionaries
- Words MUST be appropriate for Grade 1 phonics learning
- Categories must be one of: CVC, Blending, Silent Letter, Phonics Merger
- Words should be 3-8 letters long
- Words should be simple and common (avoid rare or technical words)
- Avoid these existing words: ${existingWords}

EXAMPLES OF GOOD WORDS:
- CVC: cat, dog, sun, run, big, red, top, cup
- Blending: star, stop, frog, blue, tree, green
- Silent Letter: knife, lamb, wrist, knee, thumb
- Phonics Merger: chair, ship, that, when, phone

Return ONLY a JSON array in this exact format:
[
  {"word": "CAT", "category": "CVC"},
  {"word": "STAR", "category": "Blending"},
  {"word": "KNEE", "category": "Silent Letter"}
]

No additional text, just the JSON array with REAL dictionary words only.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7, // Slightly lower temperature for more consistent results
      max_tokens: 300
    })
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('OpenAI API key is invalid or expired. Please update the API key in src/services/openai.js');
    }
    throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  const newWords = JSON.parse(content);
  return newWords;
}

// Generate fallback words when OpenAI is not available
function generateFallbackWords(currentWords = [], count = 5) {
  const existingWords = currentWords.map(w => (w.word || w).toUpperCase());
  const availableWords = FALLBACK_WORDS.filter(word => 
    !existingWords.includes(word.word.toUpperCase())
  );
  
  // Shuffle and take the requested count
  const shuffled = availableWords.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  console.log('📝 Generated fallback words:', selected);
  return selected;
}

// Generate new story with Q&A using OpenAI with fallback
export async function generateNewStory(existingTitles = []) {
  console.log('🤖 Attempting to generate new story with OpenAI...');
  
  // First try OpenAI
  try {
    const result = await tryOpenAIStoryGeneration(existingTitles);
    if (result && result.title) {
      console.log('✅ Successfully generated story with OpenAI:', result.title);
      return result;
    }
  } catch (error) {
    console.warn('⚠️ OpenAI story generation failed, using fallback method:', error.message);
  }
  
  // Fallback to predefined story
  console.log('📝 Using fallback story generation...');
  return generateFallbackStory(existingTitles);
}

// Try OpenAI story generation
async function tryOpenAIStoryGeneration(existingTitles) {
  const usedTitles = existingTitles.join(', ');
  
  const prompt = `Create a very simple short story with 5 questions and answers for Grade 1 Filipino students learning English phonics.

STORY REQUIREMENTS:
- EXACTLY 3-4 sentences only
- Use simple, common English words (cat, dog, run, play, sun, etc.)
- Words should be easy to read and pronounce for Filipino Grade 1 students
- Story should be simple, relatable, and easy to understand
- Avoid complex vocabulary, long words, or difficult concepts
- Focus on everyday situations (family, animals, food, toys, school)
- Make it engaging but very simple
- Avoid these existing titles: ${usedTitles}

QUESTION REQUIREMENTS:
- Questions should be about basic story details (who, what, where)
- Use simple English words in questions
- Answers should be 1-3 words maximum
- Focus on comprehension of simple facts from the story

EXAMPLE STYLE:
"Tom has a red ball. He plays with his dog Max. Max runs fast. Tom is happy."

Return ONLY a JSON object in this exact format:
{
  "title": "Story Title",
  "story": "The complete story text",
  "Q1": "First question?",
  "A1": "Short answer",
  "Q2": "Second question?",
  "A2": "Short answer",
  "Q3": "Third question?",
  "A3": "Short answer",
  "Q4": "Fourth question?",
  "A4": "Short answer",
  "Q5": "Fifth question?",
  "A5": "Short answer"
}

No additional text, just the JSON object.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('OpenAI API key is invalid or expired. Please update the API key in src/services/openai.js');
    }
    throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  const newStory = JSON.parse(content);
  return newStory;
}

// Fallback story templates
const FALLBACK_STORIES = [
  {
    title: "The Big Red Dog",
    story: "Max is a big red dog. He likes to run in the park. Max plays with a ball. The ball is blue.",
    Q1: "What color is Max?",
    A1: "Red",
    Q2: "Where does Max run?",
    A2: "In the park",
    Q3: "What does Max play with?",
    A3: "A ball",
    Q4: "What color is the ball?",
    A4: "Blue",
    Q5: "Is Max big or small?",
    A5: "Big"
  },
  {
    title: "Cat and Sun",
    story: "A cat sits on a mat. The sun is hot. The cat is happy. She likes the warm sun.",
    Q1: "Where does the cat sit?",
    A1: "On a mat",
    Q2: "How is the sun?",
    A2: "Hot",
    Q3: "How does the cat feel?",
    A3: "Happy",
    Q4: "What does the cat like?",
    A4: "Warm sun",
    Q5: "What animal is in the story?",
    A5: "Cat"
  },
  {
    title: "Boy and Toy",
    story: "Tim has a new toy car. The car is fast. Tim plays all day. He is very happy.",
    Q1: "Who has a toy car?",
    A1: "Tim",
    Q2: "What kind of toy is it?",
    A2: "Car",
    Q3: "How is the car?",
    A3: "Fast",
    Q4: "How long does Tim play?",
    A4: "All day",
    Q5: "How does Tim feel?",
    A5: "Happy"
  }
];

// Generate fallback story when OpenAI is not available
function generateFallbackStory(existingTitles = []) {
  const usedTitles = existingTitles.map(title => title.toLowerCase());
  const availableStories = FALLBACK_STORIES.filter(story => 
    !usedTitles.includes(story.title.toLowerCase())
  );
  
  if (availableStories.length === 0) {
    // If all stories used, return a random one
    const randomStory = FALLBACK_STORIES[Math.floor(Math.random() * FALLBACK_STORIES.length)];
    console.log('📝 Generated fallback story (all used, picking random):', randomStory.title);
    return randomStory;
  }
  
  // Return a random available story
  const randomStory = availableStories[Math.floor(Math.random() * availableStories.length)];
  console.log('📝 Generated fallback story:', randomStory.title);
  return randomStory;
}

/**
 * Analyze words in a story and categorize them by phonics type
 * @param {string} storyText - The story text to analyze
 * @param {boolean} useOpenAI - Whether to use OpenAI (true) or fallback logic (false)
 * @returns {Object} Analysis result with word categories and counts
 */
export async function analyzeStoryWords(storyText, useOpenAI = true) {
  if (!storyText || typeof storyText !== 'string') {
    console.error('❌ Invalid story text provided for analysis');
    return null;
  }

  console.log('🔍 Analyzing story words for phonics categories...');

  // Extract unique words from story (remove punctuation, duplicates)
  const words = storyText
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const uniqueWords = [...new Set(words)];
  console.log(`📊 Found ${uniqueWords.length} unique words to analyze`);

  if (useOpenAI) {
    try {
      return await analyzeWithOpenAI(uniqueWords);
    } catch (error) {
      console.warn('⚠️ OpenAI analysis failed, using fallback:', error.message);
      return analyzeFallback(uniqueWords);
    }
  } else {
    return analyzeFallback(uniqueWords);
  }
}

/**
 * Analyze words using OpenAI API
 */
async function analyzeWithOpenAI(words) {
  const wordList = words.join(', ');
  
  const prompt = `Analyze these words and categorize each by phonics type for Grade 1 students.

WORDS TO ANALYZE: ${wordList}

CATEGORIES:
1. **CVC** - Consonant-Vowel-Consonant (cat, dog, run, sit)
2. **Blending** - Words with consonant blends at start/end (stop, frog, nest, land)
3. **Silent Letter** - Words with silent letters (knee, lamb, write, knife)
4. **Phonics Merger** - Digraphs/special sounds (ship, chair, phone, that)
5. **Sight Words** - Common words learned by sight (the, is, was, are)
6. **Other** - Words that don't fit above categories

RULES:
- Categorize based on PRIMARY phonics teaching point
- Use the MOST PROMINENT feature if multiple apply
- Be consistent with Grade 1 phonics curriculum

Return ONLY a JSON object in this exact format:
{
  "categorized_words": {
    "CVC": ["cat", "dog"],
    "Blending": ["stop", "frog"],
    "Silent Letter": ["knee"],
    "Phonics Merger": ["ship", "that"],
    "Sight Words": ["the", "is"],
    "Other": ["example"]
  },
  "counts": {
    "CVC": 2,
    "Blending": 2,
    "Silent Letter": 1,
    "Phonics Merger": 2,
    "Sight Words": 2,
    "Other": 1
  },
  "total_words": 10
}

No additional text, just the JSON object.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a phonics expert for Grade 1 English education. Categorize words accurately based on their primary phonics teaching point.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent categorization
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('OpenAI API key is invalid or expired');
    }
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Parse JSON response
  const analysis = JSON.parse(content);
  
  console.log('✅ OpenAI analysis complete:', analysis.counts);
  return analysis;
}

/**
 * Fallback analysis using rule-based logic
 */
function analyzeFallback(words) {
  console.log('📝 Using rule-based fallback analysis...');
  
  const categories = {
    'CVC': [],
    'Blending': [],
    'Silent Letter': [],
    'Phonics Merger': [],
    'Sight Words': [],
    'Other': []
  };

  // Common sight words for Grade 1
  const sightWords = new Set([
    'the', 'a', 'is', 'was', 'are', 'be', 'to', 'of', 'and', 'in', 'it',
    'you', 'that', 'he', 'she', 'for', 'on', 'with', 'as', 'his', 'her',
    'they', 'at', 'but', 'or', 'my', 'we', 'can', 'said', 'there', 'an',
    'will', 'what', 'if', 'no', 'yes', 'do', 'go', 'so', 'by', 'one', 'two'
  ]);

  // Silent letter patterns
  const silentLetterPatterns = [
    /^kn/i,    // knee, knife, know
    /mb$/i,    // lamb, thumb, climb
    /^wr/i,    // write, wrist, wrap
    /gh/i,     // night, light, thought
    /^gn/i,    // gnome, gnat
    /alk$/i,   // walk, talk, chalk
    /ould$/i   // could, would, should
  ];

  // Phonics merger patterns (digraphs)
  const phonicsMergerPatterns = [
    /ch/i,     // chair, cheese, much
    /sh/i,     // ship, fish, wash
    /th/i,     // that, this, bath
    /wh/i,     // when, what, wheel
    /ph/i,     // phone, graph
    /ng/i,     // sing, ring, long
    /ck$/i,    // back, duck, rock
    /qu/i      // queen, quick, quilt
  ];

  // Consonant blends
  const blendPatterns = [
    /^(bl|cl|fl|gl|pl|sl)/i,     // bl-, cl-, fl-, etc.
    /^(br|cr|dr|fr|gr|pr|tr)/i,  // br-, cr-, dr-, etc.
    /^(sc|sk|sm|sn|sp|st|sw)/i,  // sc-, sk-, sm-, etc.
    /(ft|lt|mp|nd|nk|nt|pt|sk|st)$/i  // -ft, -lt, -mp, etc.
  ];

  words.forEach(word => {
    const lower = word.toLowerCase();
    
    // Check sight words first
    if (sightWords.has(lower)) {
      categories['Sight Words'].push(word);
    }
    // Check silent letters
    else if (silentLetterPatterns.some(pattern => pattern.test(lower))) {
      categories['Silent Letter'].push(word);
    }
    // Check phonics mergers (digraphs)
    else if (phonicsMergerPatterns.some(pattern => pattern.test(lower))) {
      categories['Phonics Merger'].push(word);
    }
    // Check blending
    else if (blendPatterns.some(pattern => pattern.test(lower))) {
      categories['Blending'].push(word);
    }
    // Check CVC pattern (3 letters, consonant-vowel-consonant)
    else if (/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/i.test(lower)) {
      categories['CVC'].push(word);
    }
    // Everything else
    else {
      categories['Other'].push(word);
    }
  });

  const counts = {};
  Object.keys(categories).forEach(category => {
    counts[category] = categories[category].length;
  });

  const analysis = {
    categorized_words: categories,
    counts: counts,
    total_words: words.length
  };

  console.log('✅ Fallback analysis complete:', counts);
  return analysis;
}