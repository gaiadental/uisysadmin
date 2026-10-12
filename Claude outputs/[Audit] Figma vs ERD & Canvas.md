# Audit: Figma "GAIA UI/UX" vs ERD v3.0 & Design Canvas

Dicek pakai Figma Dev Mode MCP (`get_metadata` + `get_screenshot`), bukan `get_design_context` (butuh skill yang belum ada di sesi ini, dan tugasnya audit bukan generate kode).

> **Update setelah klarifikasi user:** poin #2 di bawah (soal Tier) ternyata kebalik — yang benar **Tier 3 = harga utama**, bukan Tier 1. Jadi bukan Figma yang salah, tapi ERD v3.0 & canvas kita (`ListTindakan.dc.html`, `DetailTindakan.dc.html`, `TambahTindakan.dc.html`, `catalog-v3.0.mmd`, `catalog-domain-usulan-tier-harga.md`) yang sudah dikoreksi mengikuti Figma. Poin #1, #3–#8 sudah di-fix user langsung di Figma. Poin B juga sudah dikonfirmasi bukan gap (List Asuransi memang cuma didesain 2 kolom).

## A. Sudah di-fix user di Figma

1. Breadcrumb Detail Treatment Page yang sempat tertulis "Kelola Asuransi / Detail" — sudah dibetulkan.
2. ~~"Tier 3 = harga utama" ketinggalan zaman~~ — **koreksi**: Tier 3 memang harga utama, ini yang benar. ERD v3.0 dan canvas kita (`ListTindakan.dc.html`, `DetailTindakan.dc.html`, `TambahTindakan.dc.html`) yang tadinya salah tulis "Tier 1 = harga utama" sudah dikoreksi mengikuti ini.
3. Judul & subtitle halaman "Promo & Voucher" (list) yang sempat kebawa dari halaman Katalog Tindakan — sudah dibetulkan.
4. Field "Periode" di Detail Promo "Diskon Jam Sepi" yang sempat kepasang "Orthodontia" — sudah dibetulkan.
5. Kode promo "HAPPYHOUR" vs "HAPPY HOUR" yang tidak konsisten antara list & detail — sudah diseragamkan.
6. Catatan BRILIFE di Detail Insurance Page yang masih wording lama — sudah diupdate ke wording final (potongan revenue dokter, bukan potongan harga pasien).
7. Contoh data pasien "Cabang Kemang" (bukan cabang asli GAIA) — sudah diganti.
8. Breadcrumb "Kelola Patient / Detail" yang campur Inggris-Indonesia — sudah dibetulkan.

## B. Sudah dikonfirmasi bukan gap

- Halaman "List Asuransi" memang sengaja cuma 2 kolom (daftar asuransi & cabang yang berlaku) — bukan kekurangan kolom Status/Kode Harga Khusus, memang begitu desainnya.

## C. Hal yang sudah cocok (tidak perlu diapa-apain)

- **Detail Staff Page** (Figma) strukturnya cocok sama `DetailPegawai.dc.html` kita: Identitas, Pendidikan & Data Pendukung, Timeline Onboarding, Lisensi Praktik & Spesialisasi, Departemen & Level Jabatan, Akun & Role.
- **Detail Treatment Page** field-levelnya (Kategori, Unit, DP Minimum, Harga Utama, Deskripsi, Riwayat Harga, Harga per Tier) cocok 1:1 sama `DetailTindakan.dc.html` kita.
- Wording "Berlaku Saat" → nilai "Booking" di Detail Promo Figma cocok sama rename yang kita lakukan sendiri di canvas sesi sebelumnya.
- "Kelola Cabang" di Figma sudah ada section "Tier Harga" dan "Fasilitas" (4 contoh card: nama/deskripsi/foto) yang cocok sama schema `facilities` yang sudah dikonfirmasi.

## D. Modul terpisah, di luar scope audit ini

- **Panel Tenant** — beda sendiri di Figma (bukan bagian dari flow yang diaudit di sini).
- Login Tenant Flow (domain auth-service), Dashboard, dan sebagian "Kelola Cabang" (branch mgmt) — belum ada canvas-nya, jadi belum dibandingkan.
