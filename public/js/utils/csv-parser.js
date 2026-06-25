// Custom CSV Parser - handles quoted fields, commas within quotes, newlines, UTF-8 BOM
// Supports both comma and semicolon delimiters (auto-detected)
const CSVParser = {
  parse(text) {
    // Remove UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.substring(1);
    }

    // Detect delimiter from the first line (header)
    const delimiter = this.detectDelimiter(text);

    const rows = this.parseRows(text, delimiter);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim());
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) continue;

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = (row[j] || '').trim();
      }
      data.push(obj);
    }

    return data;
  },

  detectDelimiter(text) {
    // Look at the first line to determine delimiter
    const firstLineEnd = text.indexOf('\n');
    const firstLine = firstLineEnd >= 0 ? text.substring(0, firstLineEnd) : text;

    // Count commas and semicolons outside of quotes
    let commas = 0;
    let semicolons = 0;
    let inQuotes = false;

    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (ch === ',') commas++;
        else if (ch === ';') semicolons++;
      }
    }

    // Use semicolons if they outnumber commas (common in Indonesian/European locale exports)
    return semicolons > commas ? ';' : ',';
  },

  parseRows(text, delimiter) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      if (inQuotes) {
        if (char === '"') {
          // Check for escaped quote
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentField += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          currentField += char;
          i++;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
        } else if (char === delimiter) {
          currentRow.push(currentField);
          currentField = '';
          i++;
        } else if (char === '\r') {
          // Handle CRLF
          if (i + 1 < text.length && text[i + 1] === '\n') {
            i++;
          }
          currentRow.push(currentField);
          currentField = '';
          rows.push(currentRow);
          currentRow = [];
          i++;
        } else if (char === '\n') {
          currentRow.push(currentField);
          currentField = '';
          rows.push(currentRow);
          currentRow = [];
          i++;
        } else {
          currentField += char;
          i++;
        }
      }
    }

    // Handle last field/row
    if (currentField !== '' || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  }
};
