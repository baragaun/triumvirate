export const validatePassword = (password: unknown): boolean => {
  return (
    typeof password === 'string' &&
    password.length >= 6 &&
    password.length <= 255
  );
};
