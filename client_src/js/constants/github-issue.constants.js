const githubIssueBaseURL = "https://github.com/octofarm/octofarm/issues/new?";
const githubSignUpURL = "https://github.com/signup";

const doNotDeleteMessageStart = "###DO NOT DELETE, append your message below###\n";
const doNotDeleteMessageEnd = "\n###END###";

const errorGithubIssueLabelMap = {
  CLIENT: "client,bug",
  SERVER: "server,bug",
  OCTOPRINT: "octoprint",
  NETWORK: "server,bug",
  UNKNOWN: "bug"
};

const githubIssueFormId = {
  TITLE: "&title=",
  OCTOFARM_VERSION: "&octofarm-version=",
  OCTOPRINT_VERSIONS: "&octoprint-version=",
  SERVER_PROCESS: "&process=",
  OPERATING_SYSTEM: "&current-system=",
  OCTOPRINT_PLUGINS: "&plugins-octoprint=",
  ERROR_TYPE: "&current-location=",
  DESCRIPTION: "&problem-desc=",
  LABELS: "&labels=",
  AIR_GAPPED: "&airgap=",
  ISSUE_TEMPLATE: "&template=issue-report.yml"
};

export {
  githubIssueBaseURL,
  githubSignUpURL,
  githubIssueFormId,
  errorGithubIssueLabelMap,
  doNotDeleteMessageStart,
  doNotDeleteMessageEnd
};
