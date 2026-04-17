export async function requestTranslation({ text, targetLanguage, sourceLanguage = 'auto' }) {
  const response = await chrome.runtime.sendMessage({
    type: 'translate-text',
    payload: {
      text,
      targetLanguage,
      sourceLanguage
    }
  });

  if (!response?.ok) {
    throw new Error(response?.error ?? 'Translation request failed.');
  }

  return response.data;
}
