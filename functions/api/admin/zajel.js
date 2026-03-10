// Zajel API Helper — shared by admin endpoints
// NOT an endpoint (no onRequest* exports)
// Usage: import { zajelApi, createShipmentPayload, CITY_MAP } from './zajel.js';

// Map emirates/cities to Zajel city codes
export const CITY_MAP = {
    // English
    'dubai': 'DXB',
    'dxb': 'DXB',
    'sharjah': 'SHJ',
    'shj': 'SHJ',
    'abu dhabi': 'AUH',
    'abudhabi': 'AUH',
    'auh': 'AUH',
    'ajman': 'AJM',
    'ajm': 'AJM',
    'fujairah': 'FUJ',
    'fuj': 'FUJ',
    'ras al khaimah': 'RAK',
    'ras alkhaimah': 'RAK',
    'rak': 'RAK',
    'umm al quwain': 'UAQ',
    'uaq': 'UAQ',
    'al ain': 'AIN',
    'ain': 'AIN',
    // Arabic
    'دبي': 'DXB',
    'الشارقة': 'SHJ',
    'شارقة': 'SHJ',
    'أبوظبي': 'AUH',
    'أبو ظبي': 'AUH',
    'ابوظبي': 'AUH',
    'عجمان': 'AJM',
    'الفجيرة': 'FUJ',
    'فجيرة': 'FUJ',
    'رأس الخيمة': 'RAK',
    'راس الخيمة': 'RAK',
    'أم القيوين': 'UAQ',
    'ام القيوين': 'UAQ',
    'العين': 'AIN',
    // Common Stripe address variants
    'إمارة دبي': 'DXB',
    'إما': 'DXB',
    'emirate of dubai': 'DXB',
    'dubai emirate': 'DXB',
};

export function resolveCity(cityInput) {
    if (!cityInput) return 'DXB';
    const key = cityInput.toLowerCase().trim();
    if (CITY_MAP[key]) return CITY_MAP[key];
    // Check if input contains a known city name (e.g. "Dubai Land" contains "dubai")
    for (const [mapKey, code] of Object.entries(CITY_MAP)) {
        if (key.includes(mapKey) || mapKey.includes(key)) return code;
    }
    // If it's not ASCII (e.g. Arabic), default to DXB rather than garbage
    if (/[^\x00-\x7F]/.test(cityInput)) return 'DXB';
    // For short ASCII codes like "DXB", "SHJ" — pass through
    const upper = cityInput.toUpperCase().trim();
    if (/^[A-Z]{3}$/.test(upper)) return upper;
    return 'DXB';
}

/**
 * Make a request to the Zajel API
 */
export async function zajelApi(env, { method = 'GET', endpoint, body, params }) {
    const baseUrl = env.ZAJEL_API_BASE_URL;
    const apiKey = env.ZAJEL_API_KEY;

    if (!apiKey || !baseUrl) {
        throw new Error('ZAJEL_API_KEY and ZAJEL_API_BASE_URL must be set in Cloudflare env vars');
    }

    let url = `${baseUrl}${endpoint}`;
    if (params) {
        const qs = new URLSearchParams(params).toString();
        url += `?${qs}`;
    }

    const headers = {
        'X-Auth-Api-Key': apiKey,
        'accept': '*/*',
    };

    const options = { method, headers };

    if (body && (method === 'POST' || method === 'PUT')) {
        headers['Content-Type'] = 'application/json';
        const jsonBody = JSON.stringify(body);
        options.body = jsonBody;
        console.log('Zajel request payload:', jsonBody);
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        throw new Error('Zajel API: Unauthorized (check ZAJEL_API_KEY and ZAJEL_CUSTOMER_CODE)');
    }
    if (response.status === 403) {
        throw new Error('Zajel API: Forbidden (access not granted for this endpoint)');
    }

    const contentType = response.headers.get('content-type') || '';

    // GetShipmentLabel returns binary (PDF), not JSON
    if (endpoint.includes('GetShipmentLabel')) {
        if (!response.ok) {
            throw new Error(`Zajel API error: ${response.status}`);
        }
        return { ok: true, status: response.status, response };
    }

    let data;
    if (contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }

    return { ok: response.ok, status: response.status, data };
}

