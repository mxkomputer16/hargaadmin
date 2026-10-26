<?php
// api.php
session_start();
header('Content-Type: application/json; charset=utf-8');
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(["error" => "Silakan login untuk mengakses data"]);
    exit;
}

$url = "https://docs.google.com/spreadsheets/d/17qApH3_XO1Mx3sn1N1uqXz-mBu4KT5SqDzyIXJ3HZvQ/export?format=csv&gid=1103841187";

$csvData = @file_get_contents($url);

if ($csvData === FALSE) {
    echo json_encode(["error" => "Gagal mengambil data dari Google Sheets"]);
    exit;
}

$lines = explode(PHP_EOL, $csvData);
$data = [];
$tanggalUpdate = "As of 20 Sep 2026";

foreach ($lines as $index => $line) {
    $row = str_getcsv($line);
    
    if ($index == 0 && isset($row[0])) {
        $tanggalUpdate = $row[0];
    }

    if ($index < 4) continue; 

    // Pemetaan Kolom:
    // Kolom B (index 1) = Kode
    // Kolom D (index 3) = Deskripsi
    // Kolom F (index 5) = Kuantitas
    // Kolom H (index 7) = HPP
    // Kolom J (index 9) = Last Cost
    // Kolom L (index 11) = Harga Jual
    $kode = isset($row[1]) ? trim($row[1]) : '';
    $deskripsi = isset($row[3]) ? trim($row[3]) : '';
    $kuantitasRaw = isset($row[5]) ? trim($row[5]) : '0';
    $kuantitas = is_numeric($kuantitasRaw) ? intval($kuantitasRaw) : 0;
    
    $formatRupiah = function($val) {
        $clean = str_replace(['.', ','], '', $val);
        return is_numeric($clean) ? 'Rp ' . number_format((float)$clean, 0, ',', '.') : $val;
    };

    $hpp = isset($row[7]) ? $formatRupiah(trim($row[7])) : 'Rp 0';
    $last = isset($row[9]) ? $formatRupiah(trim($row[9])) : 'Rp 0';
    $hargaJual = isset($row[11]) ? $formatRupiah(trim($row[11])) : 'Rp 0';

    if (!empty($kode) && $kode !== 'Item No.') {
        $data[] = [
            "no" => count($data) + 1,
            "kode" => $kode,
            "deskripsi" => $deskripsi,
            "kuantitas" => $kuantitas,
            "hpp" => $hpp,
            "last" => $last,
            "harga_jual" => $hargaJual,
            "status" => ($kuantitas > 0) ? 'Ready' : 'Kosong',
            "raw_data" => $row 
        ];
    }
}

echo json_encode([
    "tanggal_update" => $tanggalUpdate,
    "items" => $data
]);
?>