# LekhyaAI

## Current State
Invoice OCR scanner (OcrScanModal.tsx) runs Tesseract.js but has three critical parser bugs:
1. Invoice number regex requires `INV|BILL|TAX` prefix or a very specific format -- misses formats like `TYS426/25-26`
2. Total amount regex picks up the first "Total" label, which is often the subtotal, not the grand total
3. Line item regex requires the unit label ("Pcs") to appear twice in the row, which fails for most real invoice formats

After OCR completes, there is no step to add the scanned products to the Products catalog.

## Requested Changes (Diff)

### Add
- Product approval step (Step 4) in the OCR modal: after reviewing the invoice, show a list of all line items with HSN codes and let the user select which ones to add to the Products catalog
- Summary card in the product approval step showing invoice number, customer, total amount, and product count
- `NewProductFromScan` export type

### Modify
- Invoice number extraction: 7-pattern cascade from most to least specific, including `[A-Z]{2,5}\d{3,6}\/\d{2,4}-\d{2,4}` for formats like TYS426/25-26; filter out date-like strings
- Total amount extraction: collect all labeled totals (Grand Total, Invoice Total, Amount Chargeable, Total) and pick the maximum value as the grand total
- Line item regex: rewritten to 3-tier fallback: (1) full row with optional unit column, (2) simplified 6-column format, (3) HSN-anchored line scan
- `cleanNum()` helper added to strip commas, ₹, and whitespace from numbers
- CGST/SGST/IGST amount extraction: use `[^\n]*?` instead of `\s*\n?\s*` to handle amounts on the same line
- Bank account number regex: add `(?:No\.?|Number)` to avoid matching random numbers
- `onApprove` callback signature updated to `(data, newProducts) => Promise<void>`
- InvoicesPage `handleOcrApprove`: now accepts `NewProductFromScan[]`, creates each selected product in the catalog (skipping duplicates by HSN or name), passes customer `state` to `createCustomer`
- Review step "Approve" button replaced with "Next: Review Products" button

### Remove
- Nothing removed

## Implementation Plan
1. Rewrite `parseInvoiceText` in OcrScanModal with fixed regexes
2. Add `NewProductFromScan` interface and `products` step state
3. Add Step 4 UI (product selection table + summary card)
4. Update `onApprove` prop type and `handleOcrApprove` in InvoicesPage
5. Import `useCreateProduct` in InvoicesPage
