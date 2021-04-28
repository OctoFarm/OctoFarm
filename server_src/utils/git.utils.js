const simpleGit = require("simple-git");
const git = simpleGit();

function returnCurrentGitStatus() {
  return git.status();
}

function isBranchUpToDate(status) {
  return status.behind === 0;
}

function isBranchInfront(status) {
  return status.ahead === 0;
}

function doesBranchContainModifiedFiles(status) {
  if (status.modified.length !== 0) {
    return status.modified;
  } else {
    return false;
  }
}

module.exports = {
  returnCurrentGitStatus,
  isBranchUpToDate,
  isBranchInfront,
  doesBranchContainModifiedFiles,
};
