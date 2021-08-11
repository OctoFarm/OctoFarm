jest.mock("../../../server_src/services/history.service");
const { noCostSettingsMessage } = require("../../../server_src/utils/print-cost.util");
const { isPromise } = require("jest-util");

const illegalHistoryCache = [{ printHistory2: null }];
const emptyLegalHistoryCache = [{ printHistory: {} }];
const realisticHistoryCache = require("./mock-data/Histories.json");
const { configureContainer } = require("../../../server_src/container");
const DITokens = require("../../../server_src/container.tokens");
const { assignYCumSum } = require("../../../server_src/utils/graph-point.utils");
const {
  processHistorySpools,
  calcSpoolWeightAsString
} = require("../../../server_src/utils/spool.utils");
const { legacyGetFile } = require("./history-cache-legacy");
const interestingButWeirdHistoryCache = [
  {
    printHistory: {
      historyIndex: 0, // No historyIndex means big problem, but deferred... ouch
      state: "pfff im ok", // No state means errpr
      totalLength: 1,
      filamentSelection: {
        spools: {
          profile: {
            diameter: 5,
            density: 3
          }
        }
      },
      job: {
        filament: "pla"
      },
      spools: {
        pla: {
          type: "pla"
        }
      }
    }
  }
];

const nullJobHistoryCache = [
  {
    printHistory: {
      job: null
    }
  },
  {
    printHistory: {
      success: true,
      job: null
    }
  }
];

function legacyConvertIncremental(input) {
  let usageWeightCalc = 0;
  let newObj = [];
  for (let i = 0; i < input.length; i++) {
    if (typeof newObj[i - 1] !== "undefined") {
      usageWeightCalc = newObj[i - 1].y + input[i].y;
    } else {
      usageWeightCalc = input[i].y;
    }
    newObj.push({ x: input[i].x, y: usageWeightCalc });
  }
  return newObj;
}

let container;
let historyCache;
let mockHistoryService;

