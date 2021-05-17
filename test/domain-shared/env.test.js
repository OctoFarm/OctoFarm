describe("NODE_ENV", () => {
  it("environment should be test", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
