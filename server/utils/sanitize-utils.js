function sanitizeString(str) {
  str = str.replace(/[^a-z0-9áéíóúñü .,_-]/gim, "");
  return str.trim();
}

module.exports = {
  sanitizeString
};
