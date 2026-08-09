import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

export const isWordPressBcryptHash = (hashedPassword: string): boolean => {
  return hashedPassword.startsWith('$wp$2y$') || hashedPassword.startsWith('$wp$2b$');
};

export const wordpressPasswordInput = (password: string): string => {
  // WordPress 6.8+: base64_encode(hash_hmac('sha384', trim($password), 'wp-sha384', true))
  return crypto.createHmac('sha384', 'wp-sha384').update(password.trim(), 'utf8').digest('base64');
};

const normalizeBcryptPrefix = (hash: string): string => {
  return hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
};

export const compareWordPressPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!isWordPressBcryptHash(hashedPassword)) return false;
  const bcryptHash = normalizeBcryptPrefix(hashedPassword.slice(3));
  // WordPress hashes with trim(); some check paths historically omitted trim — try both.
  if (await bcrypt.compare(wordpressPasswordInput(password), bcryptHash)) return true;
  if (password !== password.trim()) {
    const untrimmed = crypto.createHmac('sha384', 'wp-sha384').update(password, 'utf8').digest('base64');
    if (await bcrypt.compare(untrimmed, bcryptHash)) return true;
  }
  return false;
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<{ valid: boolean; needsRehash: boolean }> => {
  if (isWordPressBcryptHash(hashedPassword)) {
    const valid = await compareWordPressPassword(password, hashedPassword);
    return { valid, needsRehash: valid };
  }

  const valid = await bcrypt.compare(password, hashedPassword);
  return { valid, needsRehash: false };
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const result = await verifyPassword(password, hashedPassword);
  return result.valid;
};