// Allows letters (including accented), spaces, apostrophes, and hyphens
export const validatePersonName = (name: unknown): boolean => {
  return (
    typeof name === 'string' &&
    name.length >= 2 &&
    name.length <= 100 &&
    /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(name)
  );
};