beforeEach(() => {
  if (container) container.dispose();
  container = configureContainer();
  historyCache = container.resolve(DITokens.historyCache);
  mockHistoryService = container.resolve(DITokens.historyService);

  mockHistoryService.resetMockData();

  /*eslint no-extend-native: "off"*/
  Date.prototype.getTimezoneOffset = jest.fn(() => 0);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("History-Cache", () => {
  Date.now = () => 1618059562000;
  process.env.TZ = "UTC";

  it("should initiate and finish within 5 sec for empty history", async () => {
    expect(await mockHistoryService.find({})).toHaveLength(0);

    await historyCache.initCache();
    const { stats, history } = historyCache.getHistoryCache();

    expect(stats).toBeTruthy();
    expect(history).toBeTruthy();
    expect(history).toHaveLength(0);
  });

  it("should initiate and finish within 5 sec for non-empty history", async () => {
    // Mock only function
    mockHistoryService.saveMockData(emptyLegalHistoryCache);
    expect(await mockHistoryService.find({})).toStrictEqual(emptyLegalHistoryCache);

    await historyCache.initCache();

    const { history, stats } = historyCache.getHistoryCache();
    expect(history[0].path).toBeUndefined();
    expect(legacyGetFile({}).path).toBeUndefined();
    expect(stats).toBeTruthy();
  });

  it("should initiate and finish within 5 sec for realistic history", async () => {
    // Mock only function
    mockHistoryService.saveMockData(realisticHistoryCache);

    expect(await mockHistoryService.find({})).toStrictEqual(realisticHistoryCache);

    await historyCache.initCache();

    const { history } = historyCache.getHistoryCache();
    expect(history.length).toEqual(realisticHistoryCache.length);
    history.forEach((h) => {
      expect(h.printer).toContain("PRINTER");
      expect(h.notes).not.toBeUndefined();
      // TODO ... jeez
      // expect(Date.parse(h.startDate)).not.toBeNaN();
      // expect(Date.parse(h.endDate)).not.toBeNaN();
      expect(h.startDate).toContain("202");
      expect(h.endDate).toContain("202");
      expect(h.printerCost).not.toBeUndefined();
      expect(h.printerCost).not.toBeNaN();
      expect(h.printerCost).toEqual(parseFloat(h.printerCost).toFixed(2));
    });
    const stats = historyCache.generateStatistics();
    expect(stats).toBeTruthy();

    expect(stats).toEqual({
      completed: 10,
      cancelled: 4,
      failed: 0,
      completedPercent: "71.43",
      cancelledPercent: "28.57",
      failedPercent: "0.00",
      longestPrintTime: "20900.00",
      shortestPrintTime: "64.00",
      averagePrintTime: "11014.10",
      mostPrintedFile: "file.gcode",
      printerMost: "PRINTER2",
      printerLoad: "PRINTER1",
      totalFilamentUsage: "286.66g / 95.56m",
      averageFilamentUsage: "28.67g / 9.56m",
      highestFilamentUsage: "68.50g / 22.42m",
      lowestFilamentUsage: "0.00g / 0.00m",
      totalSpoolCost: "1.99",
      highestSpoolCost: "1.85",
      totalPrinterCost: "7.62",
      highestPrinterCost: "1.89",
      currentFailed: 247,
      historyByDay: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 1
            },
            {
              x: expect.any(Date),
              y: 1
            }
          ],
          name: "Success"
        },
        {
          data: [],
          name: "Failed"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2
            }
          ],
          name: "Cancelled"
        }
      ],
      totalByDay: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 68.5
            }
          ],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.3499999999999996
            }
          ],
          name: "PLA"
        }
      ],
      usageOverTime: [
        {
          data: [
            {
              x: expect.any(Date),
              y: 68.5
            }
          ],
          name: "PETG"
        },
        {
          data: [
            {
              x: expect.any(Date),
              y: 2.3499999999999996
            }
          ],
          name: "PLA"
        }
      ]
    });

    expect(stats.historyByDay).toHaveLength(3);
    expect(stats.historyByDay[0].data.length).toBeGreaterThan(0); // Success
    expect(stats.historyByDay[1].data.length).toBe(0); // Cancelled
    expect(stats.historyByDay[2].data.length).toBe(1); // Failed
    expect(stats.usageOverTime[0].data.length).toBe(1);
    expect(stats.usageOverTime[1].data.length).toBe(1);
    expect(stats.totalByDay[0].data.length).toBe(1); // PETG usage > 1
    expect(stats.totalByDay[1].data.length).toBeGreaterThan(0);
    expect(stats.totalSpoolCost).not.toBe("NaN");
    expect(stats.highestSpoolCost).not.toBe("NaN");
  });

  it("should reject when history entities contain illegal entry key", async () => {
    mockHistoryService.saveMockData(illegalHistoryCache);
    await expect(historyCache.initCache()).rejects.toBeTruthy();
  });

  it("should be able to generate statistics without error", async function () {
    mockHistoryService.saveMockData(emptyLegalHistoryCache);
    expect(await mockHistoryService.find({})).toHaveLength(1);

    // Empty history database => empty cache
    await historyCache.initCache();
    const { history } = historyCache.getHistoryCache();
    expect(history).toHaveLength(1);

    // Another test phase
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);
    await historyCache.initCache();
    const { history: history2 } = historyCache.getHistoryCache();

    expect(history2[0].printerCost).toEqual(noCostSettingsMessage);
    // Expect the rabbit hole to be deep.
    expect(history2[0].index).toEqual(interestingButWeirdHistoryCache[0].printHistory.historyIndex);
    // Act
    const historyStats = historyCache.generateStatistics();
    // Assert
    expect(historyStats).toBeTruthy();
    expect(historyStats.failed).toEqual(1);
  });

  // TODO conform new type for filament (key-value array)
  // TODO historyCache[0]:job:printTimeAccuracy === NaN
  it("should turn a single tool into array", async () => {
    mockHistoryService.saveMockData(realisticHistoryCache);

    await historyCache.initCache();
    const { history } = historyCache.getHistoryCache();

    expect(history).toHaveLength(14);
    // A case where a tool is not set
    expect(history[3].spools).toBeNull();
    expect(history[13].spools[0].tool0.toolName).toBe("Tool 0");
  });

  it("should not return NaN in printHours", async () => {
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);

    await historyCache.initCache();
    const { history } = historyCache.getHistoryCache();

    expect(history[0].printHours).not.toContain("NaN");
    expect(history[0].printHours).toEqual("?");
  });

  it("should allow process spools to return associative array when spools is non-empty", async () => {
    mockHistoryService.saveMockData(interestingButWeirdHistoryCache);

    await historyCache.initCache();
    const { history } = historyCache.getHistoryCache();

    const resultingSpoolsReport = processHistorySpools(history[0], [], [], []);
    expect(resultingSpoolsReport.historyByDay).toContainEqual({
      name: "Success",
      data: []
    });
  });

  it("should not throw when job property is null", async () => {
    mockHistoryService.saveMockData(nullJobHistoryCache);

    await expect(await historyCache.initCache()).resolves;
    const stats = await historyCache.generateStatistics();

    expect(stats).toBeTruthy();
    expect(stats.completed).toEqual(1);
    expect(stats.failed).toEqual(1);
  });
});

