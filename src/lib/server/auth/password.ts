import { hash, verify } from '@node-rs/argon2';

// Argon2 configuration parameters
const ARGON2_CONFIG = {
  memoryCost: 19456, // 19MB
  timeCost: 2,       // 2 iterations
  outputLen: 32,     // 32 bytes output
  parallelism: 1     // 1 thread
};

/**
 * Hashes a password using Argon2
 * 
 * @param password The plain text password to hash
 * @returns A promise that resolves to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_CONFIG);
}

/**
 * Verifies a password against a hash
 * 
 * @param hashedPassword The stored hashed password
 * @param plainPassword The plain text password to verify
 * @returns A promise that resolves to true if the password matches, false otherwise
 */
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  return verify(hashedPassword, plainPassword, ARGON2_CONFIG);
}
