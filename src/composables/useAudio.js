import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

/**
 * Audio Manager for Word Venture
 * Handles background music and sound effects
 */

// Singleton instances for background music
let currentBackgroundMusic = null;
let currentMusicType = null;

// Audio file paths
const AUDIO_FILES = {
  // Background Music
  BGM_READING: '/audio/reading.mp3',
  BGM_MENU: '/audio/menu.mp3',
  BGM_LOBBY: '/audio/lobby.mp3',
  
  // Sound Effects
  SFX_CLICK_STUDENT: '/audio/click button student.mp3',
  SFX_CLICK_TEACHER: '/audio/click button teacher.mp3',
  SFX_CORRECT_WORD: '/audio/correct word.mp3',
  SFX_INCORRECT_WORD: '/audio/incorrect word.mp3',
};

// Music type constants
export const MUSIC_TYPES = {
  READING: 'reading',
  MENU: 'menu',
  LOBBY: 'lobby',
  NONE: 'none'
};

/**
 * Play background music (looped)
 */
export function playBackgroundMusic(musicType, volume = 0.3) {
  // Stop current music if it's a different type
  if (currentMusicType === musicType && currentBackgroundMusic && !currentBackgroundMusic.paused) {
    console.log(`🎵 Background music ${musicType} already playing`);
    return;
  }

  // Stop any existing background music
  stopBackgroundMusic();

  let audioPath;
  switch (musicType) {
    case MUSIC_TYPES.READING:
      audioPath = AUDIO_FILES.BGM_READING;
      break;
    case MUSIC_TYPES.MENU:
      audioPath = AUDIO_FILES.BGM_MENU;
      break;
    case MUSIC_TYPES.LOBBY:
      audioPath = AUDIO_FILES.BGM_LOBBY;
      break;
    default:
      console.warn('⚠️ Unknown music type:', musicType);
      return;
  }

  try {
    currentBackgroundMusic = new Audio(audioPath);
    currentBackgroundMusic.loop = true;
    currentBackgroundMusic.volume = volume;
    currentMusicType = musicType;
    
    const playPromise = currentBackgroundMusic.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`🎵 Playing background music: ${musicType}`);
        })
        .catch((error) => {
          console.error('❌ Error playing background music:', error);
          // Autoplay might be blocked - this is expected on some browsers
          if (error.name === 'NotAllowedError') {
            console.log('🔇 Autoplay blocked - music will play after user interaction');
          }
        });
    }
  } catch (error) {
    console.error('❌ Error creating background music:', error);
  }
}

/**
 * Stop background music
 */
export function stopBackgroundMusic() {
  if (currentBackgroundMusic) {
    console.log(`🔇 Stopping background music: ${currentMusicType}`);
    currentBackgroundMusic.pause();
    currentBackgroundMusic.currentTime = 0;
    currentBackgroundMusic = null;
    currentMusicType = null;
  }
}

/**
 * Pause background music
 */
export function pauseBackgroundMusic() {
  if (currentBackgroundMusic && !currentBackgroundMusic.paused) {
    console.log(`⏸️ Pausing background music: ${currentMusicType}`);
    currentBackgroundMusic.pause();
  }
}

/**
 * Resume background music
 */
export function resumeBackgroundMusic() {
  if (currentBackgroundMusic && currentBackgroundMusic.paused) {
    console.log(`▶️ Resuming background music: ${currentMusicType}`);
    currentBackgroundMusic.play().catch(error => {
      console.error('❌ Error resuming music:', error);
    });
  }
}

/**
 * Play sound effect (one-shot)
 */
export function playSoundEffect(soundType, volume = 0.5) {
  let audioPath;
  
  switch (soundType) {
    case 'click_student':
      audioPath = AUDIO_FILES.SFX_CLICK_STUDENT;
      break;
    case 'click_teacher':
      audioPath = AUDIO_FILES.SFX_CLICK_TEACHER;
      break;
    case 'correct_word':
      audioPath = AUDIO_FILES.SFX_CORRECT_WORD;
      break;
    case 'incorrect_word':
      audioPath = AUDIO_FILES.SFX_INCORRECT_WORD;
      break;
    default:
      console.warn('⚠️ Unknown sound effect:', soundType);
      return;
  }

  try {
    const sfx = new Audio(audioPath);
    sfx.volume = volume;
    
    sfx.play().catch(error => {
      console.error('❌ Error playing sound effect:', error);
    });
  } catch (error) {
    console.error('❌ Error creating sound effect:', error);
  }
}

/**
 * Play click sound based on user type
 */
export function playClickSound(userType) {
  const soundType = userType === 'teacher' ? 'click_teacher' : 'click_student';
  playSoundEffect(soundType);
}

/**
 * Play word feedback sound
 */
export function playWordFeedback(isCorrect) {
  const soundType = isCorrect ? 'correct_word' : 'incorrect_word';
  playSoundEffect(soundType);
}

/**
 * Composable for managing audio in components
 */
export function useAudio() {
  const router = useRouter();
  const isPlaying = ref(false);
  const currentMusic = ref(null);

  /**
   * Start background music for this component
   */
  const startMusic = (musicType, volume = 0.3) => {
    playBackgroundMusic(musicType, volume);
    currentMusic.value = musicType;
    isPlaying.value = true;
  };

  /**
   * Stop music when component unmounts
   */
  onUnmounted(() => {
    if (currentMusic.value) {
      stopBackgroundMusic();
    }
  });

  return {
    // Background Music
    startMusic,
    stopMusic: stopBackgroundMusic,
    pauseMusic: pauseBackgroundMusic,
    resumeMusic: resumeBackgroundMusic,
    
    // Sound Effects
    playClick: playClickSound,
    playWordFeedback,
    playSFX: playSoundEffect,
    
    // State
    isPlaying,
    currentMusic,
    
    // Constants
    MUSIC_TYPES
  };
}

export default useAudio;
