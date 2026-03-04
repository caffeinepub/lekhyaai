# LekhyaAI

## Current State
- OcrScanModal.tsx handles OCR scanning with Tesseract.js
- Item parsing uses 3 regex patterns + fallback; multi-product invoices are often dropped or merged into 1 row
- "Amount in Words" and "Tax Amount in Words" are static text inputs — user must type them manually
- `three`, `@react-three/fiber`, `@react-three/cannon`, `@react-three/drei`, `@types/three`, `react-quill-new` are still in package.json causing unnecessary bundle weight

## Requested Changes (Diff)

### Add
- `amountToWordsIN(n: number): string` utility function in `formatINR.ts` — converts any number to Indian number-system words (crore, lakh, thousand, hundred) with "Only" suffix. Example: 104160 → "One Lakh Four Thousand One Hundred Sixty Rupees Only"
- `taxAmountToWordsIN` convenience wrapper (just calls amountToWordsIN with GST total)
- Auto-compute "Amount in Words" field in OcrScanModal when totalAmount changes
- Auto-compute "Tax Amount in Words" when cgstAmount/sgstAmount/igstAmount change
- Show computed words as read-only display below the editable total field (still allow manual override)
- Same auto-words in the CreateInvoiceModal "Totals" section — display below the grand total line

### Modify
- **OCR line item parsing** — complete rewrite of `parseInvoiceText` item parsing logic:
  - Use a wider table-region scan: detect header row by looking for keywords (Description, HSN, Qty, Rate, Amount) and scan all lines below it until a totals keyword
  - For each line in the table region: try to extract Sr.No, product name, HSN (4-8 digits), qty, unit, rate, discount, GST rate, amount using a more lenient regex that allows varied column ordering
  - Parse items one-by-one per line (not as a single global regex with offset issues)
  - If a line has an HSN code but no rate/amount visible, still create an item row so no product is silently dropped
  - After parsing, deduplicate items by (productName + hsnSac) to avoid double-entries
  - Remove the 15-item cap (`items.slice(0, 15)`) — capture all items
  - Do NOT reset gstRate to detectedGstRate if the individual item already has a non-default rate extracted
- **Package cleanup** — remove from `package.json` dependencies: `three`, `@react-three/fiber`, `@react-three/cannon`, `@react-three/drei`, `react-quill-new`; remove from devDependencies: `@types/three`

### Remove
- Nothing additional

## Implementation Plan
1. Add `amountToWordsIN(n: number): string` to `src/frontend/src/utils/formatINR.ts`
2. In `OcrScanModal.tsx` Totals tab: auto-populate amountInWords and taxAmountInWords when the total/tax values change (computed display + manual override allowed)
3. In `OcrScanModal.tsx` `parseInvoiceText`: rewrite item parsing to a line-by-line approach that correctly captures all products
4. In `InvoicesPage.tsx` CreateInvoiceModal: show auto-computed Indian number words below the grand total
5. Clean `package.json` — remove unused 3D + quill packages
6. Typecheck and lint
