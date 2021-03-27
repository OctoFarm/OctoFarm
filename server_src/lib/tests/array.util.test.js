const { checkNestedIndex, checkNested } = require("../utils/array.util");

describe("checkNested", function () {
  it("checkNested should return tolerate non-array and undefined", async function () {
    expect(checkNested({})).toBeFalsy();
    expect(checkNested({}, {})).toBeFalsy();
  });

  it("checkNested should return similar to find equivalent", async function () {
    const testElement = { name: "asd" };
    const testArray = [testElement];
    const testName = "asd";
    const uutResult = checkNested(testName, testArray);
    expect(uutResult).toBe(testElement);
    const testResult = testArray.find((kv) => kv?.name === testName);
    expect(testResult).toBe(uutResult);
  });

  it("checkNested alternative should tolerate illegal values", async function () {
    expect(null?.find((kv) => kv?.name === {})).toBeUndefined();
    expect(undefined?.find((kv) => kv?.name === {})).toBeUndefined();

    const emptyObject = {};
    const throwingLambda = () => {
      emptyObject?.find((kv) => kv?.name === {});
    };
    expect(throwingLambda).toThrow("emptyObject?.find is not a function");
  });
});

describe("checkNestedIndex", function () {
  it("checkNestedIndex should return tolerate non-array", async function () {
    const result = checkNestedIndex({}, {});
    expect(result).toBeFalsy();
  });

  it("checkNestedIndex should return similar to find equivalent", async function () {
    const testArray = [{ name: "asd" }];
    const testName = "asd";
    const resultIndex = checkNestedIndex(testName, testArray);
    expect(resultIndex).toBe(0);
    const testResult = testArray.findIndex((kv) => kv?.name === testName);
    expect(testResult).toBe(resultIndex);
  });

  it("checkNestedIndex alternative should tolerate illegal values", async function () {
    expect(null?.findIndex((kv) => kv?.name === {})).toBeUndefined();
    expect(undefined?.findIndex((kv) => kv?.name === {})).toBeUndefined();
    const emptyObject = {};

    const throwingLambda = () => {
      emptyObject?.findIndex((kv) => kv?.name === {});
    };
    expect(throwingLambda).toThrow("emptyObject?.findIndex is not a function");
  });
});
