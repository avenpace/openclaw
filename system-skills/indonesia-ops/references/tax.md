# Indonesian Tax Rules for SMBs — Assistant Reference

Last researched: 2026-11-01

Scope: the taxes Indonesian small and medium businesses (clinics, bakeries/F&B, retail shops, service firms) handle every day. English prose; Indonesian legal terms kept as-is. Figures carry their legal basis. Anything this research could not confirm is marked **[UNVERIFIED]**. Do not quote a figure to an owner as certain if it is marked that way.

**How an assistant should use this file**

- It is a working reference, not legal advice. For edge cases, disputes, audits (SP2DK, pemeriksaan), restructurings, or anything above routine bookkeeping, tell the owner to confirm with a konsultan pajak (registered member of IKPI or similar) or their KPP (Kantor Pelayanan Pajak) / Kring Pajak 1500200.
- Check the "Likely to change / verify yearly" section at the end before quoting any rate, threshold, or deadline.

---

## 0. Big changes in 2025–2026 (read first)

| Change                                                                                                                                                | Status as of 2026-11-01                                                                                                                                                                                                                          | Basis                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| **Coretax DJP** replaced DJP Online / e-Faktur desktop / e-Bupot unifikasi desktop                                                                    | Live since 1 Jan 2025. SPT Tahunan for tax year 2025 was filed through Coretax in 2026                                                                                                                                                           | PMK 81/2024; PER-11/PJ/2025     |
| **Unified payment deadline**: the 15th of the following month for most monthly taxes                                                                  | In force since 1 Jan 2025                                                                                                                                                                                                                        | PMK 81/2024 Pasal 94(2)         |
| **PPN 12% with DPP nilai lain 11/12** (effective 11%) for non-luxury goods/services                                                                   | In force since 1 Jan 2025. Not changed in 2026; the Finance Minister (Purbaya) said several times (Dec 2025, Feb 2026, Sep 2026) that there would be no cut or increase for now                                                                  | PMK 131/2024                    |
| **PP 20/2026** amends PP 55/2022 (PPh Final UMKM 0.5%)                                                                                                | In force since 22 Apr 2026. 0.5% now only for orang pribadi, PT Perorangan (single-founder PT) and koperasi. No time limit for OP and PT Perorangan. CV, firma and regular PT can no longer newly opt in. Professionals (doctors, etc.) excluded | PP 20/2026                      |
| **PPh 21 DTP 2026** for workers earning ≤ Rp10 juta/month in five sectors, including pariwisata (which covers restaurant/café/catering/hotel workers) | Jan–Dec 2026                                                                                                                                                                                                                                     | PMK 105/2025                    |
| **Marketplace PPh 22 at 0.5%** collected by Shopee, Tokopedia, Lazada, Blibli from online sellers                                                     | Starts **1 Nov 2026** (postponed from 1 Aug 2026)                                                                                                                                                                                                | PMK 37/2025; PENG-46/PJ.09/2026 |
| **e-Faktur upload deadline** moved to the 20th of the following month                                                                                 | Since 22 May 2025                                                                                                                                                                                                                                | PER-11/PJ/2025 Pasal 44(1)      |
| **Sanction waivers for the 2025 SPT Tahunan** (Coretax transition)                                                                                    | OP: no fine if filed by 30 Apr 2026 (KEP-55/PJ/2026). Badan: no fine if filed by 31 May 2026, and late PPh 29 payment also waived (KEP-71/PJ/2026). **One-off — do not assume it repeats in 2027.**                                              | KEP-55/PJ/2026; KEP-71/PJ/2026  |

---

## 1. PPh Pasal 21 — employees, non-employees, daily workers

### 1.1 The rule

Since 1 January 2024, the employer (pemberi kerja) withholds PPh 21 each month using **TER (Tarif Efektif Rata-rata)**. TER is a flat percentage applied to the employee's **gross monthly income (penghasilan bruto)**. In the **last tax period** (December, or the month the employee leaves), the employer recalculates the whole year using the progressive **Pasal 17** rates. The December figure is the annual tax minus the TER already withheld in January–November.

- Legal basis: **PP 58/2023** (TER rates, effective 1 Jan 2024); **PMK 168/2023** (calculation procedures); UU PPh Pasal 17(1)(a) as amended by **UU 7/2021 (HPP)**; PTKP from **PMK 101/2016**.
- TER is **mandatory**, not optional.
- Gross income (bruto) for TER covers salary, fixed and irregular allowances, overtime, bonus/THR in the month paid, and the JKK and JKM (BPJS Ketenagakerjaan) premiums paid by the employer. **[UNVERIFIED]**: confirm the treatment of BPJS Kesehatan employer premiums and benefits in kind (natura) with a consultant. Natura rules sit in PMK 66/2023.

### 1.2 PTKP (Penghasilan Tidak Kena Pajak), per year (unchanged for 2026)

| Item                      | Amount       |
| ------------------------- | ------------ |
| Taxpayer (WP)             | Rp54.000.000 |
| Additional if married (K) | Rp4.500.000  |
| Each dependent (max 3)    | Rp4.500.000  |

| Status | PTKP/year    | TER category |
| ------ | ------------ | ------------ |
| TK/0   | Rp54.000.000 | **A**        |
| TK/1   | Rp58.500.000 | **A**        |
| K/0    | Rp58.500.000 | **A**        |
| TK/2   | Rp63.000.000 | **B**        |
| K/1    | Rp63.000.000 | **B**        |
| TK/3   | Rp67.500.000 | **B**        |
| K/2    | Rp67.500.000 | **B**        |
| K/3    | Rp72.000.000 | **C**        |

The status is fixed at the **start of the tax year** (1 January). TK = tidak kawin (single), K = kawin (married), number = tanggungan (dependents). For a married female employee, the default is TK/0 unless the conditions in PMK 168/2023 apply **[UNVERIFIED — confirm specifics for married women employees]**.

### 1.3 Complete TER Bulanan tables (Lampiran PP 58/2023)

Look up the employee's **monthly gross income** in the table for their category and multiply. The rate applies to the whole gross amount; it is not a marginal rate.

**TER Kategori A** (TK/0, TK/1, K/0) — 44 brackets

