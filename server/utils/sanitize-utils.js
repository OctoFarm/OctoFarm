function sanitizeString(str) {
  str = str.replace(/[^a-z0-9áéíóúñü .,_-]/gim, "");
  return str.trim();
}

function cloneDeepAndStripFunctions(object) {
  return JSON.parse(JSON.stringify(object))
}

module.exports = {
  sanitizeString,
  cloneDeepAndStripFunctions
};
