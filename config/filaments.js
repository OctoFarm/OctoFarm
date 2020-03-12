let filamentStore = {
  pla: {
    display: "PLA",
    density: "1.24"
  },
  abs: {
    display: "ABS",
    density: "1.04"
  },
  petg: {
    display: "PETG",
    density: "1.27"
  },
  nylon: {
    display: "NYLON",
    density: "1.52"
  },
  tpu: {
    display: "TPU",
    density: "1.21"
  },
  pc: {
    display: "Polycarbonate (PC)",
    density: "1.3"
  },
  wood: {
    display: "Wood Fill",
    density: "1.28"
  },
  wood: {
    display: "Carbon Fibre",
    density: "1.3"
  },
  pcabs: {
    display: "PC/ABS",
    density: "1.19"
  },
  hips: {
    display: "HIPS",
    density: "1.03"
  },
  pva: {
    display: "PVA",
    density: "1.23"
  },
  asa: {
    display: "ASA",
    density: "1.05"
  },
  pp: {
    display: "Polypropylene (PP)",
    density: "0.9"
  },
  acetal: {
    display: "Acetal (POM)",
    density: "1.4"
  },
  pmma: {
    display: "PMMA",
    density: "1.18"
  },
  fpe: {
    display: "Semi Flexible FPE",
    density: "2.16"
  }
};

let returnFilamentTypes = function() {
  return filamentStore;
};
exports.returnFilamentTypes = returnFilamentTypes;
