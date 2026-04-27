export const TRANSLATION_PROVIDER_OPTIONS = [
  {
    value: 'google-web',
    label: 'Google Web (Prototype)',
    description: 'Fast prototype mode based on the current unofficial web endpoint.'
  },
  {
    value: 'libretranslate',
    label: 'LibreTranslate',
    description: 'Use a self-hosted or third-party LibreTranslate-compatible API.'
  }
];

export function getTranslationProviderMeta(value) {
  return (
    TRANSLATION_PROVIDER_OPTIONS.find((option) => option.value === value) ??
    TRANSLATION_PROVIDER_OPTIONS[0]
  );
}
