const crypto = require('crypto');

const SHEET_ID = '17qApH3_XO1Mx3sn1N1uqXz-mBu4KT5SqDzyIXJ3HZvQ';
const SHEET_GID = 1103841187;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
let cachedToken;

function base64Url(value) {
    return Buffer.from(value).toString('base64url');
}

function getServiceAccount() {
    const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!rawCredentials) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
    }

    let account;
    try {
        account = JSON.parse(rawCredentials);
    } catch {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    if (!account.client_email || !account.private_key) {
        throw new Error('Google service account credentials are incomplete');
    }
    return account;
}

async function getAccessToken(account) {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
        return cachedToken.value;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = base64Url(JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600
    }));
    const unsignedToken = `${header}.${claims}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedToken);
    signer.end();
    const assertion = `${unsignedToken}.${signer.sign(
        account.private_key.replace(/\\n/g, '\n'),
        'base64url'
    )}`;

    const tokenResponse = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion
        })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
        throw new Error(`Google OAuth token request failed with HTTP ${tokenResponse.status}`);
    }

    cachedToken = {
        value: tokenData.access_token,
        expiresAt: Date.now() + Number(tokenData.expires_in || 3600) * 1000
    };
    return cachedToken.value;
}

async function googleApiGet(url, accessToken) {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Google Sheets API returned HTTP ${response.status}`);
    }
    return data;
}

async function getSheetRows() {
    const account = getServiceAccount();
    const accessToken = await getAccessToken(account);
    const spreadsheet = await googleApiGet(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets(properties(sheetId,title))`,
        accessToken
    );
    const sheet = (spreadsheet.sheets || []).find(
        entry => entry.properties && entry.properties.sheetId === SHEET_GID
    );
    if (!sheet) {
        throw new Error(`Google Sheet tab ${SHEET_GID} was not found`);
    }

    const range = encodeURIComponent(`'${sheet.properties.title.replace(/'/g, "''")}'!A:L`);
    const values = await googleApiGet(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueRenderOption=FORMATTED_VALUE`,
        accessToken
    );
    return values.values || [];
}

module.exports = { getSheetRows };
