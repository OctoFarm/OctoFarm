const {SystemCommands} = require("../../server_src/lib/serverCommands");
const simpleGit = require("simple-git");
const git = simpleGit();

describe('ServerCommands', () =>{
    it("should be able to see that we have a git repo", async () => {
        // SystemCommands.
        const isRepo = await git.checkIsRepo();
        expect(isRepo).toBe(true);
    });

    it("should be able to see non-pushed commits", async () => {
    });


    it("should be able to see uninstalled packages", async () => {
    });
});
