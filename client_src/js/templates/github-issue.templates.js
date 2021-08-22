import { camelCase } from "lodash";
import {
  githubIssueBaseURL,
  githubIssueFormId,
  errorGithubIssueLabelMap,
  doNotDeleteMessageStart,
  doNotDeleteMessageEnd,
  githubSignUpURL
} from "../constants/github-issue.constants";
import AxiosClient from "../services/axios.service";

async function returnGithubIssueLink(options) {
  let encodedURIString = githubIssueBaseURL;

  encodedURIString += options?.message
    ? `${githubIssueFormId["TITLE"]}${encodeURIComponent(options.message)}`
    : "";

  if (options?.serverResponse) {
    encodedURIString += options?.stack
      ? `${githubIssueFormId["DESCRIPTION"]}${encodeURIComponent(
          doNotDeleteMessageStart +
            options.stack +
            options.serverResponse.stack +
            doNotDeleteMessageEnd
        )}`
      : "";
  } else {
    encodedURIString += options?.stack
      ? `${githubIssueFormId["DESCRIPTION"]}${encodeURIComponent(
          doNotDeleteMessageStart + options.stack + doNotDeleteMessageEnd
        )}`
      : "";
  }

  encodedURIString += options?.type
    ? `${githubIssueFormId["ERROR_TYPE"]}${camelCase(options.type)}`
    : "";

  encodedURIString += `${githubIssueFormId["LABELS"]}${errorGithubIssueLabelMap[options.type]}`;

  // TODO create proper endpoint for this that's authenticated. Also switch over all of below...
  const octofarmData = await AxiosClient.serverAliveCheck();
  console.log(octofarmData);
  if (octofarmData) {
    encodedURIString += octofarmData.isPm2 ? `${githubIssueFormId["SERVER_PROCESS"]}pm2` : "";

    encodedURIString += octofarmData.update.air_gapped
      ? `${githubIssueFormId["AIR_GAPPED"]}Yes`
      : `${githubIssueFormId["AIR_GAPPED"]}No`;

    encodedURIString += octofarmData.update.current_version
      ? `${githubIssueFormId["OCTOFARM_VERSION"]}${octofarmData.update.current_version}`
      : "";

    encodedURIString += octofarmData?.os
      ? `${githubIssueFormId["OPERATING_SYSTEM"]}${octofarmData?.os}`
      : "";
  }

  encodedURIString += githubIssueFormId["ISSUE_TEMPLATE"];

  return `
     <div class="py-3">
      <a target="_blank" href="${encodedURIString}"><button class="btn btn-success"><i class="fab fa-github"></i> Report to Github!</button></a>
    </div>
    <div class="alert alert-info small" role="alert">
      The button above requires a github account, <a href="${githubSignUpURL}">Create one here!</a> 
    </div>
  `;
}

export { returnGithubIssueLink };
