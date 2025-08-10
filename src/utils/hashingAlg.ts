export const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
};

export const distributeHashToBuckets = (str: string, numberOfBuckets: number) => {
  const hash = getHash(str);
  const positiveHash = hash < 0 ? -hash : hash;
  return positiveHash % numberOfBuckets;
};
