const { isAuthenticated } = require('../lib/auth');
const { getSheetRows } = require('../lib/google-sheets');

function formatRupiah(value) {
    const stringValue = String(value || '').trim();
    const clean = stringValue.replace(/^Rp\s*/i, '').replace(/[.,]/g, '');
    return clean !== '' && Number.isFinite(Number(clean))
        ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(clean))}`
        : stringValue || 'Rp 0';
}

module.exports = async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        response.setHeader('Cache-Control', 'private, no-store');
        if (!isAuthenticated(request)) {
            return response.status(401).json({ error: 'Silakan login untuk mengakses data.' });
        }

        const rows = await getSheetRows();
        let tanggalUpdate = 'As of 20 Sep 2026';
        const items = [];

        for (const [index, row] of rows.entries()) {
            if (index === 0 && row[0]) tanggalUpdate = row[0];
            if (index < 4) continue;

            const kode = String(row[1] || '').trim();
            if (!kode || kode === 'Item No.') continue;

            const kuantitasRaw = String(row[5] || '0').trim();
            const normalizedQuantity = kuantitasRaw.replace(/[.,]/g, '');
            const kuantitas = Number.isFinite(Number(normalizedQuantity))
                ? Math.trunc(Number(normalizedQuantity))
                : 0;

            items.push({
                no: items.length + 1,
                kode,
                deskripsi: String(row[3] || '').trim(),
                kuantitas,
                hpp: formatRupiah(row[7]),
                last: formatRupiah(row[9]),
                harga_jual: formatRupiah(row[11]),
                status: kuantitas > 0 ? 'Ready' : 'Kosong',
                raw_data: row
            });
        }

        return response.status(200).json({ tanggal_update: tanggalUpdate, items });
    } catch (error) {
        console.error('Failed to load protected Google Sheets data:', error);
        const status = error.message && (
            error.message.includes('SESSION_SECRET') ||
            error.message.includes('GOOGLE_SERVICE_ACCOUNT_JSON') ||
            error.message.includes('service account credentials')
        ) ? 500 : 502;
        return response.status(status).json({
            error: status === 500
                ? 'Konfigurasi login atau akses Google Sheets belum lengkap di Vercel.'
                : 'Gagal mengambil data admin dari Google Sheets.'
        });
    }
};
