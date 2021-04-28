const npmUtils = jest.createMockFromModule("../npm.utils");

let hasMissingPackages = false;
npmUtils.doWeHaveMissingPackages = async () => hasMissingPackages;
npmUtils.installMissingNpmDependencies = async () => {};

// Test helper
npmUtils.setHasMissingPackages = (missingPackages) => hasMissingPackages = missingPackages;

module.exports = npmUtils;
