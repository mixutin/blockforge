// Client-side QR codes (no external service): qrcode-generator (MIT) builds the matrix, we draw it on a canvas
// in Kindlr colours with a quiet zone so phone cameras read it reliably.
import qrcode from 'qrcode-generator';
export function qrMatrix(text, ecc = 'M') {
  const qr = qrcode(0, ecc); qr.addData(text, 'Byte'); qr.make();
  const n = qr.getModuleCount(); const rows = [];
  for (let r = 0; r < n; r++) { const row = []; for (let c = 0; c < n; c++) row.push(qr.isDark(r, c)); rows.push(row); }
  return rows;
}
export function qrCanvas(text, { size = 220, dark = '#1d1a2e', light = '#ffffff', quiet = 4 } = {}) {
  const m = qrMatrix(text); const n = m.length + quiet * 2;
  const scale = Math.max(2, Math.floor(size / n)); const px = n * scale;
  const cv = document.createElement('canvas'); cv.width = cv.height = px; cv.className = 'qr';
  const g = cv.getContext('2d'); g.fillStyle = light; g.fillRect(0, 0, px, px); g.fillStyle = dark;
  m.forEach((row, r) => row.forEach((on, c) => { if (on) g.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale); }));
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'QR code for ' + text);
  return cv;
}
