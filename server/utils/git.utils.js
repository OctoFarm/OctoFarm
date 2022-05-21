const simpleGit = require("simple-git");
const { resolve } = require("path");

const path = resolve(__dirname, "../../");
const git = simpleGit(path);

function getCurrentBranch() {
  return git.branch();
}

function makeSureBranchIsUpToDateWithRemote() {
  return git.fetch();
}

function checkIfWereInAGitRepo() {
  let response;
  try {
    response = git.checkIsRepo();
  } catch (e) {
    console.warn("Not a git repository, ignoring...");
  }
  return response;
}

function returnCurrentGitStatus() {
  return git.status();
}

function isBranchUpToDate(status) {
  return status.behind === 0;
}

function isBranchInfront(status) {
  return status.ahead !== 0;
}

function getListOfModifiedFiles(status) {
  return status.modified;
}

async function pullLatestRepository(force) {
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
