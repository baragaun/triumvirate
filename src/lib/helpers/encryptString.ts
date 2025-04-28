export const encryptString = async (
  plaintext: string,
  base64Key: string = '1vDpSg3PDbZ6eeSFYZhzcqQEvrTaunoVZz6fUsBWu+k=',
): Promise<string> => {
  const enc = new TextEncoder();
  const keyBuffer = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV size
  const encodedPlaintext = enc.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encodedPlaintext
  );

  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
};
