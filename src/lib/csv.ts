/** @module src/lib/csv.ts */

export function escapeCsvField(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function rowsToCsv(headers: string[], rows: Record<string, string>[]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const lines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h] ?? "")).join(","),
  );
  return [headerLine, ...lines].join("\r\n");
}
