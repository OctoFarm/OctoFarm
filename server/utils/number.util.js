module.exports = {
  floatOrZero: (n) => (isNaN(n) || !n ? 0 : parseFloat(n)),
  randomNumberBetween: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};
