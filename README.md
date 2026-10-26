# Harga Admin

## Deploy ke GitHub dan Vercel

1. Buat repository GitHub khusus untuk folder `hargaadmin`, lalu push isi folder ini. Jangan mengunggah seluruh `C:\xampp\htdocs`.
2. Di Vercel pilih **Add New → Project** dan import repository tersebut. Biarkan Root Directory di `/`; tidak perlu memilih framework atau mengisi Build Command.
3. Buka **Project Settings → Environment Variables**, lalu tambahkan:
   - `ADMIN_USERNAME`: username admin baru.
   - `ADMIN_PASSWORD`: password admin baru yang kuat (minimal 12 karakter).
   - `SESSION_SECRET`: rahasia acak baru, minimal 32 karakter.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: seluruh isi file JSON key service account Google.
4. Di Google Cloud, aktifkan **Google Sheets API**, buat service account dan key JSON, lalu bagikan spreadsheet ke alamat email service account sebagai **Viewer**. Jangan publikasikan spreadsheet ke web.
5. Terapkan Environment Variables untuk Production (dan Preview bila diperlukan), simpan, lalu deploy ulang.
6. Dashboard dan endpoint datanya hanya bisa dipakai setelah login; function mengakses tab spreadsheet yang sama memakai akses service account.

Jangan pakai kembali password lama yang pernah tersimpan langsung di source code. Jika source lama pernah di-push ke repository publik, ganti password tersebut sebelum deploy.

## Menjalankan di XAMPP

File PHP tetap disediakan untuk penggunaan lokal. Atur environment variable `ADMIN_USERNAME` dan `ADMIN_PASSWORD` pada konfigurasi PHP/Apache sebelum membuka aplikasi. PHP API juga memeriksa session login. `SESSION_SECRET` hanya digunakan oleh versi Vercel.

## Struktur versi Vercel

- `index.html`: halaman login.
- `api/auth/`: login, pemeriksaan sesi, dan logout.
- `api/dashboard.js`: menyajikan dashboard setelah memvalidasi session cookie.
- `api/stok.js`: mengambil data stok dengan autentikasi.
- `dataadmin/assets/`: aset frontend.

Versi PHP lokal dikecualikan dari deployment Vercel melalui `.vercelignore`. Bila sheet dibuat privat, endpoint PHP lokal yang masih memakai ekspor CSV publik perlu dikonfigurasi terpisah; deploy Vercel menggunakan akses service account privat.
