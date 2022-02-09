const reA = /[^a-zA-Z]/g;
const reN = /[^0-9]/g;

export function sortAlphaNum(a, b) {
  const aA = a.replace(reA, "");
  const bA = b.replace(reA, "");
  if (aA === bA) {
    const aN = parseInt(a.replace(reN, ""), 10);
    const bN = parseInt(b.replace(reN, ""), 10);
    return aN === bN ? 0 : aN > bN ? 1 : -1;
  } else {
    return aA > bA ? 1 : -1;
  }
}
