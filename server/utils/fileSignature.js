// server/utils/fileSignature.js
//
// multer only sees the Content-Type header the client claims. Check the first
// bytes of the file too, so a renamed .exe / .html cannot be stored and later
// served back as a "PDF".

const SIGNATURES = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/jpg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
  'application/msword': [[0xd0, 0xcf, 0x11, 0xe0]], // legacy OLE container
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04], // zip
  ],
};

const matchesDeclaredType = (buffer, mimetype) => {
  const options = SIGNATURES[mimetype];
  if (!options || !buffer || buffer.length < 4) return false;
  return options.some((sig) => sig.every((byte, i) => buffer[i] === byte));
};

module.exports = { matchesDeclaredType };
