export const validateEmail = (email: unknown): boolean => {
  return (
    typeof email === 'string' &&
    email.length >= 6 &&
    email.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
};
