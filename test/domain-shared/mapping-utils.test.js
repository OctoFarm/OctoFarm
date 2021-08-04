const { checkTempRange, mapProgressToColor } = require("../../server_src/utils/mapping.utils");

describe("mapping-utils", () => {
  it("should run checkTempRange util with expected temperature state", async () => {
    let tempState = checkTempRange(1, 2, 3, 4, 5);
    expect(tempState).toBe("tempOffline");

    tempState = checkTempRange("Active", 2, 3, 4, 5);
    expect(tempState).toBe("tempSuccess");

    tempState = checkTempRange("Idle", 2, 3, 4, 5);
    expect(tempState).toBe("tempSuccess");

    tempState = checkTempRange("Complete", 2, 3, 4, 5);
    expect(tempState).toBe("tempCool");

    tempState = checkTempRange("Complete", 2, 30, 4, 5);
    expect(tempState).toBe("tempCooling");
  });

  it("should run getProgressColour util with expected responses", async () => {
    expect(mapProgressToColor(0)).toEqual("dark");
    expect(mapProgressToColor(24)).toEqual("secondary");
    expect(mapProgressToColor(25)).toEqual("primary");
    expect(mapProgressToColor(50)).toEqual("primary");
    expect(mapProgressToColor(51)).toEqual("info");
    expect(mapProgressToColor(75)).toEqual("info");
    expect(mapProgressToColor(76)).toEqual("warning");
    expect(mapProgressToColor(100)).toEqual("success");
  });
});