| No  | Penghasilan bruto bulanan (Rp) | TER   |
| --- | ------------------------------ | ----- |
| 1   | s.d. 5.400.000                 | 0%    |
| 2   | 5.400.001 – 5.650.000          | 0,25% |
| 3   | 5.650.001 – 5.950.000          | 0,5%  |
| 4   | 5.950.001 – 6.300.000          | 0,75% |
| 5   | 6.300.001 – 6.750.000          | 1%    |
| 6   | 6.750.001 – 7.500.000          | 1,25% |
| 7   | 7.500.001 – 8.550.000          | 1,5%  |
| 8   | 8.550.001 – 9.650.000          | 1,75% |
| 9   | 9.650.001 – 10.050.000         | 2%    |
| 10  | 10.050.001 – 10.350.000        | 2,25% |
| 11  | 10.350.001 – 10.700.000        | 2,5%  |
| 12  | 10.700.001 – 11.050.000        | 3%    |
| 13  | 11.050.001 – 11.600.000        | 3,5%  |
| 14  | 11.600.001 – 12.500.000        | 4%    |
| 15  | 12.500.001 – 13.750.000        | 5%    |
| 16  | 13.750.001 – 15.100.000        | 6%    |
| 17  | 15.100.001 – 16.950.000        | 7%    |
| 18  | 16.950.001 – 19.750.000        | 8%    |
| 19  | 19.750.001 – 24.150.000        | 9%    |
| 20  | 24.150.001 – 26.450.000        | 10%   |
| 21  | 26.450.001 – 28.000.000        | 11%   |
| 22  | 28.000.001 – 30.050.000        | 12%   |
| 23  | 30.050.001 – 32.400.000        | 13%   |
| 24  | 32.400.001 – 35.400.000        | 14%   |
| 25  | 35.400.001 – 39.100.000        | 15%   |
| 26  | 39.100.001 – 43.850.000        | 16%   |
| 27  | 43.850.001 – 47.800.000        | 17%   |
| 28  | 47.800.001 – 51.400.000        | 18%   |
| 29  | 51.400.001 – 56.300.000        | 19%   |
| 30  | 56.300.001 – 62.200.000        | 20%   |
| 31  | 62.200.001 – 68.600.000        | 21%   |
| 32  | 68.600.001 – 77.500.000        | 22%   |
| 33  | 77.500.001 – 89.000.000        | 23%   |
| 34  | 89.000.001 – 103.000.000       | 24%   |
| 35  | 103.000.001 – 125.000.000      | 25%   |
| 36  | 125.000.001 – 157.000.000      | 26%   |
| 37  | 157.000.001 – 206.000.000      | 27%   |
| 38  | 206.000.001 – 337.000.000      | 28%   |
| 39  | 337.000.001 – 454.000.000      | 29%   |
| 40  | 454.000.001 – 550.000.000      | 30%   |
| 41  | 550.000.001 – 695.000.000      | 31%   |
| 42  | 695.000.001 – 910.000.000      | 32%   |
| 43  | 910.000.001 – 1.400.000.000    | 33%   |
| 44  | > 1.400.000.000                | 34%   |

**TER Kategori B** (TK/2, TK/3, K/1, K/2) — 40 brackets

| No  | Penghasilan bruto bulanan (Rp) | TER   |
| --- | ------------------------------ | ----- |
| 1   | s.d. 6.200.000                 | 0%    |
| 2   | 6.200.001 – 6.500.000          | 0,25% |
| 3   | 6.500.001 – 6.850.000          | 0,5%  |
| 4   | 6.850.001 – 7.300.000          | 0,75% |
| 5   | 7.300.001 – 9.200.000          | 1%    |
| 6   | 9.200.001 – 10.750.000         | 1,5%  |
| 7   | 10.750.001 – 11.250.000        | 2%    |
| 8   | 11.250.001 – 11.600.000        | 2,5%  |
| 9   | 11.600.001 – 12.600.000        | 3%    |
| 10  | 12.600.001 – 13.600.000        | 4%    |
| 11  | 13.600.001 – 14.950.000        | 5%    |
| 12  | 14.950.001 – 16.400.000        | 6%    |
| 13  | 16.400.001 – 18.450.000        | 7%    |
| 14  | 18.450.001 – 21.850.000        | 8%    |
| 15  | 21.850.001 – 26.000.000        | 9%    |
| 16  | 26.000.001 – 27.700.000        | 10%   |
| 17  | 27.700.001 – 29.350.000        | 11%   |
| 18  | 29.350.001 – 31.450.000        | 12%   |
| 19  | 31.450.001 – 33.950.000        | 13%   |
| 20  | 33.950.001 – 37.100.000        | 14%   |
| 21  | 37.100.001 – 41.100.000        | 15%   |
| 22  | 41.100.001 – 45.800.000        | 16%   |
| 23  | 45.800.001 – 49.500.000        | 17%   |
| 24  | 49.500.001 – 53.800.000        | 18%   |
| 25  | 53.800.001 – 58.500.000        | 19%   |
| 26  | 58.500.001 – 64.000.000        | 20%   |
| 27  | 64.000.001 – 71.000.000        | 21%   |
| 28  | 71.000.001 – 80.000.000        | 22%   |
| 29  | 80.000.001 – 93.000.000        | 23%   |
| 30  | 93.000.001 – 109.000.000       | 24%   |
| 31  | 109.000.001 – 129.000.000      | 25%   |
| 32  | 129.000.001 – 163.000.000      | 26%   |
| 33  | 163.000.001 – 211.000.000      | 27%   |
| 34  | 211.000.001 – 374.000.000      | 28%   |
| 35  | 374.000.001 – 459.000.000      | 29%   |
| 36  | 459.000.001 – 555.000.000      | 30%   |
| 37  | 555.000.001 – 704.000.000      | 31%   |
| 38  | 704.000.001 – 957.000.000      | 32%   |
| 39  | 957.000.001 – 1.405.000.000    | 33%   |
| 40  | > 1.405.000.000                | 34%   |

**TER Kategori C** (K/3) — 41 brackets

| No  | Penghasilan bruto bulanan (Rp) | TER   |
| --- | ------------------------------ | ----- |
| 1   | s.d. 6.600.000                 | 0%    |
| 2   | 6.600.001 – 6.950.000          | 0,25% |
| 3   | 6.950.001 – 7.350.000          | 0,5%  |
| 4   | 7.350.001 – 7.800.000          | 0,75% |
| 5   | 7.800.001 – 8.850.000          | 1%    |
| 6   | 8.850.001 – 9.800.000          | 1,25% |
| 7   | 9.800.001 – 10.950.000         | 1,5%  |
| 8   | 10.950.001 – 11.200.000        | 1,75% |
| 9   | 11.200.001 – 12.050.000        | 2%    |
| 10  | 12.050.001 – 12.950.000        | 3%    |
| 11  | 12.950.001 – 14.150.000        | 4%    |
| 12  | 14.150.001 – 15.550.000        | 5%    |
| 13  | 15.550.001 – 17.050.000        | 6%    |
| 14  | 17.050.001 – 19.500.000        | 7%    |
| 15  | 19.500.001 – 22.700.000        | 8%    |
| 16  | 22.700.001 – 26.600.000        | 9%    |
| 17  | 26.600.001 – 28.100.000        | 10%   |
| 18  | 28.100.001 – 30.100.000        | 11%   |
| 19  | 30.100.001 – 32.600.000        | 12%   |
| 20  | 32.600.001 – 35.400.000        | 13%   |
| 21  | 35.400.001 – 38.900.000        | 14%   |
| 22  | 38.900.001 – 43.000.000        | 15%   |
| 23  | 43.000.001 – 47.400.000        | 16%   |
| 24  | 47.400.001 – 51.200.000        | 17%   |
| 25  | 51.200.001 – 55.800.000        | 18%   |
| 26  | 55.800.001 – 60.400.000        | 19%   |
| 27  | 60.400.001 – 66.700.000        | 20%   |
| 28  | 66.700.001 – 74.500.000        | 21%   |
| 29  | 74.500.001 – 83.200.000        | 22%   |
| 30  | 83.200.001 – 95.600.000        | 23%   |
| 31  | 95.600.001 – 110.000.000       | 24%   |
| 32  | 110.000.001 – 134.000.000      | 25%   |
| 33  | 134.000.001 – 169.000.000      | 26%   |
| 34  | 169.000.001 – 221.000.000      | 27%   |
| 35  | 221.000.001 – 390.000.000      | 28%   |
| 36  | 390.000.001 – 463.000.000      | 29%   |
| 37  | 463.000.001 – 561.000.000      | 30%   |
| 38  | 561.000.001 – 709.000.000      | 31%   |
| 39  | 709.000.001 – 965.000.000      | 32%   |
| 40  | 965.000.001 – 1.419.000.000    | 33%   |
| 41  | > 1.419.000.000                | 34%   |

