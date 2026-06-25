// XLSX Parser - Basic detection and CSV fallback prompt
// XLSX files are ZIP archives containing XML files
// Without external libraries, we provide basic detection and guide users to use CSV
const XLSXParser = {
  async parse(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for ZIP signature (PK..)
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      // This is a ZIP file (likely XLSX)
      try {
        return await this.parseXLSX(buffer);
      } catch (e) {
        alert(
          'File Excel (.xlsx) terdeteksi. Untuk hasil terbaik, silakan:\n\n' +
          '1. Buka file di Microsoft Excel atau Google Sheets\n' +
          '2. Simpan sebagai CSV (File > Save As > CSV)\n' +
          '3. Upload file CSV tersebut\n\n' +
          'Atau gunakan format CSV sejak awal untuk import data.'
        );
        return null;
      }
    }

    alert('Format file tidak dikenali. Silakan gunakan file CSV.');
    return null;
  },

  async parseXLSX(buffer) {
    // Basic XLSX parser using ZIP structure
    // XLSX = ZIP containing xl/sharedStrings.xml and xl/worksheets/sheet1.xml
    const files = await this.unzip(buffer);
    
    if (!files) {
      throw new Error('Cannot parse ZIP structure');
    }

    // Warn user if some entries were skipped during decompression
    if (this._lastSkippedEntries > 0) {
      alert(
        'Peringatan: ' + this._lastSkippedEntries + ' bagian file tidak dapat dibaca.\n' +
        'Data yang ditampilkan mungkin tidak lengkap.\n\n' +
        'Untuk hasil terbaik, simpan file sebagai CSV sebelum import.'
      );
    }

    // Get shared strings
    const sharedStrings = this.parseSharedStrings(files['xl/sharedStrings.xml'] || '');
    
    // Get first sheet
    const sheetXml = files['xl/worksheets/sheet1.xml'] || '';
    if (!sheetXml) throw new Error('No sheet found');

    return this.parseSheet(sheetXml, sharedStrings);
  },

  async unzip(buffer) {
    const bytes = new Uint8Array(buffer);
    const files = {};
    let offset = 0;
    let skippedEntries = 0;

    try {
      while (offset < bytes.length - 4) {
        // Look for local file header signature
        if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4B ||
            bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
          break;
        }

        const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);
        const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | 
                              (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
        const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) |
                                (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
        const fileNameLength = bytes[offset + 26] | (bytes[offset + 27] << 8);
        const extraLength = bytes[offset + 28] | (bytes[offset + 29] << 8);

        const fileName = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + fileNameLength));
        const dataStart = offset + 30 + fileNameLength + extraLength;
        const dataEnd = dataStart + compressedSize;

        if (compressionMethod === 0) {
          // Stored (not compressed)
          const content = new TextDecoder().decode(bytes.slice(dataStart, dataEnd));
          files[fileName] = content;
        } else if (compressionMethod === 8) {
          // Deflate - try using DecompressionStream if available
          try {
            const compressed = bytes.slice(dataStart, dataEnd);
            const rawStream = new Blob([compressed]).stream();
            const decompressed = rawStream.pipeThrough(new DecompressionStream('raw'));
            const reader = decompressed.getReader();
            const chunks = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let pos = 0;
            for (const chunk of chunks) {
              result.set(chunk, pos);
              pos += chunk.length;
            }
            files[fileName] = new TextDecoder().decode(result);
          } catch (e) {
            // Skip files we cannot decompress
            skippedEntries++;
          }
        } else {
          skippedEntries++;
        }

        offset = dataEnd;
      }
    } catch (e) {
      return null;
    }

    if (skippedEntries > 0) {
      console.warn(`XLSX parser: ${skippedEntries} ZIP entries could not be decompressed and were skipped.`);
      this._lastSkippedEntries = skippedEntries;
    } else {
      this._lastSkippedEntries = 0;
    }

    return Object.keys(files).length > 0 ? files : null;
  },

  parseSharedStrings(xml) {
    const strings = [];
    const regex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      strings.push(this.decodeXMLEntities(match[1]));
    }
    return strings;
  },

  parseSheet(xml, sharedStrings) {
    const rows = [];
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    const cellRegex = /<c\s+r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?/g;
    
    let rowMatch;
    while ((rowMatch = rowRegex.exec(xml)) !== null) {
      const rowContent = rowMatch[1];
      const cells = {};
      let cellMatch;
      const localCellRegex = /<c\s+r="([A-Z]+)(\d+)"[^>]*?(?: t="([^"]*)")?[^>]*?>(?:[\s\S]*?<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g;
      
      while ((cellMatch = localCellRegex.exec(rowContent)) !== null) {
        const col = cellMatch[1];
        const type = cellMatch[3];
        const value = cellMatch[4] || '';
        
        let cellValue = value;
        if (type === 's' && sharedStrings.length > 0) {
          const idx = parseInt(value);
          cellValue = sharedStrings[idx] || '';
        }
        
        const colIndex = this.colToIndex(col);
        cells[colIndex] = cellValue;
      }
      rows.push(cells);
    }

    if (rows.length < 2) return [];

    // First row is headers
    const headers = {};
    const maxCol = Math.max(...rows.map(r => Math.max(...Object.keys(r).map(Number), 0)));
    
    for (let c = 0; c <= maxCol; c++) {
      headers[c] = (rows[0][c] || `Column${c}`).toString().trim();
    }

    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const obj = {};
      let hasData = false;
      for (let c = 0; c <= maxCol; c++) {
        const val = (rows[i][c] || '').toString().trim();
        obj[headers[c]] = val;
        if (val) hasData = true;
      }
      if (hasData) data.push(obj);
    }

    return data;
  },

  colToIndex(col) {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 64);
    }
    return index - 1;
  },

  decodeXMLEntities(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
};
