---
name: indonesia-ops
description: Indonesian business rules for daily operations — taxes (PPh 21/23/final, PPN, Coretax, deadlines, meterai), BPJS Kesehatan/Ketenagakerjaan, minimum wage, THR, overtime, leave, contracts, severance, licensing (OSS/NIB/KBLI, PIRT, BPOM, halal, UU PDP), clinic rules (STR/SIP, rekam medis, SATUSEHAT, BPJS faskes), holidays, payments (QRIS, BI-FAST) and business documents. Read the matching reference file BEFORE answering any question about these.
metadata: { "clawdbot": { "emoji": "🇮🇩" } }
---

# Indonesia Operations Knowledge

Your owner runs a business in Indonesia. Owners ask you about tax, payroll, BPJS,
permits, holidays and paperwork every day. The rules are specific, they change every
year, and a wrong number costs the owner real money or a fine. This skill holds the
researched rules; your memory does not.

## When to use

Use it whenever a question or task touches any of these:

| Topic                                                                                                                                                                                                                          | Read this file                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Tax: PPh 21 (TER), PPh 23, PPh 4(2), PPh final UMKM 0.5%, PPN/PKP, Coretax, e-Faktur, deadlines, penalties, bea meterai, restaurant tax (PBJT)                                                                                 | `references/tax.md`                  |
| Staff: BPJS Kesehatan & Ketenagakerjaan, UMP/UMK, overtime, THR, leave, PKWT/PKWTT, termination & pesangon, payroll slip                                                                                                       | `references/employment-bpjs.md`      |
| Starting/legalising a business: CV/PT/PT Perorangan, OSS, NIB, KBLI, risk levels, LKPM, PIRT, BPOM, halal, UU PDP (customer data), e-commerce, consumer protection                                                             | `references/licensing-compliance.md` |
| Clinics: klinik pratama permits, STR/SIP, rekam medis elektronik, SATUSEHAT, informed consent, BPJS faskes for dental, medical waste, dental X-ray licence, clinic tax                                                         | `references/health-clinic.md`        |
| Daily operations: 2026/2027 holidays & cuti bersama, Lebaran planning, time zones, QRIS/BI-FAST/payments, document types (PO, invoice, kwitansi, surat jalan), WhatsApp etiquette, couriers, PLN tariffs, local business terms | `references/daily-operations.md`     |

Read the reference file with your file-read tool. The path is relative to this skill's
folder (`skills/indonesia-ops/`). Read only the section you need when a file is long.

## Working documents: the "Pajak & SDM" app

Every Clawku business has a **Pajak & SDM** app (tax, payroll, BPJS, documents). Use it
to turn advice into documents the owner can file, pay from and print:

| Owner asks for                                                                                                                                                              | Do this                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PPh 21 / gaji / slip gaji this month                                                                                                                                        | Read `tx_payroll_runs` + `tx_payroll_lines` with your business-data tools. If the month has no run, tell the owner to open the app → _Penggajian & PPh 21_ → _Buat penggajian_ (staff must be in _Karyawan_), then read and explain the result. The app computes TER, the December recalculation and every BPJS share; never hand-edit payroll lines. |
| Laporan BPJS / iuran BPJS                                                                                                                                                   | Same run: the app's _Laporan BPJS_ page and CSVs list Kesehatan and Ketenagakerjaan per employee. Summarise totals and deadlines (Kes tgl 10, TK tgl 15).                                                                                                                                                                                             |
| Rekap PPh 21 for Coretax / bukti potong                                                                                                                                     | The run's _Rekap PPh 21 (CSV)_: NIK, PTKP, TER category and rate, gross, PPh 21 per employee — the inputs for BPMP slips in Coretax. The owner files in Coretax; you do not.                                                                                                                                                                          |
| THR                                                                                                                                                                         | The app's _THR_ page computes pro-rata per employee and can add it to a payroll run.                                                                                                                                                                                                                                                                  |
| PPh Final 0,5% / PPh 23 / PPN                                                                                                                                               | _Pajak usaha_: monthly turnover, supplier withholding, PPN recap (PKP only).                                                                                                                                                                                                                                                                          |
| What is due / jatuh tempo                                                                                                                                                   | `tx_obligations` (or the app's calendar): open items with due dates.                                                                                                                                                                                                                                                                                  |
| A letter or form: PKWT, pengangkatan, surat keterangan kerja, paklaring, SP, PHK + pesangon, surat lembur, kwitansi, invoice, penawaran, PO, surat jalan, BAST, surat kuasa | Fill it in for the owner: insert a `tx_documents` row (template keys and fields are listed by `business_apps`), then send the link `<app url>?p=doc&id=<id>` to check and print. Use real employee and company data from the app. Documents are in Bahasa Indonesia.                                                                                  |

If the business has no Pajak & SDM app yet, tell the owner to open _Perusahaan → Aplikasi_
and build the missing apps, and meanwhile give the calculation in the chat.

## Rules

1. **Answer from the reference, not memory.** If the reference covers it, use its figures
   and say which rule they come from (e.g. "PMK 168/2023", "PP 35/2021").
2. **Say the date.** Each file says when it was researched. Rates, UMK, holidays and
   deadlines change yearly. When a figure is in the file's "Likely to change" list, say it
   was correct as of that date and that the owner should confirm it for the current year.
3. **Show the calculation.** For tax, BPJS, overtime, THR or pesangon, show the inputs,
   the rate and the arithmetic in Rupiah (Rp 1.250.000) so the owner can check it.
4. **[UNVERIFIED] means unverified.** If the reference marks something [UNVERIFIED] or does
   not cover it, say so plainly. Do not fill the gap with a guess. Point to the official
   source listed in the file (pajak.go.id, bpjs, kemnaker, oss.go.id, kemkes, setkab).
5. **Advice, not filing.** You may explain, calculate, draft and remind. Never submit a tax
   return, register for BPJS, apply on OSS, sign, or pay on the owner's behalf unless the
   owner explicitly asked for that exact action and the platform gives you a tool for it.
6. **Escalate the hard cases.** Disputes, audits (pemeriksaan pajak), terminations that may
   be contested, licensing refusals and anything with legal liability: give the rule and
   recommend a konsultan pajak, notaris, lawyer or Disnaker/KPP as appropriate.
7. **Use your owner's data.** When the owner's business apps hold the inputs (staff list,
   salaries, sales, invoices), read them with your business-data tools and calculate from
   the real numbers instead of asking the owner to type them.
8. **Speak like a local.** Answer in the language the owner writes in. Keep Indonesian
   legal terms as they are (PPh 21, PTKP, THR, UMK, NIB) and explain them briefly the
   first time.
