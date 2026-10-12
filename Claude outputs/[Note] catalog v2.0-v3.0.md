> **Status: USULAN, belum di-ACC Bang Jerry.** Ringkasan semua perubahan dari `[erd] catalog v2.0` (acuan resmi saat ini) ke draft `[ERD] catalog v3.0`. Baca ini sebelum baca file ERD lengkapnya kalau cuma mau tahu apa yang beda.

## 1. Field & tabel baru (RENCANA v3.0 — usulan, belum live di schema)

Semuanya nullable/opsional, jadi tidak breaking kalau di-ACC — tidak ada tabel/kolom v2.0 yang dihapus.

| # | Tabel | Perubahan | Alasan |
|---|---|---|---|
| 1 | `master_prices` | + `price_tier` (TIER_1/TIER_2/TIER_3) | Dukung harga bertingkat per tier, bukan cuma 1 harga per item. Unique constraint jadi (tenant_id, catalog_service_id, price_tier, effective period). |
| 2 | `branch_price_tiers` | **Tabel baru** (branch_id + price_tier) | Tier tiap cabang ditentukan otomatis dari cabang (sudah dikonfirmasi user), bukan dipilih manual per transaksi. `branches` ada di master-data-service dan tidak punya field tier, jadi butuh tabel terpisah di catalog-service. |
| 3 | `insurance_providers` | `is_active` (boolean) → `status` (varchar: BERLAKU/TIDAK_BERLAKU/BELUM_BERLAKU/HARGA_KHUSUS) + `special_price_code` (nullable) | Data asli butuh 4 keadaan status per cabang, bukan cuma on/off. `special_price_code` nampung kode kayak NAYAKA/InovaCare. |
| 4 | `insurance_rules` | + `percentage_tier_reference` (nullable) + `alternative_group_id` (nullable) | Dukung rule tipe PERCENTAGE yang butuh acuan tier (default TIER_3 kalau NULL, sudah diputuskan), dan rule yang jadi alternatif — pilih salah satu (kasus Prudential: Percentage 10% ATAU Fixed Rp25.000). |
| 5 | `insurance_rules` | + `status` (AKTIF/NONAKTIF) | Kontrol manual nonaktifkan 1 aturan klaim tanpa ubah effective_from/to. **Catatan konsistensi belum diputuskan**: ini menyimpang dari pola `master_prices` yang statusnya cuma dihitung dari tanggal, tidak punya kolom status sendiri — perlu di-ACC termasuk soal konsistensi ini. |
| — | `price_quote_items` | + `price_tier_used` (nullable, snapshot) | Audit trail: tier yang dipakai saat transaksi, supaya harga historis tidak berubah kalau tier cabang berubah belakangan. Turunan langsung dari usulan #1/#2. |

## 2. Koreksi dokumentasi (bukan perubahan schema)

- `insurance_rules.pricing_value` — contoh "12 untuk BRILIFE" di komentar field **dihapus**. Ini contoh yang sudah ada sejak v2.0, tapi ternyata menyesatkan: diskon 12% BRILIFE BUKAN aturan `insurance_rules` (lihat poin 3 di bawah). Tidak ada perubahan tipe/struktur field, cuma teks komentarnya yang dikoreksi.

## 3. Klarifikasi baru: diskon 12% BRILIFE di luar scope skema ini

Dikonfirmasi final oleh tim operasional: diskon 12% BRILIFE itu **potongan revenue dokter**, diterapkan manual oleh CRO saat menyusun laporan harian — bukan potongan harga/klaim yang dihitung ke pasien lewat `insurance_rules`. Karena domainnya "revenue/komisi dokter" (bukan "harga ke pasien"), **tidak ada tabel/kolom yang diusulkan** untuk ini di v3.0 — belum ada representasi skema untuk domain ini di ERD manapun yang pernah dibaca. Kalau nanti mau diotomatisasi, kemungkinan besar butuh modul/service baru di luar catalog-service, belum ada usulan konkret.

## 4. Yang TIDAK berubah dari v2.0

`catalog_services`, `discount_programs`, `discount_schedules`, `discount_rules`, `discount_branches`, `discount_grants`, `price_quotes`, `quote_adjustments` — tidak ada perubahan struktur di draft v3.0 ini.

## 5. Pertanyaan terbuka (belum dijawab, perlu Bang Jerry)

- **`branch_price_tiers` effective period**: apakah 1 cabang bisa punya tier yang berubah-ubah seiring waktu (perlu `effective_from`/`effective_to`, seperti tabel harga lain), atau tier per cabang tetap sampai diubah manual? Draft v3.0 pakai asumsi paling sederhana (tetap sampai diubah manual), belum pakai effective period.
- **`insurance_rules.status` vs pola `master_prices`**: apakah oke kalau `insurance_rules` punya kolom status manual sendiri sementara `master_prices` tetap cuma dihitung dari tanggal? Atau perlu diseragamkan salah satu caranya?
