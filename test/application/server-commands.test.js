describe('ServerCommands', () => {
    jest.mock("child_process", () => {
        return {
            exec: () => Promise.resolve()
        }
    });
    jest.mock("../../server_src/utils/npm.utils");
    jest.mock("simple-git");
    const SimpleGit = require("simple-git");
    const mockedSimpleGit = SimpleGit();
    const {SystemCommands} = require("../../server_src/lib/serverCommands");

    describe('package updates, modifications and pull', () => {
        const scenarioModifiedOutput = {
            modified: [
                "package-lock.json",
                "package.json",
                "server_src/lib/serverCommands.js",
            ],
            ahead: 0,
            behind: 0,
        };

        const scenarioModifiedBehindOutput = {
            modified: [
                "package-lock.json",
                "package.json",
                "server_src/lib/serverCommands.js",
            ],
            ahead: 0,
            behind: 1,
        };

        const scenarioModifiedAheadOutput = {
            modified: [
                "package-lock.json",
                "package.json",
                "server_src/lib/serverCommands.js",
            ],
            ahead: 1,
            behind: 0,
        };

        const scenarioAheadOutput = {
            modified: [],
            ahead: 1,
            behind: 0,
        };

        const scenarioBehindOutput = {
            modified: [],
            ahead: 0,
            behind: 1,
        };

        const scenarioUpToDate = {
            modified: [],
            ahead: 0,
            behind: 0,
        }

        const successType = "success";
        const warningType = "warning";
        const upToDateMessage = "OctoFarm is already up to date! Your good to go!"
        const upDateCompletedMessage = "Update command has run successfully, OctoFarm will restart.";
        const missingPackagesMessage = "You have missing dependencies that are required, Do you want to update these?";
        const modificationsDetectedMessage = "The update is failing due to local changes been detected. Please check the file list below for what has been modified.";

        const scenarioOutcomes = [
            {
                name: "should not complain about modifications",
                scenario: scenarioModifiedOutput,
                type: successType,
                containsMessage: upToDateMessage
            },
            {
                name: "should warn about modifications when behind",
                scenario: scenarioModifiedBehindOutput,
                type: warningType,
                containsMessage: modificationsDetectedMessage
            },
            {
                name: "should not take not of being ahead",
                scenario: scenarioAheadOutput,
                type: successType,
                containsMessage: upToDateMessage
            },
            {
                name: "should not take not of being ahead with modifications",
                scenario: scenarioModifiedAheadOutput,
                type: successType,
                containsMessage: upToDateMessage
            },
            {
                name: "should try to pull when behind",
                scenario: scenarioBehindOutput,
                type: successType,
                containsMessage: upDateCompletedMessage
            },
        ]

        beforeEach(() => {
            mockedSimpleGit.setTestScenario(scenarioUpToDate);
            mockedSimpleGit.setIsRepo(true);
        });

        it("should be able to detect no updates", async () => {
            mockedSimpleGit.setTestScenario(scenarioUpToDate);
            const serverResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate({}, true);
            expect(serverResponse.message).toBe(upToDateMessage);
            expect(serverResponse.haveWeSuccessfullyUpdatedOctoFarm).toBe(false);
            expect(serverResponse.statusTypeForUser).toBe(successType);
        });

        it("should be able to detect and fix uninstalled packages", async () => {
            mockedSimpleGit.setTestScenario(scenarioBehindOutput);
            const npmUtils = require("../../server_src/utils/npm.utils");
            npmUtils.setHasMissingPackages(true);

            const serverResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate({}, true);
            expect(serverResponse.message).toContain(missingPackagesMessage);
            expect(serverResponse.statusTypeForUser).toBe(warningType);
        });

        it("should be able to see that we have a git repo", async () => {
            mockedSimpleGit.setIsRepo(true);
            const isRepo = await mockedSimpleGit.checkIsRepo();
            expect(isRepo).toBe(true);
        });

        it("should fail on not being a git repo", async () => {
            mockedSimpleGit.setIsRepo(false);
            const serverResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate({}, true);
            expect(serverResponse.message).toContain("Not a git repository");
            expect(serverResponse.statusTypeForUser).toBeUndefined();
        });

        for (const spec of scenarioOutcomes) {
            it(spec.name, async () => {
                mockedSimpleGit.setTestScenario(spec.scenario);
                const serverResponse = await SystemCommands.checkIfOctoFarmNeedsUpdatingAndUpdate({}, true);
                expect(serverResponse.message).toContain(spec.containsMessage);
                expect(serverResponse.statusTypeForUser).toBe(spec.type);
            });
        }
    });

    describe('Reboot command', () => {
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
});