/**
 * Build the CreateShipment request body from order data
 */
export function createShipmentPayload(env, {
    customerReference,
    customerName,
    customerPhone,
    customerEmail,
    addressLine1,
    addressLine2,
    destinationCity,
    destinationArea,
    description,
    weight = 0.5,
    numPieces = 1,
    codAmount = 0,
}) {
    const customerCode = env.ZAJEL_CUSTOMER_CODE;
    const serviceType = env.ZAJEL_SERVICE_TYPE;

    if (!customerCode || !serviceType) {
        throw new Error('ZAJEL_CUSTOMER_CODE and ZAJEL_SERVICE_TYPE must be set in Cloudflare env vars');
    }

    // Normalize phone to 971 format
    let phone = (customerPhone || '').replace(/\s+/g, '').replace(/^\+/, '');
    if (phone.startsWith('0')) phone = '971' + phone.slice(1);
    if (!phone.startsWith('971') && phone.length <= 10) phone = '971' + phone;

    return {
        customer_reference_number: customerReference || '',
        weight_in_kg: String(weight || '0.5000'),
        customer_code: customerCode,
        service_type_id: serviceType,
        product_type: 'NON-DOCUMENT',
        description: (description || 'ORLO Store Order').slice(0, 150),
        length_in_cm: '1.0000',
        width_in_cm: '1.0000',
        height_in_cm: '1.0000',
        num_of_pieces: String(numPieces || 1),
        cod_amount: String(codAmount || 0),
        origin: {
            name: env.ZAJEL_ORIGIN_NAME || 'ORLO Store',
            phone: env.ZAJEL_ORIGIN_PHONE,
            company_name: env.ZAJEL_ORIGIN_COMPANY,
            address_line_1: env.ZAJEL_ORIGIN_ADDRESS1 || 'Dubai',
            address_line_2: env.ZAJEL_ORIGIN_ADDRESS2 || '',
            area: env.ZAJEL_ORIGIN_AREA || '',
            city: env.ZAJEL_ORIGIN_CITY || 'DXB',
            country: 'UAE',
            email: env.ZAJEL_ORIGIN_EMAIL,
            latitude: '',
            longitude: '',
        },
        destination: {
            name: customerName || '',
            phone: phone,
            companyName: '',
            address_line_1: addressLine1 || '',
            address_line_2: addressLine2 || '',
            area: destinationArea || '',
            city: resolveCity(destinationCity),
            country: 'UAE',
            email: customerEmail || '',
            latitude: '',
            longitude: '',
        },
    };
}

/**
 * Ensure the shipments table exists (auto-migration)
 */
export async function ensureShipmentsTable(DB) {
    if (!DB) return;
    try {
        await DB.prepare(`
            CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL UNIQUE,
                zajel_reference TEXT,
                customer_reference TEXT,
                status TEXT DEFAULT 'pending',
                zajel_status TEXT,
                zajel_status_date TEXT,
                customer_name TEXT,
                customer_email TEXT,
                customer_phone TEXT,
                destination_city TEXT,
                destination_address TEXT,
                weight_kg REAL DEFAULT 0.5,
                num_pieces INTEGER DEFAULT 1,
                cod_amount REAL DEFAULT 0,
                label_url TEXT,
                failure_reason TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await DB.prepare(`
            CREATE TABLE IF NOT EXISTS shipment_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shipment_id INTEGER NOT NULL,
                zajel_reference TEXT,
                status TEXT NOT NULL,
                description TEXT,
                event_date TEXT,
                received_by TEXT,
                delivery_courier TEXT,
                failure_reason TEXT,
                raw_payload TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
            )
        `).run();
    } catch (e) {
        console.error('ensureShipmentsTable error:', e);
    }
}
