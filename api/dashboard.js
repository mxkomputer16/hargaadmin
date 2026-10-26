const fs = require('fs');
const path = require('path');
const { isAuthenticated } = require('../lib/auth');

module.exports = function handler(request, response) {
    try {
        response.setHeader('Cache-Control', 'private, no-store');
        if (!isAuthenticated(request)) {
            response.setHeader('Location', '/');
            return response.status(302).end();
        }

        const dashboardPath = path.join(process.cwd(), 'dataadmin', 'index.html');
        const html = fs.readFileSync(dashboardPath, 'utf8');
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        return response.status(200).send(html);
    } catch (error) {
        console.error('Failed to serve admin dashboard:', error);
        return response.status(500).send('Dashboard tidak dapat dimuat.');
    }
};
