import { ref, watch } from 'vue';

// Default avatars
const bearAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Student/bear.png",
  import.meta.url
).href;

const humanAvatar = new URL(
  "../img/CapyBuddy Assets/Profile/Avatar_Teachers/human.png",
  import.meta.url
).href;

const DEFAULT_STUDENT_AVATAR = bearAvatar;
const DEFAULT_TEACHER_AVATAR = humanAvatar;
const STUDENT_AVATAR_KEY = 'student_selected_avatar';
const TEACHER_AVATAR_KEY = 'teacher_selected_avatar';

// Reactive avatar states for both student and teacher
const currentStudentAvatar = ref(DEFAULT_STUDENT_AVATAR);
const currentTeacherAvatar = ref(DEFAULT_TEACHER_AVATAR);

// Initialize from localStorage
const initializeAvatars = () => {
  const storedStudent = localStorage.getItem(STUDENT_AVATAR_KEY);
  if (storedStudent) {
    currentStudentAvatar.value = storedStudent;
  }
  
  const storedTeacher = localStorage.getItem(TEACHER_AVATAR_KEY);
  if (storedTeacher) {
    currentTeacherAvatar.value = storedTeacher;
  }
};

// Watch for changes and save to localStorage
watch(currentStudentAvatar, (newAvatar) => {
  if (newAvatar) {
    localStorage.setItem(STUDENT_AVATAR_KEY, newAvatar);
  }
});

watch(currentTeacherAvatar, (newAvatar) => {
  if (newAvatar) {
    localStorage.setItem(TEACHER_AVATAR_KEY, newAvatar);
  }
});

// Initialize on first load
initializeAvatars();

export function useAvatar(userType = 'student') {
  const isTeacher = userType === 'teacher';
  const currentAvatar = isTeacher ? currentTeacherAvatar : currentStudentAvatar;
  const storageKey = isTeacher ? TEACHER_AVATAR_KEY : STUDENT_AVATAR_KEY;
  const defaultAvatar = isTeacher ? DEFAULT_TEACHER_AVATAR : DEFAULT_STUDENT_AVATAR;

  const setAvatar = (avatarUrl) => {
    if (avatarUrl) {
      currentAvatar.value = avatarUrl;
      localStorage.setItem(storageKey, avatarUrl);
      console.log(`✅ ${isTeacher ? 'Teacher' : 'Student'} avatar saved to localStorage:`, avatarUrl);
    }
  };

  const getAvatar = () => {
    const stored = localStorage.getItem(storageKey);
    return stored || defaultAvatar;
  };

  const resetAvatar = () => {
    currentAvatar.value = defaultAvatar;
    localStorage.setItem(storageKey, defaultAvatar);
  };

  return {
    currentAvatar,
    setAvatar,
    getAvatar,
    resetAvatar,
    DEFAULT_AVATAR: defaultAvatar,
  };
}
