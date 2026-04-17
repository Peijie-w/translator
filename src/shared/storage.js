import { DEFAULT_SETTINGS } from './defaults.js';

export async function getSettings() {
  const values = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...values };
}

export async function saveSettings(partial) {
  await chrome.storage.sync.set(partial);
}
