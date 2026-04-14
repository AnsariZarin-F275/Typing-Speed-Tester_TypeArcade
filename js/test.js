document.addEventListener('DOMContentLoaded', () => {
  const textDisplay = document.getElementById('text-display');
  const typingBox = document.getElementById('typing-box');
  const wpmDisplay = document.getElementById('wpm');
  const timeDisplay = document.getElementById('time');
  const accuracyDisplay = document.getElementById('accuracy');
  const mistakesDisplay = document.getElementById('mistakes');
  const progressBar = document.getElementById('progress-bar');
  const streakCounter = document.getElementById('streak-counter');
  
  const btnRestart = document.getElementById('btn-restart');
  const btnModeWords = document.getElementById('btn-mode-words');
  const btnModeSentences = document.getElementById('btn-mode-sentences');

  let timeLimit = 30; // seconds
  let timeLeft = timeLimit;
  let timer = null;
  let isTyping = false;
  let targetText = "";
  let charsTyped = 0;
  let correctChars = 0;
  let errors = 0;
  let currentStreak = 0;
  let charElements = [];
  let weakKeys = {}; // object to store missed keys
  
  // Detect drill mode from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  let currentMode = urlParams.get('drill') || 'words';

  function initTest() {
    clearInterval(timer);
    isTyping = false;
    timeLeft = timeLimit;
    charsTyped = 0;
    correctChars = 0;
    errors = 0;
    currentStreak = 0;
    charElements = [];
    weakKeys = {};
    
    timeDisplay.innerText = timeLeft;
    wpmDisplay.innerText = '0';
    accuracyDisplay.innerText = '100%';
    mistakesDisplay.innerText = '0';
    progressBar.style.width = '0%';
    streakCounter.classList.remove('streak-active');

    // Remove old error state
    typingBox.classList.remove('error-state');

    // Generate text based on drill mode
    if (currentMode === 'homerow') {
      targetText = getRandomHomeRowWords(40);
    } else if (currentMode === 'numbers') {
      targetText = getRandomNumbersWords(40);
    } else if (currentMode === 'weakkeys') {
      // Get weak keys from localStorage if available
      const data = JSON.parse(localStorage.getItem('typingResult'));
      if (data && data.weakKeys && Object.keys(data.weakKeys).length > 0) {
        const topWeakKeys = Object.keys(data.weakKeys).slice(0, 10);
        targetText = topWeakKeys.join(' ') + ' ' + topWeakKeys.join(' ') + ' ' + topWeakKeys.join(' ') + ' ' + topWeakKeys.join(' ');
      } else {
        targetText = getRandomWords(40); // Fallback if no weak keys detected
      }
    } else if (currentMode === 'sentences') {
      targetText = getRandomSentence() + " " + getRandomSentence();
    } else {
      targetText = getRandomWords(40); // Default: words mode
    }
    
    textDisplay.innerHTML = '';
    targetText.split('').forEach((char, index) => {
      const span = document.createElement('span');
      span.innerText = char;
      charElements.push(span);
      textDisplay.appendChild(span);
    });
    
    if (charElements.length > 0) {
      charElements[0].classList.add('active');
    }

    typingBox.focus();
  }

  function handleStreak() {
    currentStreak++;
    if (currentStreak > 0 && currentStreak % 20 === 0) {
      streakCounter.innerText = `Combo x${currentStreak}! 🔥`;
      streakCounter.classList.add('streak-active');
      setTimeout(() => streakCounter.classList.remove('streak-active'), 2000);
    }
  }

  function triggerErrorShake() {
    typingBox.classList.remove('shake');
    void typingBox.offsetWidth; // trigger reflow
    typingBox.classList.add('shake');
    typingBox.classList.add('error-state');
    setTimeout(() => {
      typingBox.classList.remove('error-state');
    }, 200);
  }

  function endTest() {
    clearInterval(timer);
    isTyping = false;
    
    if (window.playSound) window.playSound('success');

    const minutes = (timeLimit - timeLeft > 0 ? (timeLimit - timeLeft) : timeLimit) / 60;
    let computedWpm = 0;
    if (minutes > 0) {
      computedWpm = Math.round((correctChars / 5) / minutes) || 0;
    }
    
    const accuracy = charsTyped > 0 ? Math.round(((charsTyped - errors) / charsTyped) * 100) : 100;
    
    // Save to local storage for Results page
    localStorage.setItem('typingResult', JSON.stringify({ 
      wpm: computedWpm, 
      accuracy, 
      chars: charsTyped, 
      errors,
      weakKeys 
    }));
    
    // Add to progress history
    let history = JSON.parse(localStorage.getItem('typeArcade_history')) || [];
    history.push({ date: new Date().toISOString(), wpm: computedWpm, accuracy });
    localStorage.setItem('typeArcade_history', JSON.stringify(history));

    setTimeout(() => {
      window.location.href = 'results.html';
    }, 500); // slight delay to allow sound to start
  }

  typingBox.addEventListener('keydown', (e) => {
    // Ignore non-character keys (shift, caps, etc.)
    if (e.key.length > 1 && e.key !== 'Backspace') return;

    if (e.key === ' ' && e.target === typingBox) {
      e.preventDefault(); // Prevent default scroll
    }

    if (!isTyping && e.key !== 'Backspace' && charsTyped < targetText.length) {
      isTyping = true;
      timer = setInterval(() => {
        timeLeft--;
        timeDisplay.innerText = timeLeft;
        
        // Dynamic WPM update
        const minsPassed = (timeLimit - timeLeft) / 60;
        if (minsPassed > 0) wpmDisplay.innerText = Math.round((correctChars / 5) / minsPassed);

        if (timeLeft <= 0) {
          endTest();
        }
      }, 1000);
    }

    if (e.key === 'Backspace') {
      if (charsTyped > 0) {
        if (window.playSound) window.playSound('key');
        charsTyped--;
        const currentCharSpan = charElements[charsTyped];
        const nextCharSpan = charElements[charsTyped + 1];
        
        if (nextCharSpan) nextCharSpan.classList.remove('active');
        currentCharSpan.classList.remove('correct', 'incorrect');
        currentCharSpan.classList.add('active');
        currentStreak = 0; // Break streak on backspace to be strict
      }
      return;
    }

    if (charsTyped < targetText.length) {
      const charSpan = charElements[charsTyped];
      const typedChar = e.key;
      const expectedChar = targetText[charsTyped];

      charSpan.classList.remove('active');

      if (typedChar === expectedChar) {
        if (window.playSound) window.playSound('correct');
        charSpan.classList.add('correct');
        correctChars++;
        handleStreak();
      } else {
        if (window.playSound) window.playSound('wrong');
        charSpan.classList.add('incorrect');
        errors++;
        mistakesDisplay.innerText = errors;
        triggerErrorShake();
        currentStreak = 0;
        
        // Log weak key
        const lowered = expectedChar.toLowerCase();
        if (lowered !== ' ') {
          weakKeys[lowered] = (weakKeys[lowered] || 0) + 1;
        }
      }

      charsTyped++;
      
      const accuracy = Math.round(((charsTyped - errors) / charsTyped) * 100);
      accuracyDisplay.innerText = `${accuracy}%`;
      
      const progressPercent = (charsTyped / targetText.length) * 100;
      progressBar.style.width = `${progressPercent}%`;

      if (charsTyped < targetText.length) {
        charElements[charsTyped].classList.add('active');
      } else {
        endTest(); // Finished all text
      }
    }
  });

  btnRestart.addEventListener('click', initTest);
  btnModeWords.addEventListener('click', () => { currentMode = 'words'; initTest(); });
  btnModeSentences.addEventListener('click', () => { currentMode = 'sentences'; initTest(); });

  // Init with detected drill mode
  initTest();
});
