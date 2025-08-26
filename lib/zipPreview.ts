

type Entry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  method: number;              
  encrypted: boolean;
  isDirectory: boolean;
  compressionRatio: number | null; 
};

type Preview = {
  entries: Entry[];
  totals: {
    files: number;
    dirs: number;
    compressed: number;
    uncompressed: number;
    overallRatio: number | null; 
  };
  suspicious: {
    highExpansionEntries: { name: string; ratio: number; uncompressedSize: number; compressedSize: number }[];
    highOverallExpansion: boolean;
  };
};

function readU16(buf: Buffer, off: number) { return buf.readUInt16LE(off); }
function readU32(buf: Buffer, off: number) { return buf.readUInt32LE(off); }

function findEOCD(buf: Buffer) {
  const sig = 0x06054b50;
  const minEOCD = 22;                     
  const maxComment = 0xffff;              
  const start = Math.max(0, buf.length - (minEOCD + maxComment));

  for (let i = buf.length - minEOCD; i >= start; i--) {
    if (readU32(buf, i) === sig) {
      const disk = readU16(buf, i + 4);
      const cdDisk = readU16(buf, i + 6);
      const entriesOnDisk = readU16(buf, i + 8);
      const entriesTotal = readU16(buf, i + 10);
      const cdSize = readU32(buf, i + 12);
      const cdOffset = readU32(buf, i + 14);
      const commentLen = readU16(buf, i + 20);
      return { disk, cdDisk, entriesOnDisk, entriesTotal, cdSize, cdOffset, commentLen, eocdOffset: i };
    }
  }
  return null;
}


export function previewZipCentralDirectory(buf: Buffer, opts?: { maxEntries?: number }): Preview | null {
  const eocd = findEOCD(buf);
  if (!eocd) return null;

  const sigCD = 0x02014b50;
  const entries: Entry[] = [];
  let off = eocd.cdOffset;
  const limit = opts?.maxEntries ?? eocd.entriesTotal;

  for (let n = 0; n < eocd.entriesTotal && n < limit; n++) {
    if (off + 46 > buf.length) break;
    if (readU32(buf, off) !== sigCD) break;

    const _versionMadeBy = readU16(buf, off + 4);
    const _versionNeeded = readU16(buf, off + 6);
    const gpFlag = readU16(buf, off + 8);
    const method = readU16(buf, off + 10);
    const _time = readU16(buf, off + 12);
    const _date = readU16(buf, off + 14);
    const _crc = readU32(buf, off + 16);
    const compSize = readU32(buf, off + 20);
    const uncompSize = readU32(buf, off + 24);
    const nameLen = readU16(buf, off + 28);
    const extraLen = readU16(buf, off + 30);
    const commentLen = readU16(buf, off + 32);


    const nameStart = off + 46;
    const nameEnd = nameStart + nameLen;
    const name = buf.subarray(nameStart, nameEnd).toString('utf8');

    const isDir = name.endsWith('/');
    const encrypted = (gpFlag & 0x0001) === 0x0001;

    let ratio: number | null = null;
    if (uncompSize > 0) {
      ratio = 1 - compSize / uncompSize; 
    }

    entries.push({
      name,
      compressedSize: compSize,
      uncompressedSize: uncompSize,
      method,
      encrypted,
      isDirectory: isDir,
      compressionRatio: ratio,
    });

    off = nameEnd + extraLen + commentLen;
  }

  const files = entries.filter(e => !e.isDirectory);
  const dirs = entries.length - files.length;

  const compressed = files.reduce((a, e) => a + e.compressedSize, 0);
  const uncompressed = files.reduce((a, e) => a + e.uncompressedSize, 0);
  const overallRatio = uncompressed > 0 ? 1 - compressed / uncompressed : null;

  const highExpansionEntries = files
    .filter(e => e.uncompressedSize > 0 && (e.uncompressedSize / Math.max(1, e.compressedSize)) >= 50) 
    .map(e => ({
      name: e.name,
      ratio: e.uncompressedSize / Math.max(1, e.compressedSize),
      uncompressedSize: e.uncompressedSize,
      compressedSize: e.compressedSize
    }));

  const highOverallExpansion = uncompressed > 0 && (uncompressed / Math.max(1, compressed)) >= 100; 

  return {
    entries,
    totals: { files: files.length, dirs, compressed, uncompressed, overallRatio },
    suspicious: { highExpansionEntries, highOverallExpansion }
  };
}
