export const makeElementIdFromString = (string) => {
  return string.replace(/:/g, "-").replace(/\//g, "").replace(/\./g, "-");
};
