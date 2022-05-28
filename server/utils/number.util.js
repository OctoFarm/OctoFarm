module.exports = {
  floatOrZero: (n) => (isNaN(n) || !n ? 0 : parseFloat(n)),
  randomNumberBetween: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
  randomElevenDigitNumber: (min, max) => Math.floor(10000000000 + Math.random() * 90000000000)
};
