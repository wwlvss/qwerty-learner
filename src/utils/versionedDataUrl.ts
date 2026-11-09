// A new build must not reuse cached data files from the previous release.
export function versionedDataUrl(url: string) {
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(LATEST_COMMIT_HASH.split(' ')[0])}`
}
