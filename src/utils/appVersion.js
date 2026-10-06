const versionParts = (version) => String(version || '')
  .split('.')
  .slice(0, 4)
  .map(part => Number.parseInt(part, 10) || 0);

export const OFFICIAL_STORE_URLS = Object.freeze({
  android: 'https://play.google.com/store/apps/details?id=com.scobys.scoooobys',
  ios: 'https://apps.apple.com/in/app/scoobyz/id6791553594',
});

export const compareAppVersions = (left, right) => {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
};

export const isTrustedStoreUrl = (platform, value) => {
  const officialUrl = OFFICIAL_STORE_URLS[platform];
  if (!officialUrl) return false;
  return String(value || '').trim().toLowerCase() === officialUrl.toLowerCase();
};
