const {
    createSession,
    getCredentials,
    secureEqual,
    setSessionCookie
} = require('../../lib/auth');

module.exports = function handler(request, response) {
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const credentials = getCredentials();
        let body = request.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                return response.status(400).json({ error: 'Format permintaan login tidak valid.' });
            }
        }
        const username = typeof body?.username === 'string' ? body.username : '';
        const password = typeof body?.password === 'string' ? body.password : '';

        if (!secureEqual(username, credentials.username) ||
            !secureEqual(password, credentials.password)) {
            return response.status(401).json({ error: 'Username atau password salah.' });
        }

        setSessionCookie(response, createSession(username));
        response.setHeader('Cache-Control', 'no-store');
        return response.status(200).json({ authenticated: true });
    } catch (error) {
        console.error('Login configuration or request error:', error);
        return response.status(500).json({
            error: 'Login belum dikonfigurasi dengan benar di Vercel.'
        });
    }
};
