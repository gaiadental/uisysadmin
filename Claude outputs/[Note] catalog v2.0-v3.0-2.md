> **Status: USULAN, belum di-ACC Bang Jerry.** Ringkasan semua perubahan dari `[erd] catalog v2.0` (acuan resmi saat ini) ke draft `[ERD] catalog v3.0`. Baca ini sebelum baca file ERD lengkapnya kalau cuma mau tahu apa yang beda.

## 1. Field & tabel baru (RENCANA v3.0 — usulan, belum live di schema)

Semuanya nullable/opsional, jadi tidak breaking kalau di-ACC — tidak ada tabel/kolom v2.0 yang dihapus.

| # | Tabel | Perubahan | Alasan |
|---|---|---|---|
| 1 | `master_prices` | + `price_tier` (TIER_1/TIER_2/TIER_3, **Tier 3 = harga utama**) | Dukung harga bertingkat per tier, bukan cuma 1 harga per item. Unique constraint jadi (tenant_id, catalog_service_id, price_tier, effective period). |
| 1b | `master_prices` | + `status` (AKTIF/NONAKTIF) | Kontrol manual bekukan sementara 1 harga tanpa ubah effective_from/to (pola sama seperti #5). Ditambah supaya konsisten dengan `insurance_rules.status` — lihat poin 6 di bawah. |
| 2 | `branch_price_tiers` | **Tabel baru** (branch_id + price_tier + effective_from/effective_to) | Tier tiap cabang ditentukan otomatis dari cabang (sudah dikonfirmasi user), bukan dipilih manual per transaksi, dan BISA berubah seiring waktu — pakai linimasa `effective_from`/`effective_to`, pola sama seperti `master_prices` (sudah dikonfirmasi user, lihat poin 5 di bawah). `branches` ada di master-data-service dan tidak punya field tier, jadi butuh tabel terpisah di catalog-service. |
| 3 | `insurance_providers` | `is_active` (boolean) → `status` (varchar: BERLAKU/TIDAK_BERLAKU/BELUM_BERLAKU/HARGA_KHUSUS) + `special_price_code` (nullable) | Data asli butuh 4 keadaan status per cabang, bukan cuma on/off. `special_price_code` nampung kode kayak NAYAKA/InovaCare. |
| 4 | `insurance_rules` | + `percentage_tier_reference` (nullable) + `alternative_group_id` (nullable) | Dukung rule tipe PERCENTAGE yang butuh acuan tier (default TIER_3 kalau NULL, sudah diputuskan), dan rule yang jadi alternatif — pilih salah satu (kasus Prudential: Percentage 10% ATAU Fixed Rp25.000). |
| 5 | `insurance_rules` | + `status` (AKTIF/NONAKTIF) | Kontrol manual nonaktifkan 1 aturan klaim tanpa ubah effective_from/to (misal lagi disengketakan). Sekarang konsisten dengan `master_prices.status` (poin 1b) — lihat poin 6 di bawah. |
| — | `price_quote_items` | + `price_tier_used` (nullable, snapshot) | Audit trail: tier yang dipakai saat transaksi, supaya harga historis tidak berubah kalau tier cabang berubah belakangan. Turunan langsung dari usulan #1/#2. |

## 2. Koreksi dokumentasi (bukan perubahan schema)

- `insurance_rules.pricing_value` — contoh "12 untuk BRILIFE" di komentar field **dihapus**. Ini contoh yang sudah ada sejak v2.0, tapi ternyata menyesatkan: diskon 12% BRILIFE BUKAN aturan `insurance_rules` (lihat poin 3 di bawah). Tidak ada perubahan tipe/struktur field, cuma teks komentarnya yang dikoreksi.

## 3. Klarifikasi baru: diskon 12% BRILIFE di luar scope skema ini

Dikonfirmasi final oleh tim operasional: diskon 12% BRILIFE itu **potongan revenue dokter**, diterapkan manual oleh CRO saat menyusun laporan harian — bukan potongan harga/klaim yang dihitung ke pasien lewat `insurance_rules`. Karena domainnya "revenue/komisi dokter" (bukan "harga ke pasien"), **tidak ada tabel/kolom yang diusulkan** untuk ini di v3.0 — belum ada representasi skema untuk domain ini di ERD manapun yang pernah dibaca. Kalau nanti mau diotomatisasi, kemungkinan besar butuh modul/service baru di luar catalog-service, belum ada usulan konkret.

## 4. Yang TIDAK berubah dari v2.0

`catalog_services`, `discount_programs`, `discount_schedules`, `discount_rules`, `discount_branches`, `discount_grants`, `price_quotes`, `quote_adjustments` — tidak ada perubahan struktur di draft v3.0 ini.

## 5. Pertanyaan terbuka (belum dijawab, perlu Bang Jerry)

Tidak ada lagi untuk saat ini — kedua pertanyaan terbuka sebelumnya sudah dijawab user, lihat poin 6.

## 6. Sudah diputuskan (update setelah changelog ini pertama kali dibuat)

- **`branch_price_tiers` effective period** — SUDAH DIJAWAB: 1 cabang BISA punya tier yang berubah-ubah seiring waktu. `branch_price_tiers` ditambah `effective_from`/`effective_to`, linimasa yang sama seperti `master_prices` — bukan lagi asumsi "tetap sampai diubah manual" seperti draft awal.
- **`insurance_rules.status` vs pola `master_prices`** — SUDAH DIJAWAB: user memilih diseragamkan, bukan dibiarkan beda. `master_prices` ikut ditambah kolom `status` (AKTIF/NONAKTIF) yang sama polanya dengan `insurance_rules.status` (poin 1b & 5 di atas) — jadi sekarang keduanya konsisten, sama-sama punya kontrol manual terpisah dari tanggal.
- **Tier mana yang jadi harga utama** — KOREKSI: **Tier 3 = harga utama**, bukan Tier 1. Draft awal dokumen ini dan canvas UI (`ListTindakan.dc.html`, `DetailTindakan.dc.html`, `TambahTindakan.dc.html`) sempat salah tulis "Tier 1 = harga utama" — ketahuan salah saat audit UI vs Figma "GAIA UI/UX", dikonfirmasi user, dan sudah dikoreksi di ERD ini, `catalog-v3.0.mmd`, dan ketiga file canvas di atas.
