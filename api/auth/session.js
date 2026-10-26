const { isAuthenticated } = require('../../lib/auth');

module.exports = function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        response.setHeader('Cache-Control', 'no-store');
        if (!isAuthenticated(request)) {
            return response.status(401).json({ authenticated: false });
        }
        return response.status(200).json({ authenticated: true });
    } catch (error) {
        console.error('Session configuration error:', error);
        return response.status(500).json({
            error: 'Login belum dikonfigurasi dengan benar di Vercel.'
        });
    }
};
