const simpleGit = require("simple-git");
const git = simpleGit();

describe('ServerCommands', () =>{
    jest.mock("child_process", () => {
        return {
            exec: () => Promise.resolve()
        }
    });
    const {SystemCommands} = require("../../server_src/lib/serverCommands");

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

    it("should be able to see non-pushed commits", async () => {
        expect(process.env.NODE_ENV).toBe("test");
    });

    it("should be able to see uninstalled packages", async () => {
    });
});
