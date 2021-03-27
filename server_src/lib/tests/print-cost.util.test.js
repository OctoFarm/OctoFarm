const {
  getPrintCost,
  noCostSettingsMessage,
} = require("../utils/print-cost.util");

const defaultCostSettings = {
  powerConsumption: 0.05,
  electricityCosts: 0.12,
  purchasePrice: 7.5,
  estimateLifespan: 3,
  maintenanceCosts: 3,
};
const examplePrintTime = 30;

describe("printCostUtil", function () {
  it("should return known message when costSetting is undefined", async function () {
    expect(getPrintCost(1, undefined)).toBe(noCostSettingsMessage);
  });
  it("should return known message when costSetting is null", async function () {
    expect(getPrintCost(1, null)).toBe(noCostSettingsMessage);
  });

  it('should return cost estimation "NaN" when powerConsumption is not in costSettings', async function () {
    expect(getPrintCost(1, {})).toBe(NaN.toString());
  });

  it("should return cost estimation when providing known printTime and costSettings", async function () {
    expect(getPrintCost(examplePrintTime, defaultCostSettings)).toBe("0.05");
  });

  it('should return string "0.00" when printTime is 0', async function () {
    expect(getPrintCost(0, defaultCostSettings)).toBe("0.00");
  });

  it('should return string "0.03" when estimateLifespan is falsy', async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: null,
    };
    expect(getPrintCost(examplePrintTime, costSettings)).toBe("0.03");
  });

  it('should return string "0.03" when estimateLifespan is zero', async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: "0.00",
    };
    expect(getPrintCost(examplePrintTime, costSettings)).toBe("0.03");
  });

  it("should tolerate illegal value estimateLifespan and return string \"0.04\"", async function () {
    const costSettings = {
      ...defaultCostSettings,
      estimateLifespan: "5.a5",
    };
    expect(getPrintCost(examplePrintTime, costSettings)).toBe("0.04");
  });
});
