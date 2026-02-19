// Cloudflare Pages Function - Customer Login API
// Location: /functions/api/auth/login.js

const TOKEN_MAX_AGE_DAYS = 30;

export async function onRequestPost(context) {
    const { env, request } = context;
    const DB = env.DB;

    try {
        const { email, password } = await request.json();

        // Validation
        if (!email || !password) {
            return Response.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Rate limiting: max 5 attempts per email per 15 minutes
        try {
            await DB.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
                email TEXT, attempted_at TEXT DEFAULT (datetime('now'))
            )`).run();

            // Clean old attempts (older than 15 min)
            await DB.prepare(`DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-15 minutes')`).run();

            const attempts = await DB.prepare(
                `SELECT COUNT(*) as cnt FROM login_attempts WHERE email = ?`
            ).bind(email.toLowerCase()).first();

            if (attempts && attempts.cnt >= 5) {
                return Response.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 });
            }

            // Record this attempt
            await DB.prepare('INSERT INTO login_attempts (email) VALUES (?)').bind(email.toLowerCase()).run();
        } catch (e) {
            // Don't block login if rate limit table fails
            console.error('Rate limit check error:', e);
        }

        // Find customer
        const customer = await DB.prepare(`
            SELECT id, email, password_hash, name, phone, token, hash_version
            FROM customers
            WHERE email = ?
        `).bind(email.toLowerCase()).first();

        if (!customer) {
            return Response.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Verify password — support both old SHA-256 and new PBKDF2
        let passwordValid = false;
        if (customer.hash_version === 2) {
            passwordValid = await verifyPasswordPBKDF2(password, customer.password_hash);
        } else {
            // Legacy SHA-256 check
            const legacyHash = await hashPasswordLegacy(password);
            passwordValid = (legacyHash === customer.password_hash);

            // Auto-upgrade to PBKDF2 on successful login
            if (passwordValid) {
                const newHash = await hashPasswordPBKDF2(password);
                await DB.prepare('UPDATE customers SET password_hash = ?, hash_version = 2 WHERE id = ?')
                    .bind(newHash, customer.id).run();
            }
        }

        if (!passwordValid) {
            return Response.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Clear rate limit attempts on successful login
        try { await DB.prepare('DELETE FROM login_attempts WHERE email = ?').bind(email.toLowerCase()).run(); } catch(e) {}

        // Always generate a fresh token on login (with timestamp for expiry)
        const token = generateToken();
        await DB.prepare('UPDATE customers SET token = ?, token_created_at = datetime(\'now\') WHERE id = ?')
            .bind(token, customer.id)
            .run();

        return Response.json({
            success: true,
            token: token,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return Response.json({ error: 'Login failed' }, { status: 500 });
    }
}

// Legacy SHA-256 hash (for migration from old passwords)
async function hashPasswordLegacy(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ORLO_SALT_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// PBKDF2 password hashing (strong, Cloudflare Workers compatible)
async function hashPasswordPBKDF2(password) {
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

async function verifyPasswordPBKDF2(password, storedHash) {
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
    return hashHex === expectedHash;
}

// Generate random token
function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
