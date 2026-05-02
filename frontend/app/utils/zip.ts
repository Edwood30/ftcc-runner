function crc32(buf: Uint8Array): number {
  const table = new Uint32Array(256).map((_, i) => {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c;
  });
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function dataURLToBytes(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1] ?? "";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function buildZip(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const entries: Array<{ name: Uint8Array; crc: number; size: number; offset: number; header: Uint8Array; data: Uint8Array }> = [];
  let offset = 0;
  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const header = new Uint8Array(30 + name.length);
    const dv = new DataView(header.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, file.data.length, true);
    dv.setUint32(22, file.data.length, true);
    dv.setUint16(26, name.length, true);
    header.set(name, 30);
    entries.push({ name, crc, size: file.data.length, offset, header, data: file.data });
    offset += header.length + file.data.length;
  }

  const parts: Uint8Array[] = [];
  for (const entry of entries) {
    parts.push(entry.header, entry.data);
  }

  const cdParts: Uint8Array[] = [];
  for (const entry of entries) {
    const cd = new Uint8Array(46 + entry.name.length);
    const dv = new DataView(cd.buffer);
    dv.setUint32(0, 0x02014b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 20, true);
    dv.setUint32(16, entry.crc, true);
    dv.setUint32(20, entry.size, true);
    dv.setUint32(24, entry.size, true);
    dv.setUint16(28, entry.name.length, true);
    dv.setUint32(42, entry.offset, true);
    cd.set(entry.name, 46);
    cdParts.push(cd);
    parts.push(cd);
  }
  const cdSize = cdParts.reduce((sum, item) => sum + item.length, 0);

  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, entries.length, true);
  edv.setUint16(10, entries.length, true);
  edv.setUint32(12, cdSize, true);
  edv.setUint32(16, offset, true);
  parts.push(eocd);

  const total = parts.reduce((sum, item) => sum + item.length, 0);
  const zip = new Uint8Array(total);
  let pos = 0;
  for (const item of parts) {
    zip.set(item, pos);
    pos += item.length;
  }
  return zip;
}

export function downloadZipBlob(zip: Uint8Array, fileName: string): void {
  const bytes = Uint8Array.from(zip);
  const blob = new Blob([bytes], { type: "application/zip" });
  downloadBlob(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataURL: string, fileName: string): void {
  const [header, base64 = ""] = dataURL.split(",");
  const mimeType = header.match(/data:(.*?);base64/)?.[1] ?? "application/octet-stream";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let index = 0; index < bin.length; index += 1) {
    bytes[index] = bin.charCodeAt(index);
  }
  downloadBlob(new Blob([bytes], { type: mimeType }), fileName);
}
