/* Minimal STORE-only (uncompressed) ZIP writer — no dependencies.
   JPEG/PNG payloads are already compressed, so deflate would buy nothing. */
(function (root) {
  'use strict';

  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosStamp(d) {
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const year = Math.max(1980, d.getFullYear());
    const date = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { time: time & 0xFFFF, date: date & 0xFFFF };
  }

  function utf8(str) {
    return new TextEncoder().encode(str);
  }

  /* entries: [{ name: string, data: Uint8Array }] -> array of Uint8Array parts */
  function zipParts(entries, when) {
    const { time, date } = dosStamp(when || new Date());
    const parts = [];
    const central = [];
    let offset = 0;

    for (const entry of entries) {
      const name = utf8(entry.name);
      const data = entry.data;
      const crc = crc32(data);

      const local = new Uint8Array(30 + name.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034B50, true);   // local file header signature
      lv.setUint16(4, 20, true);           // version needed
      lv.setUint16(6, 0x0800, true);       // flags: UTF-8 names
      lv.setUint16(8, 0, true);            // method: stored
      lv.setUint16(10, time, true);
      lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, data.length, true); // compressed size
      lv.setUint32(22, data.length, true); // uncompressed size
      lv.setUint16(26, name.length, true);
      lv.setUint16(28, 0, true);           // extra length
      local.set(name, 30);
      parts.push(local, data);

      const cd = new Uint8Array(46 + name.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014B50, true);   // central directory signature
      cv.setUint16(4, 20, true);           // version made by
      cv.setUint16(6, 20, true);           // version needed
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, time, true);
      cv.setUint16(14, date, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true);
      cv.setUint32(38, 0o644 << 16, true); // external attributes
      cv.setUint32(42, offset, true);      // local header offset
      cd.set(name, 46);
      central.push(cd);

      offset += local.length + data.length;
    }

    const cdSize = central.reduce((sum, c) => sum + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054B50, true);     // end of central directory
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    return parts.concat(central, [end]);
  }

  /* Total archive stays under the 4 GB / 65535-entry limits of plain ZIP;
     collage batches are nowhere near either, so no ZIP64 support. */
  function makeZip(entries, when) {
    return new Blob(zipParts(entries, when), { type: 'application/zip' });
  }

  root.makeZip = makeZip;
  root.zipParts = zipParts;
  root.crc32 = crc32;
  if (typeof module === 'object' && module.exports) module.exports = { makeZip, zipParts, crc32 };
})(typeof globalThis !== 'undefined' ? globalThis : this);
