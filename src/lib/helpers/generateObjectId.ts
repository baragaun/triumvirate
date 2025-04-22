import { encodeBase32LowerCase } from '@oslojs/encoding'

export const generateObjectId = (): string => {
  // ID with 120 bits of entropy, or about the same as UUID v4.
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return encodeBase32LowerCase(bytes);
};

