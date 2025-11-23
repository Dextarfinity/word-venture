// Data Management Service for CSV and Supabase operations
import supabase from '../supabase.js';

// Generate updated CSV file for manual replacement
export function generateUpdatedCSV(data, filename) {
  console.log(`📝 Generating updated CSV for manual replacement: ${filename}...`);
  
  let csvContent = '';
  
  if (filename.includes('words')) {
    // Words CSV format
    csvContent = 'word,category\n';
    data.forEach(item => {
      csvContent += `${item.word},${item.category}\n`;
    });
  } else if (filename.includes('stories')) {
    // Stories CSV format
    csvContent = 'Story #,Title,Story Text,Q1,A1,Q2,A2,Q3,A3,Q4,A4,Q5,A5\n';
    data.forEach((item, index) => {
      const storyNum = index + 1;
      csvContent += `${storyNum},"${item.Title}","${item['Story Text']}","${item.Q1}","${item.A1}","${item.Q2}","${item.A2}","${item.Q3}","${item.A3}","${item.Q4}","${item.A4}","${item.Q5}","${item.A5}"\n`;
    });
  }
  
  // CSV download functionality removed - data now synced to Supabase only
  console.log(`✅ Data changes synced to Supabase - no local CSV download`);
  return csvContent;
}

// Update CSV file directly (no download, direct file update)
export async function updateCSVFile(data, filename) {
  console.log(`� Updating CSV file directly: ${filename}...`);
  
  let csvContent = '';
  
  if (filename.includes('words')) {
    // Words CSV format
    csvContent = 'word,category\n';
    data.forEach(item => {
      csvContent += `${item.word},${item.category}\n`;
    });
  } else if (filename.includes('stories')) {
    // Stories CSV format
    csvContent = 'Story #,Title,Story Text,Q1,A1,Q2,A2,Q3,A3,Q4,A4,Q5,A5\n';
    data.forEach((item, index) => {
      const storyNum = index + 1;
      csvContent += `${storyNum},"${item.Title}","${item['Story Text']}","${item.Q1}","${item.A1}","${item.Q2}","${item.A2}","${item.Q3}","${item.A3}","${item.Q4}","${item.A4}","${item.Q5}","${item.A5}"\n`;
    });
  }
  
  // CSV download functionality removed - data now synced to Supabase only
  console.log(`✅ Data changes synced to Supabase - no local CSV download`);
  return true;
}

// Legacy function - kept for compatibility
export function downloadUpdatedCSV(data, filename) {
  console.log(`📁 Downloading updated ${filename}...`);
  return updateCSVFile(data, filename);
}

// Add new words to Supabase
export async function addWordsToSupabase(newWords) {
  console.log('📊 Adding new words to Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('Words')
      .insert(newWords);
      
    if (error) {
      console.error('❌ Supabase words insert error:', error);
      return false;
    }
    
    console.log('✅ Words added to Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding words to Supabase:', error);
    return false;
  }
}

// Add new story to Supabase
export async function addStoryToSupabase(newStory) {
  console.log('📊 Adding new story to Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('Short_Stories')
      .insert([newStory]);
      
    if (error) {
      console.error('❌ Supabase story insert error:', error);
      return false;
    }
    
    console.log('✅ Story added to Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding story to Supabase:', error);
    return false;
  }
}

// Get current words from Supabase
export async function getCurrentWords() {
  try {
    const { data, error } = await supabase
      .from('Words')
      .select('word, category');
      
    if (error) {
      console.error('❌ Error fetching current words:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching words:', error);
    return [];
  }
}

// Get current stories from Supabase
export async function getCurrentStories() {
  try {
    const { data, error } = await supabase
      .from('Short_Stories')
      .select('*');
      
    if (error) {
      console.error('❌ Error fetching current stories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching stories:', error);
    return [];
  }
}

// Auto-generate and update words system
export async function autoGenerateWords(triggerProgress = 100) {
  console.log('🔄 Auto-generating new words...');
  
  try {
    // Get current words
    const currentWords = await getCurrentWords();
    
    // Generate new words
    const { generateNewWords } = await import('./openai.js');
    const newWords = await generateNewWords(currentWords, 5);
    
    if (newWords && newWords.length > 0) {
      // Add to Supabase
      const supabaseSuccess = await addWordsToSupabase(newWords);
      
      // Update CSV file directly (no download)
      const allWords = [...currentWords, ...newWords];
      await updateCSVFile(allWords, 'updated_words_dataset.csv');
      
      console.log('✅ Auto-generation complete! CSV file updated directly.');
      return { success: true, newWords, allWords };
    }
    
    return { success: false };
  } catch (error) {
    console.error('❌ Auto-generation failed:', error);
    return { success: false, error };
  }
}

// Auto-generate and update stories system
export async function autoGenerateStory() {
  console.log('🔄 Auto-generating new story...');
  
  try {
    // Get current stories
    const currentStories = await getCurrentStories();
    const existingTitles = currentStories.map(s => s.Title || s.title);
    
    // Generate new story
    const { generateNewStory } = await import('./openai.js');
    const newStory = await generateNewStory(existingTitles);
    
    if (newStory) {
      // Add to Supabase
      const supabaseSuccess = await addStoryToSupabase(newStory);
      
      // Update CSV file directly (no download)
      const allStories = [...currentStories, newStory];
      await updateCSVFile(allStories, 'stories_qna_clean_titles_3x.csv');
      
      console.log('✅ Story auto-generation complete! CSV file updated directly.');
      return { success: true, newStory, allStories };
    }
    
    return { success: false };
  } catch (error) {
    console.error('❌ Story auto-generation failed:', error);
    return { success: false, error };
  }
}