**TER Harian** (pegawai tidak tetap / daily workers not paid monthly)

| Penghasilan bruto harian     | TER                                    |
| ---------------------------- | -------------------------------------- |
| s.d. Rp450.000               | 0%                                     |
| > Rp450.000 s.d. Rp2.500.000 | 0,5%                                   |
| > Rp2.500.000 per day        | Not TER: Pasal 17 rates × 50% of gross |

If a worker is paid weekly, per unit or per job (borongan), divide the pay by the days worked to get the average daily wage. A pegawai tidak tetap who is **paid monthly** uses the TER Bulanan A/B/C tables instead.

### 1.4 Pasal 17(1)(a) progressive rates (December recalculation, bukan pegawai)

| Penghasilan Kena Pajak (PKP) per year | Rate |
| ------------------------------------- | ---- |
| s.d. Rp60.000.000                     | 5%   |
| > Rp60 juta – Rp250 juta              | 15%  |
| > Rp250 juta – Rp500 juta             | 25%  |
| > Rp500 juta – Rp5 miliar             | 30%  |
| > Rp5 miliar                          | 35%  |

### 1.5 December (masa pajak terakhir) calculation for a pegawai tetap

1. Annual gross income (all months, including THR and bonus).
2. Minus **biaya jabatan**: 5% of gross, capped at **Rp500.000/month = Rp6.000.000/year**.
3. Minus the employee's own contributions to pension/JHT/JP (iuran pensiun, JHT, JP paid by the employee).
4. = Penghasilan neto. Minus **PTKP** = PKP (rounded down to the nearest thousand).
5. Apply the Pasal 17 rates = PPh 21 for the year.
6. December PPh 21 = annual PPh 21 minus the total TER withheld in January–November. If the result is negative, the excess is refunded to the employee by the employer (per PMK 168/2023).
7. Give the employee the annual bukti potong (**BPA1** in Coretax).

An employee who leaves mid-year gets the same recalculation in the month they leave.

### 1.6 THR and bonus

There is no separate rate. THR and bonuses are added to that month's gross income, and the TER for the combined amount applies. The month can therefore have a much higher TER, and the December recalculation evens it out.

### 1.7 Bukan pegawai (non-employees: freelancers, doctors paid per visit at a clinic, trainers, consultants)

- **PPh 21 = Pasal 17 rate × (50% × gross payment).**
- Since PMK 168/2023 the calculation is **per payment and not cumulative**, and the old berkesinambungan (continuous) vs. tidak berkesinambungan split is gone.
- A doctor who is a mitra at a clinic (paid fees, not salary) is normally bukan pegawai.

### 1.8 No NPWP / NIK

If the recipient has no NPWP, PPh 21 is **20% higher** than the normal amount (UU PPh Pasal 21(5a)). Since NIK now works as NPWP for residents (see §5), the surcharge applies only when the person's NIK is not valid or integrated **[UNVERIFIED: how strictly Coretax applies this in practice]**.

### 1.9 PPh 21 DTP 2026 (government-borne PPh 21) — PMK 105/2025

- Period: masa pajak January–December 2026.
- Sectors: alas kaki (footwear), tekstil and pakaian jadi (textiles and garments), furnitur (furniture), kulit and barang dari kulit (leather goods), and **pariwisata**. DJP says pariwisata covers hotel and lodging staff, **restaurant and café workers, catering staff**, travel agencies, tour guides and MICE. The employer's KLU must match the KLU listed in the PMK's appendix.
- Employees: pegawai tetap with fixed, regular gross income ≤ **Rp10.000.000/month**; pegawai tidak tetap with daily wage ≤ **Rp500.000** or monthly ≤ Rp10.000.000. The employee must have an NPWP or an NIK integrated with DJP.
- Mechanism: the employer still calculates the PPh 21, but pays it **in cash to the employee** together with the salary instead of depositing it. This cash is not taxable income. The employer reports it in SPT Masa PPh 21/26 with the DTP code. Only the fixed and regular part is covered; THR and bonus are not **[UNVERIFIED: confirm THR/bonus exclusion]**.
- F&B relevance: a restaurant or café registered under a tourism KLU may qualify. A bakery registered as food manufacturing (pabrik roti) probably does not **[UNVERIFIED — check KLU]**.

### 1.10 Worked examples

**(a) Monthly TER — single cashier, TK/0, gross Rp10.000.000/month.**
Category A, bracket 9.650.001–10.050.000 → 2%. PPh 21 = Rp10.000.000 × 2% = **Rp200.000/month** (January–November).

**(b) December recalculation for the same employee** (no BPJS deductions, to keep it simple):

- Annual gross = Rp120.000.000
- Biaya jabatan = 5% × 120.000.000 = Rp6.000.000 (exactly at the cap)
- Neto = Rp114.000.000; PTKP TK/0 = Rp54.000.000 → PKP = Rp60.000.000
- Annual PPh 21 = 5% × 60.000.000 = Rp3.000.000
- Already withheld January–November = 11 × 200.000 = Rp2.200.000
- **December PPh 21 = Rp800.000**

**(c) THR month — baker, K/1 (category B), salary Rp8.000.000, THR Rp8.000.000 paid in March.**

- Normal month: Rp8.000.000 → bracket 7.300.001–9.200.000 = 1% → Rp80.000.
- March: gross Rp16.000.000 → bracket 14.950.001–16.400.000 = 6% → **Rp960.000**.

**(d) Bukan pegawai — dental clinic pays a visiting dentist Rp20.000.000 in one payment.**
DPP = 50% × 20.000.000 = Rp10.000.000 → 5% → **Rp1.000.000**.
A single payment of Rp150.000.000 → DPP Rp75.000.000 → (60.000.000 × 5%) + (15.000.000 × 15%) = 3.000.000 + 2.250.000 = **Rp5.250.000**.

**(e) Daily worker at Rp500.000/day:** above Rp450.000, so 0.5% → Rp2.500/day.

### Sources

- https://betta.ortax.org/storage/splash/2024/02/Tabel-Tarif-dan-TER-PPh-Pasal-21-Tahun-2024-1.pdf (full TER tables, Pasal 17 layers, TER harian, from PP 58/2023)
- https://www.pajak.com/pajak/cara-menentukan-kategori-ter-pascapemberlakuan-pmk-168-2023/
- https://ikpi.or.id/?p=8499
- https://pajakku.com/artikel/tiering-pajak-penghasilan-orang-pribadi-terbaru-2026 (no 2026 change to Pasal 17, PTKP or TER)
- https://news.ddtc.co.id/berita/nasional/1815162/ingat-penghitungan-dpp-pph-21-atas-bukan-pegawai-tak-lagi-akumulatif
- https://news.ddtc.co.id/berita/nasional/1816737/penghitungan-pph-pasal-21-atas-pegawai-tidak-tetap-dengan-upah-harian
- https://ortax.org/pph-21-dtp-sektor-tertentu-berlaku-sepanjang-tahun-2026-ini-rincian-syaratnya
- https://www.pajak.go.id/en/node/119078 (tourism subsectors incl. restaurants/cafés)
- https://pajak.go.id/en/node/118927 (PMK 105/2025)

---

## 2. PPh 23, PPh 4(2) final, PPh 22

### 2.1 PPh Pasal 23 (withholding by badan and appointed withholders)

