import UI from "../../../utils/ui";

export const collapsableRow = (
  index,
  printerURL,
  averageTotalCalc,
  actualSuccessPercent,
  actualFailedPercent,
  totalsArray,
  totalAPIFailed,
  totalPingPongFails
) => {
  return `

       <tr class="bg-primary">
         <th> <a class="btn btn-secondary" data-toggle="collapse" href="#connectionCollapse-${index}" role="button" aria-expanded="false" aria-controls="collapseExample">
         <i class="far fa-caret-square-down"></i>
        </a> 
   </th>
     <th scope="row"> ${printerURL}  </th>
     <th> ${UI.generateMilisecondsTime(averageTotalCalc)}  </th>
     <th>
       <div class="progress">
         <div class="progress-bar bg-success" role="progressbar" style="width: ${actualSuccessPercent}%;" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100"> ${actualSuccessPercent.toFixed(
    0
  )} %</div>
         <div class="progress-bar bg-danger" role="progressbar" style="width: ${actualFailedPercent}%;" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100">${actualFailedPercent.toFixed(
    0
  )} %</div>
       </div>
     </th>
     <th> ${totalsArray[index].reduce(function (a, b) {
       return a + b["retryCount"];
     }, 0)} </th>
     <th>
       ${totalAPIFailed}
     </th>
     <th> ${totalPingPongFails}  </th>
   </tr>
   <span id="collapseableRow-${index}"></span>
`;
};

export const collapsableContent = (
  index,
  url,
  averageCalculation,
  successPercent,
  failedPercent,
  log
) => {
  return `
    <tr class="collapse" id="connectionCollapse-${index}">
       <th>  </th>
       <th class="p-1">${url}</th>

       <th class="p-1">${UI.generateMilisecondsTime(averageCalculation)}</th>
       <th class="p-1">
         <div class="progress">
           <div class="progress-bar bg-success" role="progressbar" style="width: ${successPercent}%;" aria-valuenow="30" aria-valuemin="0" aria-valuemax="100">${successPercent.toFixed(
    0
  )}%</div>
           <div class="progress-bar bg-danger" role="progressbar" style="width: ${failedPercent}%;" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100">${failedPercent.toFixed(
    0
  )}%</div>
         </div>
       </th>
       <th class="p-1">${log.totalRetries}</th>
       <th class="p-1">${log.connectionFailures}</th>
       <th class="p-1">${
         url.includes("websocket") ? log.totalPingPong : "-"
       }</th>
    </tr>
    
    `;
};
