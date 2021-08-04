module.exports = {
  testEnvironment: "node",
  testTimeout: 5000,
  modulePathIgnorePatterns: ["server_2x"],
  globalSetup: "./test/setup-global.js",
  setupFilesAfterEnv: ["./test/setup-after-env.js"]
};
