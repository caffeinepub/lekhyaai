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

export function printReport(printAreaId: string) {
  const style = document.getElementById("print-style");
  if (!style) {
    const s = document.createElement("style");
    s.id = "print-style";
    s.textContent = `
      @media print {
        body > * { display: none !important; }
        #${printAreaId} { display: block !important; position: static !important; }
        #${printAreaId} * { display: revert !important; }
        nav, header, aside, footer { display: none !important; }
      }
    `;
    document.head.appendChild(s);
  }
  window.print();
}
