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

  let timeLimit = 30;
  let timeLeft = timeLimit;
  let timer = null;
  let isTyping = false;
  let targetText = "";
  let charsTyped = 0;
  let correctChars = 0;
  let errors = 0;
  let currentStreak = 0;
  let charElements = [];
  let weakKeys = {};

  const urlParams = new URLSearchParams(window.location.search);
  let currentMode = urlParams.get('drill') || 'words';

  function ensureUsername() {
    const existingUsername = (localStorage.getItem('typeArcade_username') || '').trim();
    if (existingUsername) return existingUsername;

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.background = 'rgba(15, 23, 42, 0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';

    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.borderRadius = '16px';
    card.style.padding = '1.25rem';
    card.style.width = 'min(90vw, 360px)';
    card.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)';

    const title = document.createElement('h3');
    title.textContent = 'Choose a username';
    title.style.marginBottom = '0.75rem';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Player';
    input.maxLength = 20;
    input.style.width = '100%';
    input.style.padding = '0.7rem 0.85rem';
    input.style.border = '1px solid #cbd5e1';
    input.style.borderRadius = '10px';
    input.style.marginBottom = '0.75rem';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.className = 'btn btn-primary';
    saveButton.style.width = '100%';

    const saveUsername = () => {
      const username = (input.value || 'Player').trim().slice(0, 20) || 'Player';
      localStorage.setItem('typeArcade_username', username);
      modal.remove();
    };

    saveButton.addEventListener('click', saveUsername);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveUsername();
      }
    });

    card.append(title, input, saveButton);
    modal.appendChild(card);
    document.body.appendChild(modal);
    input.focus();
    return localStorage.getItem('typeArcade_username') || 'Player';
  }

  ensureUsername();

  function initTest() {

    clearInterval(timer);
    timer = null;

    isTyping = false;
    timeLeft = timeLimit;
    charsTyped = 0;
    correctChars = 0;
    errors = 0;
    currentStreak = 0;
    weakKeys = {};
    charElements = [];

    timeDisplay.innerText = timeLeft;
    wpmDisplay.innerText = '0';
    accuracyDisplay.innerText = '100%';
    mistakesDisplay.innerText = '0';
    progressBar.style.width = '0%';
    streakCounter.innerText = '';
    streakCounter.classList.remove('streak-active');

    typingBox.value = '';
    typingBox.classList.remove('error-state');

    // Generate text
    if (currentMode === 'homerow') {
      targetText = getRandomHomeRowWords(40);

    } else if (currentMode === 'numbers') {
      targetText = getRandomNumbersWords(40);

    } else if (currentMode === 'weakkeys') {

      const data = readStorage(STORAGE_KEYS.result);

      if (
        data &&
        data.weakKeys &&
        Object.keys(data.weakKeys).length
      ) {

        const topWeak =
          Object.keys(data.weakKeys)
          .slice(0, 10);

        targetText =
          topWeak.join(' ') + ' ' +
          topWeak.join(' ') + ' ' +
          topWeak.join(' ') + ' ' +
          topWeak.join(' ');

      } else {

        targetText = getRandomWords(40);
      }

    } else if (currentMode === 'sentences') {

      targetText =
        getRandomSentence() +
        ' ' +
        getRandomSentence();

    } else {

      targetText = getRandomWords(40);
    }

    textDisplay.innerHTML = '';

    targetText.split('').forEach(char => {

      const span =
        document.createElement('span');

      span.innerText = char;

      charElements.push(span);

      textDisplay.appendChild(span);
    });

    if (charElements.length) {
      charElements[0].classList.add('active');
    }

    typingBox.focus();
  }

  function handleStreak() {

    currentStreak++;

    if (
      currentStreak > 0 &&
      currentStreak % 20 === 0
    ) {

      streakCounter.innerText =
        `Combo x${currentStreak}! 🔥`;

      streakCounter.classList.add(
        'streak-active'
      );

      setTimeout(() => {
        streakCounter.classList.remove(
          'streak-active'
        );
      }, 2000);
    }
  }

  function triggerErrorShake() {

    typingBox.classList.remove('shake');

    void typingBox.offsetWidth;

    typingBox.classList.add('shake');
    typingBox.classList.add('error-state');

    setTimeout(() => {
      typingBox.classList.remove(
        'error-state'
      );
    }, 200);
  }

  function endTest() {

    if (timer === null) return;

    clearInterval(timer);
    timer = null;
    isTyping = false;

    console.log('[TypeArcade] End test reached');

    if (window.playSound) {
      window.playSound('success');
    }

    const elapsed =
      (timeLimit - timeLeft) > 0
      ? (timeLimit - timeLeft)
      : timeLimit;

    const minutes = elapsed / 60;

    const computedWpm =
      minutes > 0
      ? Math.round(
          (correctChars / 5) / minutes
        )
      : 0;

    const accuracy =
      charsTyped > 0
      ? Math.round(
          ((charsTyped - errors) /
          charsTyped) * 100
        )
      : 100;

    const username = localStorage.getItem('typeArcade_username') || 'Player';

    const result = {
      username: username,
      wpm: computedWpm,
      accuracy: accuracy,
      chars: charsTyped,
      errors: errors,
      weakKeys: weakKeys,
      createdAt:
        new Date().toISOString()
    };

    console.log('[TypeArcade] Saving result', result);

    try {
      writeStorage(STORAGE_KEYS.result, result);
      writeStorage(STORAGE_KEYS.weakKeys, result.weakKeys || {});

      const history = readStorage(STORAGE_KEYS.history, []);
      history.push({
        username: username,
        date: new Date().toISOString(),
        wpm: computedWpm,
        accuracy: accuracy,
        errors: errors
      });

      writeStorage(STORAGE_KEYS.history, history);
      console.log('[TypeArcade] History saved', history);
    } catch (err) {
      console.error('[TypeArcade] Local storage error', err);
    }

    setTimeout(() => {
      console.log('[TypeArcade] Redirecting to results');
      window.location.href = 'results.html';
    }, 1000);
  }

  typingBox.addEventListener(
    'keydown',
    (e) => {

      if (
        e.key.length > 1 &&
        e.key !== 'Backspace'
      ) return;

      if (e.key === ' ') {
        e.preventDefault();
      }

      if (
        !isTyping &&
        e.key !== 'Backspace'
      ) {

        isTyping = true;

        timer =
          setInterval(() => {

            timeLeft--;

            timeDisplay.innerText =
              timeLeft;

            const mins =
              (timeLimit -
                timeLeft) / 60;

            if (mins > 0) {

              wpmDisplay.innerText =
                Math.round(
                  (correctChars / 5)
                  / mins
                );
            }

            if (timeLeft <= 0) {
              endTest();
            }

          }, 1000);
      }

      if (e.key === 'Backspace') {

        if (charsTyped > 0) {

          charsTyped--;

          const current =
            charElements[
              charsTyped
            ];

          const next =
            charElements[
              charsTyped + 1
            ];

          if (next)
            next.classList.remove(
              'active'
            );

          current.classList.remove(
            'correct',
            'incorrect'
          );

          current.classList.add(
            'active'
          );

          currentStreak = 0;
        }

        return;
      }

      if (
        charsTyped >=
        targetText.length
      ) {
        return;
      }

      const expected =
        targetText[charsTyped];

      const typed =
        e.key;

      const span =
        charElements[
          charsTyped
        ];

      span.classList.remove(
        'active'
      );

      if (
        typed === expected
      ) {

        span.classList.add(
          'correct'
        );

        correctChars++;

        handleStreak();

      } else {

        span.classList.add(
          'incorrect'
        );

        errors++;

        mistakesDisplay.innerText =
          errors;

        currentStreak = 0;

        triggerErrorShake();

        const key =
          expected.toLowerCase();

        if (key !== ' ') {

          weakKeys[key] =
            (weakKeys[key] || 0)
            + 1;
        }
      }

      charsTyped++;

      accuracyDisplay.innerText =
        Math.round(
          ((charsTyped - errors)
          / charsTyped) * 100
        ) + '%';

      progressBar.style.width =
        (
          charsTyped /
          targetText.length
        ) * 100 + '%';

      if (
        charsTyped <
        targetText.length
      ) {

        charElements[
          charsTyped
        ].classList.add(
          'active'
        );

      } else {

        endTest();
      }
    }
  );

  btnRestart.addEventListener(
    'click',
    initTest
  );

  btnModeWords.addEventListener(
    'click',
    () => {
      currentMode = 'words';
      initTest();
    }
  );

  btnModeSentences.addEventListener(
    'click',
    () => {
      currentMode = 'sentences';
      initTest();
    }
  );

  initTest();
});