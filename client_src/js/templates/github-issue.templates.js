import { camelCase } from "lodash";
import {
  githubIssueBaseURL,
  githubIssueFormId,
  errorGithubIssueLabelMap,
  githubSignUpURL
} from "../constants/github-issue.constants";
import AmIAliveService from "../services/amialive.service";
import OctoFarmClient from "../services/octofarm-client.service";

async function returnGithubIssueLink(options) {
  let encodedURIString = githubIssueBaseURL;

  encodedURIString += options?.message
    ? `${githubIssueFormId.TITLE}${encodeURIComponent(options.message)}`
    : "";

  if (options?.serverResponse) {
    encodedURIString += options?.stack
      ? `${githubIssueFormId.STACK_TRACE}${encodeURIComponent(
          options.stack + options.serverResponse.stack
        )}`
      : "";
  } else {
    encodedURIString += options?.stack
      ? `${githubIssueFormId.STACK_TRACE}${encodeURIComponent(options.stack)}`
      : "";
  }

  encodedURIString += options?.type
    ? `${githubIssueFormId.ERROR_TYPE}${camelCase(options.type)}`
    : "";

  encodedURIString += `${githubIssueFormId.LABELS}${errorGithubIssueLabelMap[options.type]}`;

  // TODO create proper endpoint for this that's authenticated. Also switch over all of below...
  let octofarmData;
  if (AmIAliveService.getStatus()) {
    octofarmData = await OctoFarmClient.getGithubIssueInformation();
  }

  if (octofarmData) {
    encodedURIString += octofarmData.isPm2 ? `${githubIssueFormId.SERVER_PROCESS}pm2` : "";

    encodedURIString += octofarmData.update.air_gapped
      ? `${githubIssueFormId.AIR_GAPPED}Yes`
      : `${githubIssueFormId.AIR_GAPPED}No`;

    encodedURIString += octofarmData.update.current_version
      ? `${githubIssueFormId.OCTOFARM_VERSION}${octofarmData.update.current_version}`
      : "";

    encodedURIString += octofarmData?.printerVersions
      ? `${githubIssueFormId.OCTOPRINT_VERSIONS}${octofarmData.printerVersions}`
      : "";

    encodedURIString += octofarmData?.os
      ? `${githubIssueFormId.OPERATING_SYSTEM}${octofarmData.os}`
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
