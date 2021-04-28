const npmUtils = jest.createMockFromModule("../npm.utils");

let hasMissingPackages = false;
let targetedStateAfterPull = true; // Default: pulling will successfully change state to up-to-date

npmUtils.doWeHaveMissingPackages = async () => hasMissingPackages;
npmUtils.installMissingNpmDependencies = async () => {hasMissingPackages = targetedStateAfterPull};

// Test helper
npmUtils.setHasMissingPackages = (missingPackages) => hasMissingPackages = missingPackages;
npmUtils.setTargetState = (targetState) => targetedStateAfterPull = targetState;

module.exports = npmUtils;
