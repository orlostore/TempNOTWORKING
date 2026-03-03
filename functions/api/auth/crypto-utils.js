// Shared crypto utilities for auth endpoints
// Eliminates duplication across login, signup, password, reset, verify, guest-to-account

// Constant-time string comparison (prevents timing attacks)
export function safeCompareHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
}

// Legacy SHA-256 hash (for migration from old passwords)
export async function hashPasswordLegacy(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2 password hashing (strong, Cloudflare Workers compatible)
export async function hashPasswordPBKDF2(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        256
    );
    const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

// Verify a password against a stored PBKDF2 hash
export async function verifyPasswordPBKDF2(password, storedHash) {
    const parts = storedHash.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = parseInt(parts[1]);
    const salt = new Uint8Array(parts[2].match(/.{2}/g).map(b => parseInt(b, 16)));
    const expectedHash = parts[3];
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
        keyMaterial,
        256
    );
    const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    return safeCompareHex(hashHex, expectedHash);
}

// Generate random 32-byte hex token
export function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Cryptographically secure temp password
export function generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const randomBytes = crypto.getRandomValues(new Uint8Array(12));
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(randomBytes[i] % chars.length);
    }
    return password;
}
