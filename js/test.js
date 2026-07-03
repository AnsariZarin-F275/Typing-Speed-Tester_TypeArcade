import {
  db,
  doc,
  getDoc,
  setDoc
} from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {

  const textDisplay = document.getElementById('text-display');
  const typingBox = document.getElementById('typing-box');
  const typingInput = document.getElementById('typing-input');
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
  let typedValue = '';
  let lastInputValue = '';
  let suppressNextInput = false;

  const urlParams = new URLSearchParams(window.location.search);
  let currentMode = urlParams.get('drill') || 'words';

  function focusTypingInput() {
    if (!typingInput) return;
    typingInput.focus({ preventScroll: true });
    typingBox?.classList.add('focused');
    document.body.classList.add('mobile-typing-active');
  }

  function startTimerIfNeeded() {
    if (isTyping) return;

    isTyping = true;

    timer = setInterval(() => {
      timeLeft--;
      timeDisplay.innerText = timeLeft;

      const mins = (timeLimit - timeLeft) / 60;

      if (mins > 0) {
        wpmDisplay.innerText = Math.round((correctChars / 5) / mins);
      }

      if (timeLeft <= 0) {
        endTest();
      }
    }, 1000);
  }

  function updateStats() {
    accuracyDisplay.innerText = `${Math.round(((charsTyped - errors) / Math.max(charsTyped, 1)) * 100)}%`;
    mistakesDisplay.innerText = errors;
    progressBar.style.width = `${(charsTyped / Math.max(targetText.length, 1)) * 100}%`;
  }

  function handleBackspace() {
    if (charsTyped <= 0) return;

    charsTyped--;
    const current = charElements[charsTyped];
    const next = charElements[charsTyped + 1];

    if (next) next.classList.remove('active');
    if (current) {
      current.classList.remove('correct', 'incorrect');
      current.classList.add('active');
    }

    currentStreak = 0;
    typedValue = typedValue.slice(0, -1);
    updateStats();
  }

  function processCharacter(key) {
    if (charsTyped >= targetText.length) return;

    const expected = targetText[charsTyped];
    const span = charElements[charsTyped];

    if (!span) return;

    span.classList.remove('active');

    if (key === expected) {
      span.classList.add('correct');
      correctChars++;
      handleStreak();
    } else {
      span.classList.add('incorrect');
      errors++;
      currentStreak = 0;
      triggerErrorShake();

      const weakKey = expected.toLowerCase();
      if (weakKey !== ' ') {
        weakKeys[weakKey] = (weakKeys[weakKey] || 0) + 1;
      }
    }

    charsTyped++;
    typedValue += key;
    updateStats();

    if (charsTyped < targetText.length) {
      charElements[charsTyped].classList.add('active');
    } else {
      endTest();
    }
  }

  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'player';
  }

  async function checkLeaderboardUsername(username) {
    try {
      const normalized = normalizeUsername(username);
      const docRef = doc(db, 'leaderboard', normalized);
      const snapshot = await getDoc(docRef);
      return { docRef, exists: snapshot.exists(), data: snapshot.exists() ? snapshot.data() : null };
    } catch (error) {
      console.error('[TypeArcade] Username lookup failed', error);
      return { exists: false, data: null };
    }
  }

  async function ensureUsername() {
    const existingUsername = (localStorage.getItem('typeArcade_username') || '').trim();

    typingInput?.blur();
    typingBox?.classList.remove('focused');
    document.body.classList.remove('mobile-typing-active');

    const createUserRecord = async (username) => {
      const normalizedUsername = normalizeUsername(username);
      const leaderboardRef = doc(db, 'leaderboard', normalizedUsername);
      await setDoc(leaderboardRef, {
        username,
        wpm: 0,
        accuracy: 100,
        errors: 0,
        weakKeys: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    };

    const promptForUsername = () => new Promise((resolve) => {
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
      input.value = existingUsername || 'Player';
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

      const finish = (value) => {
        modal.remove();
        resolve(value);
      };

      const saveUsername = async () => {
        const username = (input.value || 'Player').trim().slice(0, 20) || 'Player';
        const lookup = await checkLeaderboardUsername(username);

        if (lookup.exists) {
          modal.remove();
          const returnModal = document.createElement('div');
          returnModal.style.position = 'fixed';
          returnModal.style.top = '0';
          returnModal.style.left = '0';
          returnModal.style.right = '0';
          returnModal.style.bottom = '0';
          returnModal.style.background = 'rgba(15, 23, 42, 0.7)';
          returnModal.style.display = 'flex';
          returnModal.style.alignItems = 'center';
          returnModal.style.justifyContent = 'center';
          returnModal.style.zIndex = '10000';

          const returnCard = document.createElement('div');
          returnCard.style.background = 'white';
          returnCard.style.borderRadius = '16px';
          returnCard.style.padding = '1.25rem';
          returnCard.style.width = 'min(90vw, 420px)';
          returnCard.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)';

          const welcomeTitle = document.createElement('h3');
          welcomeTitle.textContent = `Welcome back, ${username}!`;
          welcomeTitle.style.marginBottom = '0.75rem';

          const welcomeText = document.createElement('p');
          welcomeText.textContent = 'This username already exists.';
          welcomeText.style.marginBottom = '0.5rem';

          const followUp = document.createElement('p');
          followUp.textContent = 'Would you like to continue as this user or use another username?';
          followUp.style.marginBottom = '1rem';

          const buttonRow = document.createElement('div');
          buttonRow.style.display = 'flex';
          buttonRow.style.gap = '0.75rem';
          buttonRow.style.flexWrap = 'wrap';

          const continueButton = document.createElement('button');
          continueButton.textContent = 'Continue';
          continueButton.className = 'btn btn-primary';
          continueButton.style.flex = '1';

          const anotherButton = document.createElement('button');
          anotherButton.textContent = 'Use Another Username';
          anotherButton.className = 'btn btn-outline';
          anotherButton.style.flex = '1';

          continueButton.addEventListener('click', () => {
            localStorage.setItem('typeArcade_username', username);
            returnModal.remove();
            finish({ username, action: 'continue' });
          });

          anotherButton.addEventListener('click', () => {
            returnModal.remove();
            (async () => {
              const nextChoice = await promptForUsername();
              resolve(nextChoice);
            })();
          });

          returnCard.append(welcomeTitle, welcomeText, followUp, buttonRow);
          buttonRow.append(continueButton, anotherButton);
          returnModal.appendChild(returnCard);
          document.body.appendChild(returnModal);
          return;
        }

        localStorage.setItem('typeArcade_username', username);
        await createUserRecord(username);
        finish({ username, action: 'new' });
      };

      saveButton.addEventListener('click', () => {
        saveUsername();
      });
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
    });

    if (existingUsername) {
      const lookup = await checkLeaderboardUsername(existingUsername);
      if (lookup.exists) {
        const returnChoice = await new Promise((resolve) => {
          const returnModal = document.createElement('div');
          returnModal.style.position = 'fixed';
          returnModal.style.top = '0';
          returnModal.style.left = '0';
          returnModal.style.right = '0';
          returnModal.style.bottom = '0';
          returnModal.style.background = 'rgba(15, 23, 42, 0.7)';
          returnModal.style.display = 'flex';
          returnModal.style.alignItems = 'center';
          returnModal.style.justifyContent = 'center';
          returnModal.style.zIndex = '10000';

          const returnCard = document.createElement('div');
          returnCard.style.background = 'white';
          returnCard.style.borderRadius = '16px';
          returnCard.style.padding = '1.25rem';
          returnCard.style.width = 'min(90vw, 420px)';
          returnCard.style.boxShadow = '0 20px 50px rgba(0,0,0,0.25)';

          const welcomeTitle = document.createElement('h3');
          welcomeTitle.textContent = `Welcome back, ${existingUsername}!`;
          welcomeTitle.style.marginBottom = '0.75rem';

          const welcomeText = document.createElement('p');
          welcomeText.textContent = 'This username already exists.';
          welcomeText.style.marginBottom = '0.5rem';

          const followUp = document.createElement('p');
          followUp.textContent = 'Would you like to continue as this user or use another username?';
          followUp.style.marginBottom = '1rem';

          const buttonRow = document.createElement('div');
          buttonRow.style.display = 'flex';
          buttonRow.style.gap = '0.75rem';
          buttonRow.style.flexWrap = 'wrap';

          const continueButton = document.createElement('button');
          continueButton.textContent = 'Continue';
          continueButton.className = 'btn btn-primary';
          continueButton.style.flex = '1';

          const anotherButton = document.createElement('button');
          anotherButton.textContent = 'Use Another Username';
          anotherButton.className = 'btn btn-outline';
          anotherButton.style.flex = '1';

          continueButton.addEventListener('click', () => {
            returnModal.remove();
            resolve('continue');
          });

          anotherButton.addEventListener('click', () => {
            returnModal.remove();
            resolve('another');
          });

          returnCard.append(welcomeTitle, welcomeText, followUp, buttonRow);
          buttonRow.append(continueButton, anotherButton);
          returnModal.appendChild(returnCard);
          document.body.appendChild(returnModal);
        });

        if (returnChoice === 'continue') {
          const lookupAgain = await checkLeaderboardUsername(existingUsername);
          if (!lookupAgain.exists) {
            await createUserRecord(existingUsername);
          }
          return { username: existingUsername, action: 'continue' };
        }

        return promptForUsername();
      }

      if (!lookup.exists) {
        await createUserRecord(existingUsername);
      }
      return { username: existingUsername, action: 'continue' };
    }

    return promptForUsername();
  }

  ensureUsername().then((result) => {
    if (result && result.username) {
      initTest();
    }
  });

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

    if (typingInput) {
      typingInput.value = '';
      typingInput.setAttribute('autocomplete', 'off');
      typingInput.setAttribute('autocapitalize', 'off');
      typingInput.setAttribute('autocorrect', 'off');
      typingInput.setAttribute('spellcheck', 'false');
    }
    typingBox.classList.remove('error-state');
    typedValue = '';
    lastInputValue = '';
    suppressNextInput = false;

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

    const hasUsername = (localStorage.getItem('typeArcade_username') || '').trim();
    if (hasUsername) {
      setTimeout(() => focusTypingInput(), 50);
    }
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

  async function endTest() {

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

      const normalizedUsername = normalizeUsername(username);
      const leaderboardRef = doc(db, 'leaderboard', normalizedUsername);
      const existingSnapshot = await getDoc(leaderboardRef);

      if (!existingSnapshot.exists()) {
        await setDoc(leaderboardRef, {
          username: username,
          wpm: computedWpm,
          accuracy: accuracy,
          errors: errors,
          weakKeys: weakKeys,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const existingData = existingSnapshot.data() || {};
        const existingWpm = Number(existingData.wpm || 0);
        const existingAccuracy = Number(existingData.accuracy || 0);

        if (computedWpm > existingWpm || (computedWpm === existingWpm && accuracy > existingAccuracy)) {
          await setDoc(leaderboardRef, {
            username: username,
            wpm: computedWpm,
            accuracy: accuracy,
            errors: errors,
            weakKeys: weakKeys,
            createdAt: existingData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error('[TypeArcade] Local storage error', err);
    }

    setTimeout(() => {
      console.log('[TypeArcade] Redirecting to results');
      window.location.href = 'results.html';
    }, 1000);
  }

  typingInput?.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      startTimerIfNeeded();
      suppressNextInput = true;
      processCharacter(' ');
      typingInput.value = '';
      lastInputValue = '';
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      startTimerIfNeeded();
      handleBackspace();
      typingInput.value = '';
      lastInputValue = '';
      return;
    }

    if (e.key.length > 1) return;
    startTimerIfNeeded();
  });

  typingInput?.addEventListener('input', () => {
    if (!typingInput) return;

    const currentValue = typingInput.value;

    if (suppressNextInput) {
      suppressNextInput = false;
      typingInput.value = '';
      lastInputValue = '';
      return;
    }

    if (currentValue.length !== lastInputValue.length || currentValue.length === 0) {
      startTimerIfNeeded();
    }

    if (currentValue.length < lastInputValue.length) {
      const deletions = lastInputValue.length - currentValue.length;
      for (let index = 0; index < deletions; index++) {
        handleBackspace();
      }
    } else if (currentValue.length > lastInputValue.length) {
      const appended = currentValue.slice(lastInputValue.length);
      if (appended) {
        appended.split('').forEach((char) => processCharacter(char));
      }
    }

    lastInputValue = currentValue;
  });

  typingBox?.addEventListener('click', focusTypingInput);
  typingBox?.addEventListener('touchstart', focusTypingInput, { passive: true });
  typingInput?.addEventListener('focus', () => {
    typingBox?.classList.add('focused');
    document.body.classList.add('mobile-typing-active');
  });
  typingInput?.addEventListener('blur', () => {
    typingBox?.classList.remove('focused');
    document.body.classList.remove('mobile-typing-active');
  });

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

});