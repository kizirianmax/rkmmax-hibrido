const ZIP_SIGNATURES = {
  localFileHeader: 0x04034b50,
  centralDirectoryHeader: 0x02014b50,
  endOfCentralDirectory: 0x06054b50,
};

const ZIP_VERSION = 20;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORE_METHOD = 0;
const ZIP_FIXED_DOS_TIME = 0;
const ZIP_FIXED_DOS_DATE = 0;

function encodeUtf8(text) {
  if (typeof TextEncoder === 'function') {
    return new TextEncoder().encode(text);
  }

  const encoded = unescape(encodeURIComponent(text));
  const out = new Uint8Array(encoded.length);
  for (let index = 0; index < encoded.length; index += 1) {
    out[index] = encoded.charCodeAt(index);
  }
  return out;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function computeCrc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(view, offset, value) {
  view.setUint16(offset, value, true);
}

function writeU32(view, offset, value) {
  view.setUint32(offset, value >>> 0, true);
}

function concatChunks(chunks, totalLength) {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

function toSortedEntries(filesMap) {
  const files = filesMap && typeof filesMap === 'object' ? filesMap : {};
  return Object.keys(files)
    .sort((a, b) => a.localeCompare(b))
    .map((path) => ({ path, content: files[path] }));
}

export function buildZipBytesFromTextFiles(filesMap) {
  const entries = toSortedEntries(filesMap);

  const localChunks = [];
  const centralChunks = [];
  let localOffset = 0;
  let centralLength = 0;

  entries.forEach(({ path, content }) => {
    if (typeof path !== 'string' || path.length === 0) {
      throw new Error('invalid-zip-entry-path');
    }
    if (typeof content !== 'string') {
      throw new Error(`invalid-zip-entry-content:${path}`);
    }

    const nameBytes = encodeUtf8(path);
    const dataBytes = encodeUtf8(content);
    const crc32 = computeCrc32(dataBytes);

    const localHeader = new Uint8Array(30);
    const localHeaderView = new DataView(localHeader.buffer);
    writeU32(localHeaderView, 0, ZIP_SIGNATURES.localFileHeader);
    writeU16(localHeaderView, 4, ZIP_VERSION);
    writeU16(localHeaderView, 6, ZIP_UTF8_FLAG);
    writeU16(localHeaderView, 8, ZIP_STORE_METHOD);
    writeU16(localHeaderView, 10, ZIP_FIXED_DOS_TIME);
    writeU16(localHeaderView, 12, ZIP_FIXED_DOS_DATE);
    writeU32(localHeaderView, 14, crc32);
    writeU32(localHeaderView, 18, dataBytes.length);
    writeU32(localHeaderView, 22, dataBytes.length);
    writeU16(localHeaderView, 26, nameBytes.length);
    writeU16(localHeaderView, 28, 0);

    localChunks.push(localHeader, nameBytes, dataBytes);
    const localSize = localHeader.length + nameBytes.length + dataBytes.length;

    const centralHeader = new Uint8Array(46);
    const centralHeaderView = new DataView(centralHeader.buffer);
    writeU32(centralHeaderView, 0, ZIP_SIGNATURES.centralDirectoryHeader);
    writeU16(centralHeaderView, 4, ZIP_VERSION);
    writeU16(centralHeaderView, 6, ZIP_VERSION);
    writeU16(centralHeaderView, 8, ZIP_UTF8_FLAG);
    writeU16(centralHeaderView, 10, ZIP_STORE_METHOD);
    writeU16(centralHeaderView, 12, ZIP_FIXED_DOS_TIME);
    writeU16(centralHeaderView, 14, ZIP_FIXED_DOS_DATE);
    writeU32(centralHeaderView, 16, crc32);
    writeU32(centralHeaderView, 20, dataBytes.length);
    writeU32(centralHeaderView, 24, dataBytes.length);
    writeU16(centralHeaderView, 28, nameBytes.length);
    writeU16(centralHeaderView, 30, 0);
    writeU16(centralHeaderView, 32, 0);
    writeU16(centralHeaderView, 34, 0);
    writeU16(centralHeaderView, 36, 0);
    writeU32(centralHeaderView, 38, 0);
    writeU32(centralHeaderView, 42, localOffset);

    centralChunks.push(centralHeader, nameBytes);
    centralLength += centralHeader.length + nameBytes.length;
    localOffset += localSize;
  });

  const endOfCentralDirectory = new Uint8Array(22);
  const endOfCentralDirectoryView = new DataView(endOfCentralDirectory.buffer);
  writeU32(endOfCentralDirectoryView, 0, ZIP_SIGNATURES.endOfCentralDirectory);
  writeU16(endOfCentralDirectoryView, 4, 0);
  writeU16(endOfCentralDirectoryView, 6, 0);
  writeU16(endOfCentralDirectoryView, 8, entries.length);
  writeU16(endOfCentralDirectoryView, 10, entries.length);
  writeU32(endOfCentralDirectoryView, 12, centralLength);
  writeU32(endOfCentralDirectoryView, 16, localOffset);
  writeU16(endOfCentralDirectoryView, 20, 0);

  const totalLength = localOffset + centralLength + endOfCentralDirectory.length;
  return concatChunks([...localChunks, ...centralChunks, endOfCentralDirectory], totalLength);
}

export function buildZipBlobFromTextFiles(filesMap) {
  const zipBytes = buildZipBytesFromTextFiles(filesMap);
  return new Blob([zipBytes], { type: 'application/zip' });
}
