// sound.js - Global Sound System

// Base64 Audio chunks to ensure it works entirely local without external HTTP requests.
// These are standard short synthesized waves.
const audioAssets = {
  key: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=", // Placeholder generic fast pop
  correct: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
  wrong: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
  success: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
};

// Creating real synthesized soft sounds using Web Audio API instead of base64 to ensure they are soft and pleasant!
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let unlocked = false;

// Unlock audio context on first user interaction
function unlockAudio() {
  if (unlocked) return;
  // Create empty buffer
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  unlocked = true;
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
}

document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

window.playSound = function(type) {
  // Check settings
  const soundEnabled = localStorage.getItem('typeArcade_sound') !== 'false'; // Default to true
  if (!soundEnabled || !unlocked) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'key') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  } 
  else if (type === 'correct') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } 
  else if (type === 'wrong') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  }
  else if (type === 'success') {
    // Small chord for success
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); // E5
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  }
};

// Also play soft click on all buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button, .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.playSound('key');
    });
  });
});