| Income                                                                                                                                                            | Rate                              | Basis                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| Dividends, interest, royalties, prizes not covered by PPh 21                                                                                                      | **15%** of gross                  | UU PPh Pasal 23(1)(a)                                |
| Rent of assets **other than land/buildings** (vehicles, equipment), and services such as technical, management, consulting, cleaning, catering, maintenance, etc. | **2%** of gross                   | UU PPh Pasal 23(1)(c); PMK 141/2015 list of services |
| Recipient without NPWP                                                                                                                                            | rate is **100% higher** (e.g. 4%) | UU PPh Pasal 23(1a)                                  |

- The withholder is the paying **badan** (PT, CV, koperasi, clinic company, etc.) or an individual appointed by DJP. An ordinary sole trader paying a cleaner is generally **not** a PPh 23 withholder **[UNVERIFIED — depends on DJP appointment]**.
- PPh 23 is calculated on the amount **excluding PPN**. The DPP nilai lain 11/12 used for PPN does not change the PPh 23 base.
- An OP or PT Perorangan using PPh Final UMKM 0.5% can give the payer its surat keterangan / confirmation (now checked in Coretax), so that 0.5% final is withheld instead of 2% PPh 23 **[UNVERIFIED: exact Coretax document name after PP 20/2026]**.
- Bukti potong: **BPPU** (bukti pemotongan unifikasi) in Coretax e-Bupot. Payment by the 15th, SPT Masa PPh Unifikasi by the 20th.

**Example:** a PT clinic pays a cleaning company Rp5.000.000 + PPN. PPh 23 = 2% × 5.000.000 = **Rp100.000**. The clinic pays the vendor 5.000.000 + PPN − 100.000 and issues a BPPU.

### 2.2 PPh Pasal 4 ayat (2) final (selected)

| Income                                                                                                                  | Rate                       | Basis                                        |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------- |
| **Rent of land and/or buildings** (shop, ruko, office, warehouse)                                                       | **10%** of gross rent      | PP 34/2017                                   |
| Construction work — provider with small-business qualification (kualifikasi kecil) or individual competency certificate | **1,75%**                  | PP 9/2022                                    |
| Construction work — provider without qualification/certificate                                                          | **4%**                     | PP 9/2022                                    |
| Construction work — provider with medium/large/specialist qualification                                                 | **2,65%**                  | PP 9/2022                                    |
| Integrated construction (EPC/design-build) — with SBU                                                                   | **2,65%**; without: **4%** | PP 9/2022                                    |
| Construction consulting — with certificate                                                                              | **3,5%**; without: **6%**  | PP 9/2022                                    |
| PPh Final UMKM                                                                                                          | 0,5%                       | PP 55/2022 as amended by PP 20/2026 (see §3) |
| Bank deposit/savings interest                                                                                           | 20% (withheld by the bank) | PP 131/2000 and later                        |

- Rent: if the tenant is a badan or appointed withholder, the tenant withholds 10%. If the tenant is an individual who is not a withholder, the **landlord pays it** themselves by the 15th of the following month.
- PP 9/2022 required an evaluation after three years (from Feb 2022). DDTC reported in Aug 2025 that the evaluation was underway and the rates were unchanged. **[UNVERIFIED: no amendment found as of Nov 2026 — re-check.]**

**Example — renting a ruko for a bakery:** annual rent Rp60.000.000 paid by a PT. The PT withholds 10% = **Rp6.000.000**, pays the landlord Rp54.000.000, and issues a BPPU. If the bakery is an OP who is not a withholder, the landlord receives Rp60.000.000 and pays the Rp6.000.000 themselves.

**Example — renovation:** clinic contract Rp100.000.000 with a contractor holding a small qualification → 1,75% = **Rp1.750.000** withheld.

### 2.3 PPh Pasal 22 — what SMBs touch

- **Marketplace sellers (new):** from **1 Nov 2026**, Shopee, Tokopedia, Lazada and Blibli collect **0.5% PPh 22** of the gross transaction value on the invoice (excluding PPN/PPnBM) from domestic online sellers (PMK 37/2025; start postponed by PENG-46/PJ.09/2026).
  - A seller whose annual gross turnover is ≤ **Rp500 juta** can submit a stamped surat pernyataan to the marketplace to avoid collection. When turnover passes Rp500 juta during the year, the seller must update the statement by the end of that month.
  - Excluded: ojol (ride-hailing) services, pulsa/SIM card sellers, gold/jewellery, holders of a surat keterangan bebas, and land/building transfers.
  - For sellers on PPh Final UMKM 0.5%, the marketplace collection counts toward that final tax; any shortfall is paid by the seller. The marketplace invoice acts as the bukti pungut and appears in the seller's Coretax account.
  - Sellers still file the SPT Tahunan.
- **Imports:** PPh 22 is collected by customs. Common rates are 2,5% of import value with an API (importer ID) and 7,5% without, with higher rates for certain consumer goods under PMK 34/2017 as amended **[UNVERIFIED — not re-checked for 2026]**.
- **Selling to government agencies** (bendahara): 1,5% PPh 22 is collected on purchases **[UNVERIFIED — not re-checked for 2026]**.

### Sources

- https://pajakku.com/artikel/simak-ketentuan-pph-final-jasa-konstruksi-berikut-ini
- https://news.ddtc.co.id/berita/nasional/1813321/pph-final-jasa-konstruksi-sudah-masuk-masa-evaluasi-menkeu
- https://enforcea.com/Blog/dpp-pemotongan-pph-pasal-23-pasca-berlakunya-pmk-131-2024
- https://news.ddtc.co.id/berita/nasional/1822566/djp-pemungutan-pph-pasal-22-oleh-marketplace-berlaku-1-november
- https://www.pajak.go.id/en/node/120342 (PMK 37/2025 details)
- https://jdih.kemenkeu.go.id/dok/pmk-37-tahun-2025

---

## 3. PPh Final UMKM 0.5% (PP 55/2022 as amended by PP 20/2026)

### 3.1 The rule (from 22 April 2026)

- **Rate:** 0,5% of monthly gross turnover (peredaran bruto). It is final: no expense deductions and no PPh 25 installments on that income.
- **Who can use it (new taxpayers from PP 20/2026):** only
  1. **Wajib Pajak orang pribadi** (individual sole traders),
  2. **Perseroan perorangan** (a PT founded by one person under UU Cipta Kerja), and
  3. **Koperasi**.
     **CV, firma, regular PT and BUMN/BUMDes** can no longer newly opt in.
- **Turnover limit:** gross turnover ≤ **Rp4,8 miliar** per tax year. Turnover counts business income **plus** pekerjaan bebas (professional) income, including income from abroad.
  - New anti-splitting rule: an individual's turnover is **combined** with the turnover of every PT Perorangan they founded. If the combined total exceeds Rp4,8 miliar in a year, the person and all their PT Perorangan lose the scheme for the following years. Transition: those already over the combined limit may stay on 0,5% until the end of tax year 2026 and lose it from 2027.
- **Time limits:**
  - OP and PT Perorangan: **no time limit** (Pasal 59, the old 7-year/4-year cap, was removed) as long as the conditions are met.
  - Koperasi: maximum **4 tax years** from registration. Koperasi registered before PP 20/2026 whose period expires between 2024 and 2029 can continue until 2029.
  - Transition for OP whose 7-year window ended in 2024: may use 0,5% for tax years 2025 and 2026. OP and PT Perorangan whose window ended in 2025: may use it for 2026. Because PP 20/2026 also removed the time limit, read this as continuing eligibility. **[UNVERIFIED: confirm with KPP how an OP whose window ended in 2024 is treated for 2027 onward — articles describe both "extension to 2026" and "no time limit".]**
  - CV, firma and PT already on the scheme: may continue **until their original period ends** (under PP 55/2022 that was 4 tax years for CV/firma/koperasi and 3 tax years for PT, counted from registration).
