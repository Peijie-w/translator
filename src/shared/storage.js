import { DEFAULT_PROVIDER_CONFIG, DEFAULT_SETTINGS } from './defaults.js';

const PROVIDER_CONFIG_STORAGE_KEY = 'translationProviderConfig';

export async function getSettings() {
  const values = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...values };
}

export async function saveSettings(partial) {
  await chrome.storage.sync.set(partial);
}

export async function getProviderConfig() {
  const values = await chrome.storage.local.get({
    [PROVIDER_CONFIG_STORAGE_KEY]: DEFAULT_PROVIDER_CONFIG
  });

  return {
    ...DEFAULT_PROVIDER_CONFIG,
    ...(values[PROVIDER_CONFIG_STORAGE_KEY] ?? {})
  };
}

export async function saveProviderConfig(partial) {
  const current = await getProviderConfig();
  await chrome.storage.local.set({
    [PROVIDER_CONFIG_STORAGE_KEY]: {
      ...current,
      ...partial
    }
  });
}
