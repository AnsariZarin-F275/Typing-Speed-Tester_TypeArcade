const WORD_LIST = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
  "developer", "arcade", "frontend", "interface", "dynamic", "vibrant",
  "speed", "accuracy", "challenge", "improve", "practice", "leaderboard",
  "software", "engineer", "javascript", "code", "design", "creative",
  "energy", "bounce", "progress", "success", "future", "technology"
];

const SENTENCES = [
  "Typing fast is an essential skill in the modern digital age.",
  "Arcade games brought colorful and vibrant experiences to everyone.",
  "Developing a great user interface requires balancing aesthetics and usability.",
  "Practice makes perfect when it comes to improving your typing speed.",
  "A soft gradient background paired with playful elements creates joy.",
  "The quick brown fox jumps over the lazy dog easily.",
  "Hard work beats talent when talent fails to work hard."
];

const HOMEROW_WORDS = [
  "sad", "lad", "dad", "ask", "flask", "flask", "disk", "ads", "jas", "alfs",
  "flag", "fads", "jabs", "lads", "lack", "falls", "flash", "salary", "salad",
  "class", "glass", "atlas", "slack", "ladyfish", "adsense", "flashdisk",
  "salsa", "salsa", "alf", "alfa", "das", "all", "alley", "jazz", "jazzed"
];

const NUMBERS_WORDS = [
  "123", "456", "789", "100", "2020", "2024", "2025", "3.14", "9.99", "100%",
  "50%", "99.9%", "007", "404", "8-8-8", "24/7", "50/50", "3:30", "12:00",
  "$100", "$50", "$999", "#1", "#2", "#3", "==", "!=", "->", "=>", 
  "++", "--", "&&", "||", "!", "@", "&", "%", "^", "*", "+", "-", "/", ":",
  "123.456", "0.5", "1+1", "2*3", "10/5", "99-1", "!!!", "???", "...", "---",
  ";;;", ":::", "()", "[]", "{}", "<>", "/*", "*/", "//", "\"\"", "''", "``"
];

const STORAGE_KEYS = {
  result: 'typingResult',
  history: 'typeArcade_history',
  leaderboard: 'leaderboard',
  weakKeys: 'weakKeys',
  sound: 'typeArcade_sound',
  animations: 'typeArcade_animations',
  fontSize: 'typeArcade_fontSize'
};

function safeParse(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[TypeArcade] Failed to parse stored value', value, error);
    return fallback;
  }
}

function readStorage(key, fallback = null) {
  const rawValue = localStorage.getItem(key);
  return safeParse(rawValue, fallback);
}

function writeStorage(key, value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(key, serialized);
}

function migrateStorageKey(oldKey, newKey) {
  if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
    localStorage.setItem(newKey, localStorage.getItem(oldKey));
  }
}

function initializeStorage() {
  migrateStorageKey('TypeArcade_history', STORAGE_KEYS.history);
  migrateStorageKey('typeArcade_history', STORAGE_KEYS.history);

  if (!localStorage.getItem(STORAGE_KEYS.result) && localStorage.getItem('typeArcade_result')) {
    localStorage.setItem(STORAGE_KEYS.result, localStorage.getItem('typeArcade_result'));
  }
}

initializeStorage();

function getRandomWords(count) {
  let words = [];
  for (let i = 0; i < count; i++) {
    words.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
  }
  return words.join(" ");
}

function getRandomHomeRowWords(count) {
  let words = [];
  for (let i = 0; i < count; i++) {
    words.push(HOMEROW_WORDS[Math.floor(Math.random() * HOMEROW_WORDS.length)]);
  }
  return words.join(" ");
}

function getRandomNumbersWords(count) {
  let words = [];
  for (let i = 0; i < count; i++) {
    words.push(NUMBERS_WORDS[Math.floor(Math.random() * NUMBERS_WORDS.length)]);
  }
  return words.join(" ");
}

function getRandomSentence() {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
}

document.addEventListener('DOMContentLoaded', () => {
  const animationsEnabled = readStorage(STORAGE_KEYS.animations, true) !== false;
  if (animationsEnabled) {
    document.body.classList.add('fade-in');
  }

  const baseFontSize = readStorage(STORAGE_KEYS.fontSize);
  if (baseFontSize) {
    document.documentElement.style.setProperty('--typing-font-size', baseFontSize + 'px');
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  const nav = document.querySelector('.navbar');
  const navLinksList = document.querySelector('.nav-links');

  if (nav && navLinksList && !document.querySelector('.nav-toggle')) {
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'nav-toggle';
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-label', 'Toggle navigation');
    toggleButton.innerHTML = '<span></span>';

    nav.insertBefore(toggleButton, navLinksList);

    toggleButton.addEventListener('click', () => {
      const isOpen = navLinksList.classList.toggle('open');
      toggleButton.classList.toggle('active', isOpen);
      toggleButton.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('nav-open', isOpen);
    });

    navLinksList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinksList.classList.remove('open');
        toggleButton.classList.remove('active');
        toggleButton.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