- **Rp500 juta exemption:** an **orang pribadi** pays no tax on the first **Rp500.000.000** of turnover each tax year. This was unchanged by PP 20/2026. It does **not** apply to PT Perorangan, koperasi, CV or PT.
- **Excluded income / persons:** income from pekerjaan bebas by professionals with special expertise is excluded, e.g. **doctors (dokter), dentists**, lawyers, accountants, notaries, architects, consultants, and (named in DJP material) influencers, content creators, selebgram, bloggers and vloggers. **Clinic implication:** a doctor's own practice income does **not** qualify; it uses normal Pasal 17 rates (an individual with turnover < Rp4,8 miliar may use the norma penghitungan / NPPN). A clinic run as a PT Perorangan selling non-professional goods and services may qualify **[UNVERIFIED: how a PT Perorangan clinic's medical-service turnover is treated — ask a konsultan]**.
- **Opting out:** a taxpayer may notify the KPP and switch to normal rates (bookkeeping required). After opting out it cannot return.
- **Payment:** self-pay by the **15th of the following month** using a kode billing (Coretax). If the buyer is a withholding agent, they withhold the 0,5% instead.

### 3.2 Worked examples

**(a) Bakery run by an individual (OP), turnover Rp75.000.000/month, Rp900 juta for the year.**

- January–June cumulative = Rp450 juta (≤ Rp500 juta) → **no tax**.
- July: cumulative Rp525 juta → taxable part = Rp25 juta × 0,5% = **Rp125.000**.
- August–December: Rp75 juta × 0,5% = **Rp375.000/month**.
- Total for the year = (900 − 500) juta × 0,5% = **Rp2.000.000**.

**(b) Same bakery as a PT Perorangan:** no Rp500 juta exemption → Rp75 juta × 0,5% = **Rp375.000 every month**, Rp4.500.000 for the year.

