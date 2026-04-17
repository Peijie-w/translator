function isWordLike(character) {
  return /[\p{L}\p{N}'’-]/u.test(character);
}

function fallbackExtract(text, offset) {
  if (!text) {
    return '';
  }

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

function segmentExtract(text, offset) {
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

export function extractWordAtPoint(documentRef, x, y) {
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

export function normalizeHoverWord(word) {
  return word
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .trim();
}
