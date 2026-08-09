import bcrypt from 'bcrypt';
import crypto from 'crypto';
export const hashPassword = async (password, saltRounds = 10) => {
    return await bcrypt.hash(password, saltRounds);
};
export const isWordPressBcryptHash = (hashedPassword) => {
    return hashedPassword.startsWith('$wp$2y$') || hashedPassword.startsWith('$wp$2b$');
};
export const wordpressPasswordInput = (password) => {
    return crypto.createHmac('sha384', 'wp-sha384').update(password, 'utf8').digest('base64');
};
const normalizeBcryptPrefix = (hash) => {
    return hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
};
export const compareWordPressPassword = async (password, hashedPassword) => {
    if (!isWordPressBcryptHash(hashedPassword))
        return false;
    const bcryptHash = normalizeBcryptPrefix(hashedPassword.slice(3));
    return bcrypt.compare(wordpressPasswordInput(password), bcryptHash);
};
export const verifyPassword = async (password, hashedPassword) => {
    if (isWordPressBcryptHash(hashedPassword)) {
        const valid = await compareWordPressPassword(password, hashedPassword);
        return { valid, needsRehash: valid };
    }
    const valid = await bcrypt.compare(password, hashedPassword);
    return { valid, needsRehash: false };
};
export const comparePassword = async (password, hashedPassword) => {
    const result = await verifyPassword(password, hashedPassword);
    return result.valid;
};
//# sourceMappingURL=hash.js.map