**(c) Retail shop CV founded in 2023:** under PP 55/2022 a CV had 4 tax years (2023–2026). Under PP 20/2026 it may finish that period (to the end of 2026) and must then use normal corporate rates from 2027 (PPh Badan 22%, with the Pasal 31E 50% reduction for turnover ≤ Rp50 miliar). Remind the owner that this means bookkeeping, PPh 25 installments and a different SPT. **[UNVERIFIED: confirm the CV's exact end year with KPP.]**

### Sources

- https://news.ddtc.co.id/berita/nasional/1819741/akhirnya-aturan-baru-soal-pph-final-umkm-05-persen-resmi-terbit
- https://news.ddtc.co.id/berita/nasional/1819765/ada-pp-baru-omzet-hingga-rp500-juta-bebas-pajak-masih-berlaku
- https://news.ddtc.co.id/berita/nasional/1819852/ada-transisi-bagi-op-dan-pt-perorangan-dengan-omzet-kumulatif-rp48-m
- https://www.pajak.go.id/en/node/119953 (DJP: eligible entities, excluded professions, koperasi 4 years)
- https://ortax.org/resmi-wp-op-dan-pt-perorangan-kini-bisa-pakai-tarif-0-5-persen-tanpa-batas-waktu
- https://ikpi.or.id/satu-orang-punya-banyak-perseroan-perorangan-omzetnya-kini-dihitung-gabungan/

---

## 4. PPN (Pajak Pertambahan Nilai / VAT)

### 4.1 Rate and DPP nilai lain (PMK 131/2024, from 1 Jan 2025, unchanged in 2026)

- The statutory rate is **12%** (UU HPP).
- **Luxury goods** (subject to PPnBM): PPN = 12% × harga jual (effective 12%; for sales to end consumers from 1 Feb 2025).
- **All other taxable goods/services:** PPN = 12% × **DPP nilai lain = 11/12 × harga jual / penggantian / nilai impor**, an effective **11%**.
- Status: the Finance Minister said in Dec 2025 and Feb 2026 that there was no plan to change the rate, and in Sep 2026 that a cut was not possible yet. **No change is in force as of Nov 2026.**

**Example:** a PKP supplier sells Rp10.000.000 of (non-luxury) packaging to a bakery.
DPP nilai lain = 11/12 × 10.000.000 = Rp9.166.667; PPN = 12% × 9.166.667 = **Rp1.100.000** (same as 11% × 10.000.000). The faktur shows both the harga jual and the DPP nilai lain.

### 4.2 PKP (Pengusaha Kena Pajak) registration

- **Threshold:** a business whose gross turnover from taxable supplies is **> Rp4,8 miliar in one tax/book year** must register to be confirmed (dikukuhkan) as PKP. Below that it is a pengusaha kecil and need not charge PPN, but may **voluntarily** register.
- Basis: the Rp4,8 miliar figure comes from PMK 197/2013. The reporting-deadline provisions were replaced by **PMK 164/2023**: register no later than the **end of the book year** in which turnover exceeds Rp4,8 miliar. The threshold was still Rp4,8 miliar in mid-2026.
- Once PKP: charge PPN, issue e-Faktur, credit input VAT (pajak masukan), file SPT Masa PPN monthly.
- Note the threshold coincides with the PPh Final UMKM ceiling. Crossing Rp4,8 miliar usually means **both** becoming PKP **and** leaving 0,5% final in the following year.
- Business owners who voluntarily become PKP for B2B reasons (customers want faktur) should understand the monthly compliance cost first.

### 4.3 Not charged / exempt — what matters for clinics, F&B and retail

- **Restaurant and café food and drink** (served on premises, catering): **not a PPN object** (UU PPN Pasal 4A(2)). Instead it is subject to the regional **PBJT makanan dan/atau minuman** (§8). A restaurant does not charge PPN on its menu.
- **Medical health services** (jasa pelayanan kesehatan medis): under UU HPP these were moved from "not a PPN object" to **"dibebaskan"** (exempt facility) under UU PPN Pasal 16B(1a)(j) and **PP 49/2022**. This covers doctors, specialists, dentists, midwives, nurses, health professionals, clinics, hospitals and laboratories, plus veterinary services.
  - **Medicines/products** sold during treatment are **not** covered: a PKP clinic charges PPN on medicines and products. Bill services and medicines separately.
  - **Aesthetic / beauty clinic services** (non-medical cosmetic treatments) are **not** in the exemption and are subject to PPN when the provider is PKP.
- **Basic necessities (barang kebutuhan pokok)** such as rice, corn, sago, soybeans, salt, meat, eggs, milk, fruit, vegetables, sugar for consumption etc.: PPN **dibebaskan** under PP 49/2022 as amended **[UNVERIFIED: full list and any 2025–2026 additions — check before quoting to a retailer]**.
- Other exempt services under PP 49/2022 include education, social services, public transport and some financial services; check the list for specific cases.
- "Dibebaskan" means no output PPN, **and the related input PPN cannot be credited**.

### 4.4 Faktur pajak under Coretax

- Faktur must be created at the moment the PPN is owed: at delivery of goods/services, or on receipt of payment if payment comes first (uang muka/termin get their own faktur).
- The e-Faktur module is inside Coretax. The **NSFP (serial number) is assigned automatically** on upload and DJP approval; the old e-Nofa request is gone (PER-11/PJ/2025).
- **Upload deadline: the 20th of the month after the faktur date** (PER-11/PJ/2025 Pasal 44(1); it was the 15th under PER-03/PJ/2022).
- Buyer identity: NPWP (16 digits) or NIK, plus the buyer's **NITKU**. A wrong buyer identity cannot be fixed with a pengganti (replacement); cancel and issue a new faktur.
- Retailers (pedagang eceran) selling to end consumers may issue simplified faktur (e.g. the cash receipt); retail VAT-refund stores use the Coretax e-Faktur module.
- **SPT Masa PPN:** pay and file by the **end of the month after** the tax period (PMK 81/2024).

### Sources

- https://www.pajak.go.id/en/node/113453 (PMK 131/2024)
- https://ortax.org/resmi-pmk-131-2024-atur-ppn-12-persen-hanya-untuk-barang-mewah
- https://www.cnbcindonesia.com/news/20260911053332-4-767063/ri-belum-bisa-pangkas-tarif-ppn-ini-alasan-purbaya
- https://kabar24.bisnis.com/read/20251215/15/1936891/purbaya-pastikan-tidak-ada-rencana-penyesuaian-ppn-pada-2026
- https://news.ddtc.co.id/literasi/kamus/1799307/apa-itu-pengusaha-kecil-dalam-konteks-ppn
- https://news.ddtc.co.id/pmk-baru-atur-waktu-pengusaha-wajib-lapor-untuk-dikukuhkan-sebagai-pkp-1799748
- https://news.ddtc.co.id/berita/nasional/44227/pp-492022-ini-daftar-jasa-kesehatan-yang-dibebaskan-dari-ppn
- https://news.ddtc.co.id/berita/nasional/1802956/jasa-pelayanan-rawat-jalan-bebas-ppn-obatnya-tidak-termasuk
- https://news.ddtc.co.id/berita/nasional/1796606/jasa-klinik-kecantikan-kena-ppn-begini-penjelasan-kring-pajak
- https://www.pajak.go.id/id/artikel/makan-di-restoran-tidak-kena-ppn
- https://pajakku.com/artikel/per-11pj2025-pokok-perubahan-faktur-pajak-dalam-coretax
- https://news.ddtc.co.id/berita/nasional/1811050/per-11pj2025-terbit-batas-upload-e-faktur-diundur-jadi-tanggal-20

---

## 5. Coretax DJP — what changed for businesses

- **Portal:** coretaxdjp.pajak.go.id. It replaced DJP Online, the e-Faktur desktop app, e-Bupot unifikasi/21 desktop, and e-Nofa. Live since 1 Jan 2025, with ongoing fixes through 2025. The SPT Tahunan for 2025 (filed in 2026) was mandatory through Coretax.
- **Identity:**
  - Residents use their **NIK (16 digits) as NPWP**; it must be validated and integrated. Badan use a **16-digit NPWP** (the old 15-digit format is retired for administration).
  - **NITKU** (Nomor Identitas Tempat Kegiatan Usaha) identifies each place of business (head office, branches) under one NPWP. It is the NPWP plus a 6-digit suffix, with 000000 for the main location **[UNVERIFIED: suffix convention per branch]**. NITKU is **required on every bukti potong and faktur**.
  - Branches no longer have their own NPWP; they appear as NITKU under the head office, which handles PPN centrally.
- **Payments:** kode billing created inside Coretax. **Deposit pajak** (prepaying a balance that Coretax draws from) is available.
- **e-Bupot (inside Coretax):** BPMP (monthly PPh 21 for pegawai tetap), BPA1 (annual employee bukti potong), BP21 (non-employees/others), BP26 (foreign individuals), **BPPU** (unified PPh 23/4(2)/15/22), BPNR (non-residents). The recipient sees them under "Bukti Potong Saya". The 16-digit NPWP/NIK and NITKU must be correct, or the bukti potong will not appear in the recipient's account.
- **SPT:** all SPT Masa (PPh 21/26, PPh Unifikasi, PPN) and SPT Tahunan are drafted (konsep) and submitted in Coretax. Many fields are prefilled from bukti potong and faktur, so bad counterparty data causes mismatches.
- **Formats:** PER-11/PJ/2025 (22 May 2025) sets the SPT, bukti potong and faktur formats for Coretax.
- **Access:** a business needs an authorised PIC (penanggung jawab), the director's NIK linked in the badan's Coretax profile, and a kode otorisasi / sertifikat elektronik to sign documents.

### Sources

- https://money.kompas.com/read/2026/03/04/162512726/cara-lapor-spt-tahunan-pribadi-2026-lewat-coretax-batas-akhir-31-maret
- https://news.ddtc.co.id/berita/nasional/1806242/ada-coretax-semua-bukti-potong-harus-cantumkan-nitku
- https://pajakku.com/artikel/memahami-e-bupot-di-coretax-fungsi-jenis-dan-menu-utamanya
- https://news.ddtc.co.id/berita/nasional/1821522/cari-bukti-potong-pph-di-coretax-begini-menu-dan-cara-unduhnya
- https://news.ddtc.co.id/berita/download-peraturan/1811170/aturan-baru-spt-hingga-faktur-pajak-era-coretax-download-di-sini

---

## 6. Deadlines and penalties

### 6.1 Monthly (PMK 81/2024, in force since 1 Jan 2025)

| Obligation                                          | Pay by                                        | File SPT Masa by                                                                                      |
| --------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| PPh 21/26 withheld                                  | **15th** of the following month               | **20th** of the following month                                                                       |
| PPh 23/26, PPh 4(2), PPh 15, PPh 22 (unifikasi)     | **15th**                                      | **20th**                                                                                              |
| PPh 25 (monthly installment, normal-rate taxpayers) | **15th**                                      | (no separate monthly SPT)                                                                             |
| PPh Final UMKM 0,5% (self-paid)                     | **15th**                                      | Payment validated with an NTPN generally counts as reporting **[UNVERIFIED under Coretax — confirm]** |
| Bea Meterai collected by a pemungut                 | **15th**                                      | **20th** **[UNVERIFIED filing date]**                                                                 |
| PPN/PPnBM (PKP)                                     | **end of the following month**, before filing | **end of the following month**                                                                        |
| e-Faktur upload                                     | —                                             | **20th** of the month after the faktur date                                                           |

**Holiday rule (PMK 81/2024 Pasal 100):** if the payment due date falls on a Saturday, Sunday, national holiday, election holiday or national cuti bersama, pay by the **next working day** without penalty. **[UNVERIFIED: whether the same applies to SPT filing dates — generally yes in practice; confirm.]**

### 6.2 Annual

| SPT Tahunan   | Deadline                                       | Pay PPh 29 (balance) |
| ------------- | ---------------------------------------------- | -------------------- |
| Orang pribadi | **31 March** (end of 3rd month after year-end) | before filing        |
| Badan         | **30 April** (end of 4th month)                | before filing        |

- An extension of up to 2 months is available by notification (UU KUP Pasal 3(4)).
- One-off 2026 relief for tax year 2025 because of the Coretax transition: OP fines waived if filed by 30 Apr 2026 (KEP-55/PJ/2026); badan fines and late-PPh-29 interest waived if filed/paid by 31 May 2026 (KEP-71/PJ/2026). **Do not assume this repeats.**

### 6.3 Penalties (UU KUP as amended by UU HPP)

- **Late filing fines (Pasal 7(1))**: SPT Masa PPN **Rp500.000**; other SPT Masa **Rp100.000**; SPT Tahunan badan **Rp1.000.000**; SPT Tahunan OP **Rp100.000**.
- **Late payment interest (Pasal 9(2a)/(2b))**: monthly rate set each month by KMK, times the unpaid tax, per month or part of a month, for at most 24 months. The rate is (reference interest rate + 5%) / 12.
- **KMK rates for 1–31 October 2026 (KMK 47/MK/EF.2/2026)**:
  - Pasal 19(1)–(3): 0,59%
  - **Pasal 8(2), 8(2a), 9(2a), 9(2b), 14(3): 1,01% per month** (late payment and pembetulan)
  - Pasal 8(5): 1,42%
  - Pasal 13(2), 13(2a): 1,84%
  - Pasal 13(3b): 2,26%
  - Imbalan bunga: 0,59%
  - **The November 2026 KMK had not been published on fiskal.kemenkeu.go.id at research time. Always look up the current month.**
- **Example:** PPh 21 of Rp1.000.000 for August 2026, due 15 Sep 2026, paid 20 Oct 2026 = 2 months (a part month counts as a full month). Interest ≈ 2 × 1,01% × 1.000.000 = **Rp20.200**, assuming the rate in force when the calculation starts is 1,01%, plus the Rp100.000 fine if the SPT Masa was also late. **[UNVERIFIED: which month's rate applies to a given delay — the KMK in force at the start of the calculation, per UU HPP; confirm.]**
- Not withholding at all, or withholding without paying it in, is far more serious: the tax becomes the withholder's own debt, and under the criminal provisions of UU KUP, withheld tax that is not paid in is a criminal matter.

### Sources

- https://pajakku.com/artikel/batas-waktu-bayar-dan-setor-pajak-terbaru-mulai-tahun-2025-sesuai-pmk-812024
- https://news.ddtc.co.id/berita/nasional/1818651/kapan-batas-waktu-bayar-dan-lapor-spt-masa-pph-21-begini-aturannya
- https://news.ddtc.co.id/review/konsultasi-coretax/1807263/tanggal-jatuh-tempo-penyetoran-pajak-berubah-kapan-mulai-berlaku
- https://news.ddtc.co.id/berita/nasional/1817311/jangan-lupa-15-februari-tanggal-merah-deadline-bayar-pajak-mundur
- https://ortax.org/jatuh-tempo-pembayaran-pajak-masa-menurut-pmk-81-2024
- https://www.pajakonline.com/tarif-bunga-sanksi-pajak-oktober-2026-turun-kemenkeu-tetapkan-tarif-hingga-2-26
- https://fiskal.kemenkeu.go.id/informasi-publik/kmk-tarif-bunga
- https://news.ddtc.co.id/berita/nasional/1818304/sanksi-telat-lapor-spt-op-dihapus-djp-jamin-tak-terbitkan-stp
- https://news.ddtc.co.id/berita/download-peraturan/1819126/sanksi-telat-lapor-spt-badan-dihapus-unduh-kepdirjennya-di-sini

---

## 7. Bea Meterai (UU 10/2020)

- **Rate:** a single **Rp10.000** per document (Pasal 5), since 1 Jan 2021, as a physical meterai tempel, an **e-Meterai** (bought from official distributors and applied to PDFs), or via a pemungut / computerised stamping.
- **Taxable documents (Pasal 3(2)):** surat perjanjian, surat keterangan/pernyataan and their copies; akta notaris; akta PPAT; surat berharga; dokumen transaksi surat berharga; dokumen lelang; and **documents stating an amount of money of more than Rp5.000.000** that acknowledge receipt of money or full/partial settlement of a debt (receipts/kuitansi, payment acknowledgements); plus other documents set by PP.
- **Threshold:** a money document of **Rp5.000.000 or less is not stamped**. Above Rp5.000.000 it is Rp10.000 regardless of amount.
- **Not taxed (Pasal 7):** e.g. cargo/shipping documents, diplomas, **salary/wage receipts**, government payment documents, Bank Indonesia documents, and others listed.
- **When owed (Pasal 8):** at signing (agreements), on completion (surat berharga), on delivery to the recipient (one-sided documents such as receipts), at filing as court evidence, or on first use in Indonesia (foreign documents).
- **Who owes it (Pasal 9):** for a one-sided document, the **party receiving** it; for a multi-party document, each party for its own copy (unless agreed otherwise); issuers for surat berharga.
- **Penalty (Pasal 17):** unpaid or underpaid duty plus **100%** administrative sanction.
- Stamp duty collected by a pemungut is paid by the 15th of the following month (PMK 81/2024).

**Example:** a catering client pays a bakery Rp7.500.000 and the bakery issues a kuitansi → Rp10.000 meterai. An invoice/receipt of Rp4.800.000 → no meterai.

### Sources

- https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_10_Tahun_2020
- https://pajakku.com/tax-guide/12127/UU/10-TAHUN-2020
- https://pajak.go.id/id/artikel/terbit-meterai-baru-simak-berikut-cara-penggunaannya

---

## 8. Regional taxes (pajak daerah) — UU 1/2022 (HKPD)

These are set and collected by the **pemerintah kabupaten/kota** under its own **Perda**. The law sets only maximums, so the actual rate and threshold depend on the city. Always tell the owner to check their local Bapenda.

### 8.1 PBJT makanan dan/atau minuman (formerly "pajak restoran" / PB1)

- **Object:** food and drink sold by **restaurants** (any place with tables/chairs/eating utensils: restaurants, cafés, warung with seating, kantin) and **jasa boga/catering**.
- **Excluded:** sellers whose turnover is **below the Perda threshold**; **toko swalayan** and similar shops that do not mainly sell food/drink; **food/beverage factories (pabrik)**; airport lounges.
  - A bakery that only sells take-away from a shop may fall under the factory/shop exclusions; one with a café seating area usually falls under PBJT **[UNVERIFIED — depends on Perda and facts]**.
- **Rate:** **max 10%** (each Perda sets the actual rate, often exactly 10%).
- **Base:** the amount actually paid by the customer (after discounts/vouchers). It is charged on top of the menu price and collected by the restaurant, which pays it to the Pemda and files the local return. Many cities require an online POS/tapping box.
- All Pemda had to switch to HKPD-based Perdas by **5 January 2024**.
- PBJT replaces PPN for restaurant meals; do not charge both.

**Example:** a café bill of Rp200.000 in a city with a 10% PBJT and a 5% service charge. The PBJT base is what the customer pays for food/drink. Whether the service charge is in the base depends on the Perda **[UNVERIFIED]**. Without the service charge: PBJT = **Rp20.000**.

### 8.2 PBB-P2 (land and building tax, urban/rural)

- **Max rate 0,5%** (UU HKPD Pasal 41(1)). **NJOPTKP at least Rp10.000.000** per taxpayer. The Pemda may apply an assessment ratio of 20%–100% of NJOP (the NJOP-based DPP) **[UNVERIFIED: exact ratio rules — check Perda]**.
- An annual SPPT is issued, usually payable by a due date set by the Pemda. The owner of the property pays; for a tenant, the lease contract decides.
- **Example:** a shop with NJOP Rp1.010.000.000, NJOPTKP Rp10.000.000, rate 0,2%, 100% ratio → (1.000.000.000) × 0,2% = **Rp2.000.000/year**.

### 8.3 Pajak reklame (signage/advertising)

- **Max rate 25%** of the nilai sewa reklame (rental value set by the Pemda). Shop signs, banners and billboards need a permit plus the tax. Many Pemdas exempt the business's **own name sign** below a certain size **[UNVERIFIED — Perda-specific]**.

### Sources

- https://ortax.org/pbjt-makanan-minuman
- https://news.ddtc.co.id/berita/nasional/1795791/pemda-punya-wewenang-atur-threshold-pajak-atas-makanan-dan-minuman
- https://www.pajak.go.id/id/artikel/makan-di-restoran-tidak-kena-ppn
- https://news.ddtc.co.id/berita/nasional/1800258/simak-lagi-begini-aturan-baru-pajak-pbb-p2-sesuai-uu-hkpd
- https://pajakku.com/artikel/uu-hkpd-terbit-tarif-maksimal-pbb-p2-naik

---

## 9. Common SMB mistakes and assistant guardrails

### 9.1 Common mistakes to watch for

1. **Assuming a CV/PT can still use 0,5%.** Since PP 20/2026, CV, firma and regular PT cannot newly use it, and existing ones lose it when their original period ends.
2. **Doctors and other professionals using 0,5%.** Professional practice income is excluded, so clinic owners who are doctors must separate practice fees from other business income.
3. **Forgetting the Rp500 juta exemption** (OP) and overpaying, or wrongly applying it to a PT Perorangan or company.
4. **Not combining turnover** across an individual and their PT Perorangan (new from PP 20/2026).
5. **Withholding PPh 21 with old methods** (the pre-2024 annualised method) instead of TER, or skipping the December recalculation.
6. **Ignoring PPh 21 for freelancers/mitra doctors** (bukan pegawai = 50% × gross × Pasal 17).
7. **Charging PPN as a non-PKP**, or a restaurant adding "PPN 11%" to the bill instead of PBJT.
8. **Clinics charging PPN on medical services** or **not** charging it on medicines and aesthetic treatments (when PKP).
9. **Missing the Rp4,8 miliar trigger** for PKP registration.
10. **Wrong NIK/NPWP/NITKU** on bukti potong or faktur, so the counterparty cannot see the credit in Coretax.
11. **Still using 10th/15th/20th dates from memory**: payment is by the 15th, most SPT Masa by the 20th, PPN at the end of the month.
12. **Missing meterai** on kuitansi/contracts above Rp5 juta, or putting meterai on small receipts unnecessarily.
13. **Online sellers surprised by the 0,5% marketplace deduction from 1 Nov 2026.** Sellers with turnover ≤ Rp500 juta should submit the surat pernyataan.
14. **Not claiming PPh 21 DTP** for eligible tourism/F&B staff in 2026, or depositing it to the state instead of paying it to the employee.

### 9.2 What an assistant must never do

- **Never file, pay, sign, or submit anything** (SPT, faktur, bukti potong, PKP registration, opt-in/opt-out letters) on the owner's behalf without explicit, specific consent for that exact action. Never ask for or store Coretax passwords, kode otorisasi, or sertifikat elektronik passphrases.
- **Never present a figure as certain** if it is marked [UNVERIFIED] here or might have changed. Say what the rule was as of the research date and ask the owner to confirm the current figure.
- **Never advise on hiding turnover, splitting a business to stay under Rp4,8 miliar** (PP 20/2026 targets firm splitting and bunching), backdating faktur, or not paying in withheld tax.
- **Always** tell the owner to verify with a **konsultan pajak** or their **KPP / Kring Pajak (1500200)** for: audits/SP2DK letters, restructuring (CV → PT), cross-border payments (PPh 26), natura/benefits, sector incentives, regional tax disputes, and anything with large amounts.
- **Always** state which entity type and PTKP status the answer assumes; the answer changes with them.
- For regional taxes, **always** say the rate and threshold depend on the local Perda.

---

## Likely to change / verify yearly

| Figure                                      | Current value (2026-11-01)                                                | Why it changes / where to check                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| PPN rate & DPP mechanism                    | 12%; DPP nilai lain 11/12 (effective 11%) for non-luxury                  | Minister has floated cuts; check PMK updates (pajak.go.id, jdih.kemenkeu.go.id)  |
| PKP threshold                               | Rp4,8 miliar/year                                                         | PMK; check yearly                                                                |
| PPh Final UMKM rate / ceiling / eligibility | 0,5%; Rp4,8 miliar; OP + PT Perorangan + koperasi                         | PP 20/2026 brand-new; implementing PMK may follow                                |
| UMKM OP exemption                           | Rp500 juta/year                                                           | PP 55/2022 as amended                                                            |
| Koperasi UMKM time limit                    | 4 years (legacy to 2029)                                                  | PP 20/2026                                                                       |
| CV/PT legacy 0,5% periods                   | CV 4 yrs, PT 3 yrs from registration                                      | PP 55/2022 transitional                                                          |
| PTKP                                        | Rp54 jt + 4,5 jt (K) + 4,5 jt/dependent (max 3)                           | PMK 101/2016; occasionally revised                                               |
| TER tables A/B/C, TER harian                | as in §1.3                                                                | PP 58/2023                                                                       |
| Pasal 17 layers                             | 5/15/25/30/35% at 60 jt/250 jt/500 jt/5 M                                 | UU HPP                                                                           |
| Biaya jabatan cap                           | 5%, max Rp6 jt/year                                                       | PMK 250/2008 / PMK 168/2023                                                      |
| PPh 21 DTP                                  | ≤ Rp10 jt/month, 5 sectors, Jan–Dec 2026                                  | PMK 105/2025 — **expires Dec 2026**; check for a 2027 PMK                        |
| Marketplace PPh 22                          | 0,5%, from 1 Nov 2026, 4 platforms                                        | PMK 37/2025; could be postponed or extended to more platforms                    |
| PPh 23 rates                                | 2% / 15%; +100% without NPWP                                              | UU PPh                                                                           |
| Rent PPh 4(2)                               | 10%                                                                       | PP 34/2017                                                                       |
| Construction PPh 4(2)                       | 1,75 / 2,65 / 3,5 / 4 / 6%                                                | PP 9/2022 — under evaluation                                                     |
| PPh Badan                                   | 22%; Pasal 31E 50% reduction for turnover ≤ Rp50 M                        | UU HPP                                                                           |
| Payment/filing deadlines                    | 15th / 20th / end of month; SPT Tahunan 31 Mar / 30 Apr                   | PMK 81/2024                                                                      |
| Late-filing fines                           | Rp500 rb (PPN masa), Rp100 rb (other masa), Rp1 jt (badan), Rp100 rb (OP) | UU KUP                                                                           |
| KMK interest rates                          | Oct 2026: 1,01% (Pasal 9(2a)) etc.                                        | **Changes every month** — fiskal.kemenkeu.go.id/informasi-publik/kmk-tarif-bunga |
| SPT sanction waivers                        | 2025 SPT only (KEP-55, KEP-71/PJ/2026)                                    | One-off; check each filing season                                                |
| e-Faktur upload deadline                    | 20th of the following month                                               | PER-11/PJ/2025                                                                   |
| Bea Meterai                                 | Rp10.000; > Rp5 juta threshold                                            | UU 10/2020                                                                       |
| PBJT makanan/minuman                        | max 10%; threshold per Perda                                              | Perda of each kab/kota                                                           |
| PBB-P2                                      | max 0,5%; NJOPTKP ≥ Rp10 juta; NJOP updated yearly                        | Perda / annual SPPT                                                              |
| Reklame                                     | max 25%                                                                   | Perda                                                                            |
| Import / bendahara PPh 22                   | 2,5% / 7,5% / 1,5% **[UNVERIFIED]**                                       | PMK 34/2017 as amended                                                           |
| PP 49/2022 exempt lists                     | medical services, basic goods, etc.                                       | PP amendments                                                                    |
