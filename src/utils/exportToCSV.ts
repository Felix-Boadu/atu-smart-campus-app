export function exportToCSV(data: any[], headers: string[], filename: string) {
  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  // 1. Create the header row
  const csvRows = [];
  csvRows.push(headers.join(','));

  // 2. Format the data rows (escaping quotes and commas)
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // 3. Create the Blob and trigger download
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}