/**
 * Most of these functions below are easily tested in isolation
 */
describe("historyCache:Static", () => {
  it("assignYCumSum tolerate falsy y values and skips falsy entries", () => {
    const undefinedYInput = [
      { x: 0, y: undefined },
      { x: 0, y: 1 },
      { x: 0, y: undefined },
      { x: 0 },
      { x: 0, y: 1 }
    ];
    const missingYInput = [{ x: 0 }, { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 0 }, { x: 0, y: 1 }];
    const falsyContainingInput = [null, { x: 0, y: 1 }, { x: 0 }, undefined, { x: 0, y: 1 }];
    // Prove that the old function was buggy
    expect(legacyConvertIncremental(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(legacyConvertIncremental(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: NaN
    });
    expect(() => legacyConvertIncremental(falsyContainingInput)[4]).toThrow();

    // Prove that the new function outputs something useful
    expect(assignYCumSum(undefinedYInput)[4]).toStrictEqual({
      x: 0,
      y: 2
    });
    expect(assignYCumSum(missingYInput)[4]).toStrictEqual({
      x: 0,
      y: 3
    });

    // Prove that the new function outputs for only defined x properties, but tolerates falsy y
    const gappyCumSum = assignYCumSum(falsyContainingInput);
    expect(gappyCumSum.length).toEqual(3);
    expect(gappyCumSum[2]).toStrictEqual({ x: 0, y: 2 });
  });

  it("assignYCumSum is equivalent to map-cumulativeSum operator", () => {
    const input = [
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 1 }
    ];
    const unitUnderTestResult = legacyConvertIncremental(input);
    expect(unitUnderTestResult).toHaveLength(5);
    expect(unitUnderTestResult[4]).toStrictEqual({ x: 0, y: 5 });

    const operatorComparedResult = assignYCumSum(input);
    expect(operatorComparedResult).toStrictEqual(unitUnderTestResult);
  });

  it("should not return Promise on static processHistorySpools", () => {
    const result = processHistorySpools(
      {
        spools: [
          {
            pla: {
              type: "abs"
            }
          }
        ]
      },
      [],
      [],
      []
    );

    expect(isPromise(result)).toEqual(false);
  });

  it("should calculate spool weight with calcSpoolWeightAsString equivalently to getWeight function", () => {
    function getWeight(length, spool, printPercentage, success) {
      if (typeof spool !== "undefined" && spool !== null) {
        if (typeof length !== "undefined") {
          if (length === 0) {
            return length;
          } else {
            const radius = parseFloat(spool.spools.profile.diameter) / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (volume * parseFloat(spool.spools.profile.density)).toFixed(2);
            } else {
              usage = (
                (printPercentage / 100) *
                (volume * parseFloat(spool.spools.profile.density))
              ).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      } else {
        if (typeof length !== "undefined") {
          length = length;
          if (length === 0) {
            return length;
          } else {
            const radius = 1.75 / 2;
            const volume = length * Math.PI * radius * radius;
            let usage = "";
            if (success) {
              usage = (volume * 1.24).toFixed(2);
            } else {
              usage = ((printPercentage / 100) * (volume * 1.24)).toFixed(2);
            }
            return usage;
          }
        } else {
          return 0;
        }
      }
    }

    const length1 = 18.648094819996633;
    expect(getWeight(length1, undefined, 100, 0)).toEqual(
      calcSpoolWeightAsString(length1, undefined, 1)
    );
    expect(getWeight(length1, undefined, 50, 0)).toEqual(
      calcSpoolWeightAsString(length1, undefined, 0.5)
    );
    expect(getWeight(length1, undefined, 50, 1)).toEqual(
      calcSpoolWeightAsString(length1, undefined, 1)
    );
  });
});

describe("historyCache:Utilities", () => {
  it("deeply nested property material should never resolve to falsy property", () => {
    const testedValues = ["", null, undefined, {}, [], 0, -1];
    for (let value of testedValues) {
      expect(value?.spools?.profile?.material || "").toBe("");
    }
  });
});
