/**
 * Export utilities for CSV and PDF reports
 */

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  function escapeCell(v: string | number): string {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Print a specific DOM element as a PDF using an iframe.
 * This avoids the blank-page issue caused by React's app shell intercepting window.print().
 * A "Powered by LekhyaAI" footer is automatically appended.
 */
export function printElementAsPdf(elementId: string, title = "Report") {
  const source = document.getElementById(elementId);
  if (!source) {
    window.print();
    return;
  }

  // Collect all stylesheets from the current page
  const styleLinks: string[] = [];
  for (const link of Array.from(
    document.querySelectorAll('link[rel="stylesheet"]'),
  )) {
    styleLinks.push((link as HTMLLinkElement).outerHTML);
  }
  const inlineStyles: string[] = [];
  for (const style of Array.from(document.querySelectorAll("style"))) {
    inlineStyles.push(style.outerHTML);
  }

  const footerHtml = `
    <div style="
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      color: #6b7280;
    ">
      Powered by <strong style="color: #0f766e;">LekhyaAI</strong>
      &nbsp;•&nbsp; AI-Powered GST Accounting for India
      &nbsp;•&nbsp; Printed on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${styleLinks.join("\n")}
  ${inlineStyles.join("\n")}
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #111827;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .no-print { display: none !important; }
    button, .btn { display: none !important; }
  </style>
</head>
<body>
  ${source.outerHTML}
  ${footerHtml}
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for styles to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        // Clean up after print dialog closes
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 300);
  };
}

/** @deprecated Use printElementAsPdf instead */
export function printReport(printAreaId: string) {
  printElementAsPdf(printAreaId);
}
