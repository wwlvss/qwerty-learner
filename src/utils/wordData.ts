// Existing dictionaries contain both arrays and single-string translations.
export function normalizeTranslations(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string') return value.trim() ? [value] : []
  return []
}
