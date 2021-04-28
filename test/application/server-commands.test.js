const simpleGit = require("simple-git");
const git = simpleGit();

const scenarioUpToDate = {
    modified: [],
    ahead: 0,
    behind: 0,
}

describe('ServerCommands', () => {
    const scenarioModifiedOutput = {
        modified: [
            "package-lock.json",
            "package.json",
            "server_src/lib/serverCommands.js",
        ],
        ahead: 0,
        behind: 0,
    };

    jest.mock("child_process", () => {
        return {
            exec: () => Promise.resolve()
        }
    });

    let wasReset = null;
    let currentScenario = scenarioUpToDate;
    jest.mock("simple-git", () => {
        return () => {
            return {
                status: () => Promise.resolve(
                    currentScenario
                ),
                pull: () => Promise.resolve(),
                reset: (input) => {
                    wasReset = true;
                    return Promise.resolve();
                },
                checkIfWereInAGitRepo: () => true
            }
        }
    });

    jest.mock("npm-git", () => {
        return () => {
            return {
                doWeHaveMissingPackages: () => Promise.resolve(true),
                installMissingNpmDependencies: () => Promise.resolve(true),
            }
        };
    });

    const {SystemCommands} = require("../../server_src/lib/serverCommands");

    it("should be able to see non-pushed commits", async () => {
        const serverResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate({}, true);
        console.log(serverResponse);
        expect(serverResponse.message).toBeTruthy();
    });

    it("should be able to see uninstalled packages", async () => {
    });

    it("should be able to see that we have a git repo", async () => {
        const isRepo = await git.checkIsRepo();
        expect(isRepo).toBe(true);
    });

    it("should not reboot octofarm in unknown mode", async () => {
        // Output indicates that we are neither in pm2 or nodemon mode
        const output = await SystemCommands.rebootOctoFarm();
        expect(output).toBe(false);
    });

    it("should be able to attempt rebooting octofarm - pm2 mode", async () => {
        // Output indicates that we are in pm2 mode
        process.env.PM2_HOME = "true";
        const outputPm2 = await SystemCommands.rebootOctoFarm();
        expect(outputPm2).toBe(true);
        delete process.env.PM2_HOME;
    });

    it("should be able to attempt rebooting octofarm - nodemon mode", async () => {
        // Output indicates that we are in nodemon mode
        process.env.npm_lifecycle_script = "something something nodemon";
        const outputNodemon = await SystemCommands.rebootOctoFarm();
        expect(outputNodemon).toBe(true);
        delete process.env.npm_lifecycle_script;
    });
});
