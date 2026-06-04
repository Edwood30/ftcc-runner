export function buildAssetUrl(assetBaseUrl: string, assetPath: string): string {
  const trimmedPath = assetPath.trim();
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const base = assetBaseUrl.replace(/\/+$/, "");
  const normalized = trimmedPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^(images|files)\//, "assets/$1/");

  return encodeURI(`${base}/${normalized}`);
}
