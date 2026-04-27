function normalizeText(text) {
  return String(text ?? '').trim();
}

function getLibreTranslateEndpoint(endpoint) {
  const normalized = String(endpoint ?? '').trim();
  if (!normalized) {
    throw new Error('LibreTranslate endpoint is empty.');
  }

  const url = new URL(normalized);
  if (url.pathname === '/' || url.pathname === '') {
    url.pathname = '/translate';
  }

  return url;
}

async function translateWithGoogleWeb({ text, targetLanguage, sourceLanguage = 'auto' }) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', sourceLanguage);
  url.searchParams.set('tl', targetLanguage);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status}`);
  }

  const body = await response.json();
  const translatedText = Array.isArray(body?.[0])
    ? body[0].map((item) => item?.[0] ?? '').join('')
    : '';

  return {
    translatedText: translatedText.trim(),
    detectedSourceLanguage: body?.[2] ?? sourceLanguage
  };
}

async function translateWithLibreTranslate({
  text,
  targetLanguage,
  sourceLanguage = 'auto',
  providerConfig
}) {
  const endpoint = getLibreTranslateEndpoint(providerConfig.libreTranslateEndpoint);
  const payload = {
    q: text,
    source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
    target: targetLanguage,
    format: 'text'
  };

  if (providerConfig.libreTranslateApiKey) {
    payload.api_key = providerConfig.libreTranslateApiKey;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate request failed: ${response.status}`);
  }

  const body = await response.json();
  const detectedSourceLanguage =
    body?.detectedLanguage?.language ??
    body?.detectedLanguage ??
    body?.detected_language ??
    sourceLanguage;

  return {
    translatedText: normalizeText(body?.translatedText),
    detectedSourceLanguage
  };
}

export async function translateWithProvider({
  text,
  targetLanguage,
  sourceLanguage = 'auto',
  provider,
  providerConfig
}) {
  const trimmed = normalizeText(text);
  if (!trimmed) {
    throw new Error('No text provided.');
  }

  switch (provider) {
    case 'libretranslate':
      return translateWithLibreTranslate({
        text: trimmed,
        targetLanguage,
        sourceLanguage,
        providerConfig
      });
    case 'google-web':
    default:
      return translateWithGoogleWeb({
        text: trimmed,
        targetLanguage,
        sourceLanguage
      });
  }
}
