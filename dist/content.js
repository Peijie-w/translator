(async () => {
  const DEFAULT_SETTINGS = {
    targetLanguage: 'zh-CN',
    sourceLanguage: 'auto',
    hoverDelayMs: 700
  };
  const MAX_SELECTION_LENGTH = 1500;

  const popup = createPopup();
  document.documentElement.append(popup.root);

  let settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  let hoverTimer = null;
  let activeToken = 0;
  let hoveredWord = '';
  let selectedText = '';
  let currentEntry = null;

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }

    settings = {
      ...settings,
      ...Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
    };
  });

  document.addEventListener('mousemove', handlePointerMove, true);
  document.addEventListener('mouseup', handleSelectionMouseUp, true);
  document.addEventListener('scroll', () => popup.hide(), true);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      popup.hide();
    }
  });

  function handlePointerMove(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (event.target.closest('[data-ubersetzer-popup]')) {
      return;
    }

    if (getSelectedText(document)) {
      return;
    }

    selectedText = '';
    const word = normalizeHoverWord(extractWordAtPoint(document, event.clientX, event.clientY));
    if (!word || word.length < 2) {
      hoveredWord = '';
      window.clearTimeout(hoverTimer);
      popup.hide();
      return;
    }

    if (word === hoveredWord && popup.isVisible()) {
      popup.position(event.clientX, event.clientY);
      return;
    }

    hoveredWord = word;
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      void translateHoveredWord(word, event.clientX, event.clientY);
    }, settings.hoverDelayMs);
  }

  function handleSelectionMouseUp(event) {
    if (
      !(event.target instanceof Element) ||
      event.target.closest('[data-ubersetzer-popup]')
    ) {
      return;
    }

    window.setTimeout(() => {
      const text = normalizeSelectedText(getSelectedText(document));
      if (!text || text.length < 2 || text === selectedText) {
        return;
      }

      selectedText = text;
      hoveredWord = '';
      window.clearTimeout(hoverTimer);
      void translateSelectedText(text, event.clientX, event.clientY);
    }, 40);
  }

  async function translateHoveredWord(word, x, y) {
    const requestToken = ++activeToken;
    popup.showLoading(word, x, y);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'translate-text',
        payload: {
          text: word,
          targetLanguage: settings.targetLanguage,
          sourceLanguage: settings.sourceLanguage
        }
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? 'Translation request failed.');
      }

      if (requestToken !== activeToken || hoveredWord !== word) {
        return;
      }

      popup.showResult({
        word,
        translation: response.data.translatedText || '(no translation)',
        sourceLanguage: response.data.detectedSourceLanguage,
        x,
        y,
        entry: await recordTranslation({
          sourceText: word,
          translatedText: response.data.translatedText || '(no translation)',
          sourceLanguage: response.data.detectedSourceLanguage,
          targetLanguage: settings.targetLanguage,
          contextType: 'hover'
        })
      });
    } catch (error) {
      if (requestToken !== activeToken) {
        return;
      }

      popup.showResult({
        word,
        translation: 'Translation unavailable',
        sourceLanguage: settings.sourceLanguage,
        x,
        y
      });
      console.warn('[Ubersetzer] Translation failed:', error);
    }
  }

  async function translateSelectedText(text, x, y) {
    const requestToken = ++activeToken;
    popup.showLoading(text, x, y, 'Translating selection');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'translate-text',
        payload: {
          text,
          targetLanguage: settings.targetLanguage,
          sourceLanguage: settings.sourceLanguage
        }
      });

      if (!response?.ok) {
        throw new Error(response?.error ?? 'Translation request failed.');
      }

      if (requestToken !== activeToken || selectedText !== text) {
        return;
      }

      popup.showResult({
        word: text,
        translation: response.data.translatedText || '(no translation)',
        sourceLanguage: response.data.detectedSourceLanguage,
        x,
        y,
        label: 'Selected text',
        entry: await recordTranslation({
          sourceText: text,
          translatedText: response.data.translatedText || '(no translation)',
          sourceLanguage: response.data.detectedSourceLanguage,
          targetLanguage: settings.targetLanguage,
          contextType: 'selection'
        })
      });
    } catch (error) {
      if (requestToken !== activeToken) {
        return;
      }

      popup.showResult({
        word: text,
        translation: 'Translation unavailable',
        sourceLanguage: settings.sourceLanguage,
        x,
        y,
        label: 'Selected text'
      });
      console.warn('[Ubersetzer] Selection translation failed:', error);
    }
  }

  function createPopup() {
    const root = document.createElement('div');
    root.dataset.ubersetzerRoot = 'true';

    const panel = document.createElement('div');
    panel.dataset.ubersetzerPopup = 'true';
    panel.dataset.hidden = 'true';

    const sourceLabel = document.createElement('div');
    sourceLabel.className = 'ub-source';

    const wordLabel = document.createElement('div');
    wordLabel.className = 'ub-word';

    const translationLabel = document.createElement('div');
    translationLabel.className = 'ub-translation';

    const actionRow = document.createElement('div');
    actionRow.className = 'ub-actions';

    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'ub-favorite';
    favoriteButton.type = 'button';
    favoriteButton.textContent = 'Save';
    favoriteButton.disabled = true;

    favoriteButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!currentEntry?.id) {
        return;
      }

      favoriteButton.disabled = true;

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'toggle-notebook-favorite',
          payload: { id: currentEntry.id }
        });

        if (response?.ok && response.entry) {
          currentEntry = response.entry;
          updateFavoriteButton();
        }
      } catch (error) {
        console.warn('[Ubersetzer] Favorite toggle failed:', error);
      } finally {
        favoriteButton.disabled = false;
      }
    });

    actionRow.append(favoriteButton);
    panel.append(sourceLabel, wordLabel, translationLabel, actionRow);
    root.append(panel);

    function updateFavoriteButton() {
      const isFavorite = Boolean(currentEntry?.favorite);
      favoriteButton.textContent = isFavorite ? 'Saved' : 'Save';
      favoriteButton.dataset.favorite = String(isFavorite);
      favoriteButton.disabled = !currentEntry?.id;
    }

    return {
      root,
      hide() {
        panel.dataset.hidden = 'true';
      },
      isVisible() {
        return panel.dataset.hidden !== 'true';
      },
      position(x, y) {
        const padding = 16;
        const nextLeft = Math.min(x + 14, window.innerWidth - panel.offsetWidth - padding);
        const nextTop = Math.min(y + 18, window.innerHeight - panel.offsetHeight - padding);
        panel.style.left = `${Math.max(padding, nextLeft)}px`;
        panel.style.top = `${Math.max(padding, nextTop)}px`;
      },
      showLoading(word, x, y, label = 'Translating') {
        currentEntry = null;
        updateFavoriteButton();
        sourceLabel.textContent = label;
        wordLabel.textContent = word;
        translationLabel.textContent = 'Loading...';
        translationLabel.classList.add('ub-loading');
        panel.dataset.hidden = 'false';
        this.position(x, y);
      },
      showResult({ word, translation, sourceLanguage, x, y, label, entry }) {
        currentEntry = entry ?? null;
        updateFavoriteButton();
        sourceLabel.textContent = label ?? (sourceLanguage ? `Detected: ${sourceLanguage}` : 'Translation');
        wordLabel.textContent = word;
        translationLabel.textContent = translation;
        translationLabel.classList.remove('ub-loading');
        panel.dataset.hidden = 'false';
        this.position(x, y);
      }
    };
  }

  function extractWordAtPoint(documentRef, x, y) {
    const pointedElement = documentRef.elementFromPoint(x, y);
    const presetWord = pointedElement?.dataset?.word?.trim();
    if (presetWord) {
      return presetWord;
    }

    if (
      pointedElement &&
      (pointedElement.closest('input, textarea, [contenteditable="true"]') ||
        pointedElement.closest('[data-ubersetzer-popup]'))
    ) {
      return '';
    }

    const caret = getCaretPosition(documentRef, x, y);
    if (caret?.node?.nodeType === Node.TEXT_NODE) {
      return segmentExtract(caret.node.textContent ?? '', caret.offset).trim();
    }

    return '';
  }

  function normalizeHoverWord(word) {
    return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
  }

  function getSelectedText(documentRef) {
    const selection = documentRef.getSelection?.();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return '';
    }

    return selection.toString();
  }

  function normalizeSelectedText(text) {
    return text.replace(/\s+/g, ' ').trim().slice(0, MAX_SELECTION_LENGTH);
  }

  async function recordTranslation(payload) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'record-translation',
        payload: {
          ...payload,
          pageTitle: document.title,
          pageUrl: window.location.href
        }
      });

      return response?.ok ? response.entry ?? null : null;
    } catch (error) {
      console.warn('[Ubersetzer] Notebook update failed:', error);
      return null;
    }
  }

  function getCaretPosition(documentRef, x, y) {
    if (documentRef.caretPositionFromPoint) {
      const position = documentRef.caretPositionFromPoint(x, y);
      if (position) {
        return {
          node: position.offsetNode,
          offset: position.offset
        };
      }
    }

    if (documentRef.caretRangeFromPoint) {
      const range = documentRef.caretRangeFromPoint(x, y);
      if (range) {
        return {
          node: range.startContainer,
          offset: range.startOffset
        };
      }
    }

    return null;
  }

  function segmentExtract(text, offset) {
    if (!text) {
      return '';
    }

    if (!('Segmenter' in Intl)) {
      return fallbackExtract(text, offset);
    }

    const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
    for (const segment of segmenter.segment(text)) {
      const start = segment.index;
      const end = start + segment.segment.length;
      if (offset >= start && offset <= end) {
        if (segment.isWordLike) {
          return segment.segment.trim();
        }
        break;
      }
    }

    return fallbackExtract(text, offset);
  }

  function fallbackExtract(text, offset) {
    let start = offset;
    let end = offset;

    while (start > 0 && isWordLike(text[start - 1])) {
      start -= 1;
    }

    while (end < text.length && isWordLike(text[end])) {
      end += 1;
    }

    return text.slice(start, end).trim();
  }

  function isWordLike(character) {
    return /[\p{L}\p{N}'’-]/u.test(character);
  }
})();
