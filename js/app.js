// app.js - Global App logic
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

function getRandomWords(count) {
  let words = [];
  for (let i = 0; i < count; i++) {
    words.push(WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);
  }
  return words.join(" ");
}

function getRandomSentence() {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
}

// Active Nav State logic & Body fade
document.addEventListener('DOMContentLoaded', () => {
  // Add body animation class if animations enabled
  const animationsEnabled = localStorage.getItem('typeArcade_animations') !== 'false';
  if (animationsEnabled) {
    document.body.classList.add('fade-in');
  }

  // Load Settings
  const baseFontSize = localStorage.getItem('typeArcade_fontSize');
  if (baseFontSize) {
    document.documentElement.style.setProperty('--typing-font-size', baseFontSize + 'px');
  }

  // Nav highlights
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
