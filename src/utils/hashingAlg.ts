export const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
};

/**
 * Gets a simple hash for a string and returns a corresponding integer
 * to distribute the hashed value within the given number of buckets.
 * @param str the string to be hashed and distributed 
 * @param numberOfBuckets the number of buckets over which to distribute hashes
 * @returns integer between 0 and the number of buckets representing the resulting bucket
 */
export const distributeHashToBuckets = (str: string, numberOfBuckets: number) => {
  const hash = getHash(str);
  const positiveHash = hash < 0 ? -hash : hash;
  return positiveHash % numberOfBuckets;
};
