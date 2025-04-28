import { createDecipheriv } from 'crypto';

export const decryptString = (
  encryptedBase64: string,
  base64Key: string = '1vDpSg3PDbZ6eeSFYZhzcqQEvrTaunoVZz6fUsBWu+k=',
): string => {
  const combined = Buffer.from(encryptedBase64, 'base64');
  const key = Buffer.from(base64Key, 'base64');

  const iv = combined.subarray(0, 12);
  const ciphertextWithAuthTag = combined.subarray(12);

  const authTag = ciphertextWithAuthTag.subarray(ciphertextWithAuthTag.length - 16);
  const ciphertext = ciphertextWithAuthTag.subarray(0, ciphertextWithAuthTag.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
};
