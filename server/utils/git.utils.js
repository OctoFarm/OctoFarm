const simpleGit = require("simple-git");
const { resolve, join } = require("path");
const { existsSync } = require("fs");

const mainRepo = resolve(__dirname, "../../");
const git = simpleGit(mainRepo);

function getCurrentBranch() {
  if (!checkIfWereInAGitRepo()) {
    return "Not a repository...";
  }
  return git.branch();
}

function makeSureBranchIsUpToDateWithRemote() {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  return git.fetch();
}

function checkIfWereInAGitRepo() {
  return existsSync(join(mainRepo, ".git"));
}
function returnCurrentGitStatus() {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  return git.status();
}

function isBranchUpToDate(status) {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  return status.behind === 0;
}

function isBranchInfront(status) {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  return status.ahead !== 0;
}

function getListOfModifiedFiles(status) {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  return status.modified;
}

async function pullLatestRepository(force) {
  if (!checkIfWereInAGitRepo()) {
    return false;
  }
  if (force) {
    await git.reset("hard");
    return git.pull();
  } else {
    return git.pull();
  }
}

module.exports = {
  returnCurrentGitStatus,
  isBranchUpToDate,
  isBranchInfront,
  getListOfModifiedFiles,
  pullLatestRepository,
  checkIfWereInAGitRepo,
  makeSureBranchIsUpToDateWithRemote,
  getCurrentBranch
};
