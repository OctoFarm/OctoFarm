const averageMeanOfArray = (array, decimals = undefined) => {
  const average = array.reduce((a, b) => a + b, 0) / array.length;
  if (typeof decimals !== "undefined") {
    return safeToFixed(average);
  }
  return average;
};

const safeToFixed = (number, decimals) => {
  return number?.toFixed(decimals) || number;
};

module.exports = {
  averageMeanOfArray
};
