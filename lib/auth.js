const crypto = require('crypto');

const COOKIE_NAME = 'hargaadmin_session';
const SESSION_SECONDS = 8 * 60 * 60;

function requiredEnvironment(name, minimumLength = 1) {
    const value = process.env[name];
    if (!value || value.length < minimumLength) {
        throw new Error(`${name} must be configured with at least ${minimumLength} characters`);
    }
    return value;
}

function getCredentials() {
    return {
        username: requiredEnvironment('ADMIN_USERNAME'),
        password: requiredEnvironment('ADMIN_PASSWORD', 12)
    };
}

function secureEqual(left, right) {
    const leftDigest = crypto.createHash('sha256').update(left).digest();
    const rightDigest = crypto.createHash('sha256').update(right).digest();
    return crypto.timingSafeEqual(leftDigest, rightDigest) && left.length === right.length;
}

function sign(value) {
    const secret = requiredEnvironment('SESSION_SECRET', 32);
    return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createSession(username) {
    const payload = Buffer.from(JSON.stringify({
        username,
        expiresAt: Math.floor(Date.now() / 1000) + SESSION_SECONDS
    })).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

function getCookie(request, name) {
    const cookies = request.headers.cookie || '';
    const entry = cookies.split(';').map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

function isAuthenticated(request) {
    const token = getCookie(request, COOKIE_NAME);
    const separator = token.lastIndexOf('.');
    if (separator < 1) return false;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!secureEqual(signature, sign(payload))) return false;

    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return typeof session.username === 'string' &&
            Number.isInteger(session.expiresAt) &&
            session.expiresAt > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

function setSessionCookie(response, token) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`
    );
}

function clearSessionCookie(response) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader(
        'Set-Cookie',
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
    );
}

module.exports = {
    COOKIE_NAME,
    clearSessionCookie,
    createSession,
    getCredentials,
    isAuthenticated,
    secureEqual,
    setSessionCookie
};
