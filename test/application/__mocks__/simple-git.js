let simpleGitMock = jest.createMockFromModule("simple-git");

let currentScenario = null;
let isGitRepo = true;
let wasReset = null;

simpleGitMock = () => {
    return {
        status: () => Promise.resolve(
            currentScenario
        ),

        pull: () => Promise.resolve(),
        reset: (input) => {
            wasReset = true;
            return Promise.resolve();
        },

        // Mock helper functions below
        checkIsRepo: () => isGitRepo,
        testGetWasRest: () => wasReset,
        setTestScenario: (input) => {
            currentScenario = input
        },
        setIsRepo: (isRepo) => isGitRepo = isRepo,
    }
};

module.exports = simpleGitMock;
