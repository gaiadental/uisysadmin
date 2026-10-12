# Usulan Tambahan Field — Tier Harga & Aturan Asuransi Alternatif

Status: **USULAN, belum live di skema database.** Dokumen ini dibuat berdasarkan wireframe UI yang sudah dibangun di canvas "Kelola Pegawai UI" (halaman Katalog Tindakan — Harga per Tier & Aturan Asuransi), dibandingkan terhadap `[ERD] catalog v2.0` yang saat ini jadi acuan resmi (dikonfirmasi cocok 1:1 dengan `combined-erd.mmd`).

Tujuan dokumen ini: daftar konkret field/tabel yang perlu ditambahkan ke `[ERD] catalog v2.0` supaya fitur Tier Harga & Aturan Asuransi Alternatif yang sudah digambar di UI punya dasar skema. **Belum dikonfirmasi Bang Jerry — jangan dianggap final.**

---

## 1. `master_prices` — tambah kolom `price_tier`

Skema saat ini cuma menyimpan satu `amount` per `catalog_service_id` per periode (`effective_from`/`effective_to`). Supaya bisa simpan Tier 1/2/3 sekaligus untuk item & periode yang sama:

```
master_prices {
    ...
    varchar price_tier   "RENCANA — TIER_1 / TIER_2 / TIER_3, Tier 1 = harga utama"
    ...
}
```

Konsekuensi: constraint unik yang tadinya (tenant_id, catalog_service_id, effective period) sekarang perlu jadi (tenant_id, catalog_service_id, price_tier, effective period) — satu item bisa punya 3 baris aktif bersamaan (satu per tier), bukan satu.

## 2. `insurance_rules` — tambah 2 kolom

**a. `percentage_tier_reference`** — menyimpan keputusan yang baru kita ambil ("tipe Percentage selalu ambil dari Tier 3") sebagai data, bukan hardcode di aplikasi:

```
varchar percentage_tier_reference   "RENCANA — nullable, tier acuan kalau pricing_type=PERCENTAGE. NULL = pakai default tenant (saat ini TIER_3)"
```

**b. `alternative_group_id`** — menandai 2+ baris rule sebagai alternatif (pilih salah satu), seperti kasus Prudential (Percentage 10% ATAU Fixed Rp25.000) di wireframe:

```
uuid alternative_group_id   "RENCANA — nullable, rule dengan group_id sama untuk insurance_provider_id+catalog_service_id yang sama dianggap alternatif; NULL = rule berdiri sendiri"
```

Tanpa field ini, sistem tidak tahu apakah 2 rule aktif bersamaan untuk kombinasi provider+item yang sama itu memang disengaja (alternatif) atau bug data.

## 3. `price_quote_items` — tambah kolom `price_tier_used`

Supaya riwayat transaksi bisa dilacak balik "pasien ini kena tier berapa saat itu" (untuk audit/laporan), bukan cuma `master_price_id` tunggal:

```
varchar price_tier_used   "RENCANA — snapshot tier yang dipakai saat transaksi"
```

## 4. Pertanyaan terbuka — belum saya usulkan solusinya, perlu diputuskan dulu

**Bagaimana cara sistem/kasir menentukan tier yang berlaku untuk satu transaksi?** ini belum saya asumsikan, ada 2 kemungkinan arah yang beda konsekuensi skemanya:

- **(a) Otomatis dari cabang** — tiap cabang "ditugaskan" ke satu tier tertentu (sesuai nama canvas lama "Tier Harga & Cabang"). Kalau ini arahnya, perlu tabel baru di catalog-service, misal `branch_price_tiers` (`branch_id` plain UUID — bukan FK, konsisten pola cross-service GAIA — + `price_tier`), karena `branches` sendiri ada di master-data-service dan modelnya sekarang juga tidak punya field tier.
- **(b) Dipilih manual saat transaksi** — kasir/sistem pilih tier per transaksi (mungkin berdasar kelas asuransi pasien atau kebijakan lain), tidak otomatis dari cabang. Kalau ini arahnya, tidak perlu tabel tambahan — `price_tier_used` di `price_quote_items` (poin 3) sudah cukup sebagai snapshot hasil pilihan.

Saya tidak menebak salah satu — ini perlu diputuskan dulu sebelum tabel `branch_price_tiers` (kalau opsi a yang dipilih) ikut diusulkan secara resmi.

---

## Ringkasan tabel yang TIDAK berubah

`catalog_services`, `insurance_providers`, `discount_programs`, `discount_schedules`, `discount_rules`, `discount_branches`, `discount_grants`, `price_quotes`, `quote_adjustments` — tidak ada perubahan yang diusulkan di dokumen ini.
