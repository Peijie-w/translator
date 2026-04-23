const STORAGE_KEY = 'translationNotebook';
const MAX_REGULAR_ENTRIES = 250;

function createEmptyNotebook() {
  return { entries: [] };
}

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function buildEntryKey({ sourceText, translatedText, targetLanguage }) {
  return [
    normalizeText(sourceText).toLowerCase(),
    normalizeText(translatedText).toLowerCase(),
    String(targetLanguage ?? '').toLowerCase()
  ].join('::');
}

function createEntryId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    return new Date(right.lastSeenAt).valueOf() - new Date(left.lastSeenAt).valueOf();
  });
}

function trimNotebook(entries) {
  const sorted = sortEntries(entries);
  const favorites = sorted.filter((entry) => entry.favorite);
  const regular = sorted.filter((entry) => !entry.favorite).slice(0, MAX_REGULAR_ENTRIES);
  return [...favorites, ...regular];
}

function normalizeEntry(input) {
  const sourceText = normalizeText(input.sourceText);
  const translatedText = normalizeText(input.translatedText);
  const contextType = input.contextType === 'selection' ? 'selection' : 'hover';

  return {
    id: input.id ?? createEntryId(),
    key: input.key ?? buildEntryKey({ sourceText, translatedText, targetLanguage: input.targetLanguage }),
    sourceText,
    translatedText,
    sourceLanguage: input.sourceLanguage ?? 'auto',
    targetLanguage: input.targetLanguage ?? 'zh-CN',
    pageTitle: normalizeText(input.pageTitle),
    pageUrl: String(input.pageUrl ?? ''),
    favorite: Boolean(input.favorite),
    createdAt: input.createdAt ?? new Date().toISOString(),
    lastSeenAt: input.lastSeenAt ?? new Date().toISOString(),
    favoriteAt: input.favorite ? input.favoriteAt ?? new Date().toISOString() : null,
    lookupCount: Number(input.lookupCount ?? 1),
    contextTypes: Array.isArray(input.contextTypes) ? [...new Set(input.contextTypes)] : [contextType]
  };
}

async function saveNotebook(notebook) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      entries: trimNotebook(notebook.entries)
    }
  });
}

export async function getNotebook() {
  const values = await chrome.storage.local.get({
    [STORAGE_KEY]: createEmptyNotebook()
  });

  const notebook = values[STORAGE_KEY] ?? createEmptyNotebook();
  return {
    entries: sortEntries((notebook.entries ?? []).map((entry) => normalizeEntry(entry)))
  };
}

export async function getNotebookStats() {
  const notebook = await getNotebook();
  const favoriteCount = notebook.entries.filter((entry) => entry.favorite).length;

  return {
    totalCount: notebook.entries.length,
    favoriteCount,
    historyCount: notebook.entries.length - favoriteCount
  };
}

export async function upsertNotebookEntry(input) {
  const notebook = await getNotebook();
  const nextEntry = normalizeEntry(input);
  const existingIndex = notebook.entries.findIndex((entry) => entry.key === nextEntry.key);

  if (existingIndex >= 0) {
    const existing = notebook.entries[existingIndex];
    const merged = normalizeEntry({
      ...existing,
      ...nextEntry,
      id: existing.id,
      favorite: existing.favorite,
      favoriteAt: existing.favoriteAt,
      createdAt: existing.createdAt,
      lastSeenAt: new Date().toISOString(),
      lookupCount: Number(existing.lookupCount ?? 1) + 1,
      contextTypes: [...new Set([...(existing.contextTypes ?? []), ...(nextEntry.contextTypes ?? [])])]
    });

    notebook.entries.splice(existingIndex, 1);
    notebook.entries.unshift(merged);
    await saveNotebook(notebook);
    return merged;
  }

  notebook.entries.unshift(nextEntry);
  await saveNotebook(notebook);
  return nextEntry;
}

export async function setNotebookFavorite(id, favorite) {
  const notebook = await getNotebook();
  const index = notebook.entries.findIndex((entry) => entry.id === id);
  if (index < 0) {
    return null;
  }

  const entry = notebook.entries[index];
  const nextFavorite = typeof favorite === 'boolean' ? favorite : !entry.favorite;
  notebook.entries[index] = normalizeEntry({
    ...entry,
    favorite: nextFavorite,
    favoriteAt: nextFavorite ? new Date().toISOString() : null,
    lastSeenAt: new Date().toISOString()
  });

  await saveNotebook(notebook);
  return notebook.entries[index];
}

export async function removeNotebookEntry(id) {
  const notebook = await getNotebook();
  const nextEntries = notebook.entries.filter((entry) => entry.id !== id);
  await saveNotebook({ entries: nextEntries });
}

export async function clearNotebookHistory() {
  const notebook = await getNotebook();
  await saveNotebook({
    entries: notebook.entries.filter((entry) => entry.favorite)
  });
}
