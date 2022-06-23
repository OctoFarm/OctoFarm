import UI from "../../utils/ui";

const drawActiveUser = (record) => {
  const noUser = "Unknown";
  let userTemplate = record?.activeControlUser ? record.activeControlUser : noUser;

  if(userTemplate === noUser){
    userTemplate = `OctoPrint: ${record?.job?.user ? record.job.user : noUser }`
  }

  return userTemplate
}

export const returnHistoryTableRow = function (record) {
  const spoolType = [];
  if (!!record?.spools) {
    record.spools.forEach((tool, index) => {
      const weight = tool["tool" + index]?.weight ? tool["tool" + index]?.weight : false
      const type =  tool["tool" + index]?.type ? tool["tool" + index]?.type : false
      let spoolString = "Unknown Spool";
      if(!!weight && !!type){
       spoolString = index + ": " + type + " - " + weight + "g";
      }
      spoolType.push(spoolString);
    });
  } else {
    spoolType.push("0: No Spool<br>");
  }
  const spoolString = [];
  spoolType.forEach((spool) => {
    spoolString.push(spool + "<br>");
  });
  return `
       <tr>
          <td class="d-none">
            ${record.index}
          </td>
          <td>
            ${record.state}
          </td>
          <td>
            ${record.printer}
          </td>
          <td>
            ${drawActiveUser(record)}
          </td>
          <td title="${record.file.path.replace(/_/g, " ")}">
            ${record.file.name.replace(/_/g, " ")}
          </td>
          <td>
            ${
              new Date(record.startDate).toLocaleDateString() +
              " " +
              new Date(record.startDate).toLocaleTimeString()
            }
          </td>
          <td>
             ${UI.generateTime(record.printTime)}
          </td>
          <td>
                        ${
                          new Date(record.endDate).toLocaleDateString() +
                          " " +
                          new Date(record.endDate).toLocaleTimeString()
                        }
          </td>
          <td>
            ${spoolString}
          </td>          
          <td>
            <p class="mb-0"> ${record.totalCost} </p>
          </td>
          <td>
            <code>${record.costPerHour} / hour</code>
          </td>
          <td>
              <button
                      type="button"
                      class="btn btn-info btn-small historyEdit"
                      id="view-${record._id}"
                      data-toggle="modal"
                      data-target="#historyModal"
              >
                <i class="fas fa-eye"></i>
              </button>

              <button
                      type="button"
                      class="btn btn-danger btn-small historyDelete"
                      id="delete-${record._id}"
              >
                <i class="fas fa-trash"></i>
              </button>
          </td>
       </tr>   
    `;
};

const isDisabled = function (boolean) {
  if (boolean) {
    return "disabled";
  } else {
    return "";
  }
};

const returnPageNumber = function (number, disabled) {
  return `
        <button id="changePage-${number}" type="button" class="btn btn-secondary" ${isDisabled(
    disabled
  )}>${number}</button>
    `;
};
const returnSkipPageNumber = function () {
  return `
        <button id="skipPage" type="button" class="btn btn-secondary" disabled>...</button>
    `;
};

export const returnHistoryPagination = function (pagination) {
  const {
    hasPrevPage,
    hasNextPage,
    pageCount,
    currentPage,
    itemCount,
    perPage,
  } = pagination;
  let pageList = "";
  let itemsOutOf = `${perPage} Items of ${itemCount}`;

  if (perPage === 9007199254740991) {
    itemsOutOf = "ALL of " + itemCount + " items...";
  }

  let pagesToDraw = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  if (parseInt(pageCount) > 9) {
    pagesToDraw = [];
    pagesToDraw.push(1);
    pagesToDraw.push(2);
    pagesToDraw.push(3);
    pagesToDraw.push(4);
    pagesToDraw.push(5);
    pagesToDraw.push(pageCount - 4);
    pagesToDraw.push(pageCount - 3);
    pagesToDraw.push(pageCount - 2);
    pagesToDraw.push(pageCount - 1);
    pagesToDraw.push(pageCount);
  }

  for (let page = 1; page <= pageCount; page++) {
    if (pagesToDraw.includes(page)) {
      if (page === currentPage) {
        pageList += returnPageNumber(page, true);
      } else {
        pageList += returnPageNumber(page);
      }
    } else {
      if (!pageList.includes("skipPage")) {
        pageList += returnSkipPageNumber();
      }
    }
  }
  return `
            <div class="col-lg-2 m-0 text-center">
                <div id="currentPageCount" class="btn btn-secondary mt-1 btn-sm">
                 Page ${currentPage} of ${pageCount}
                </div>
            </div>
            <div class="col-lg-8 m-0">
                <div class="btn-toolbar justify-content-center" role="toolbar" aria-label="Toolbar with button groups">
                  <div class="btn-group mr-2" role="group" aria-label="First group">
                    <button id="firstPage" type="button" class="btn btn-secondary" ${isDisabled(
                      currentPage === 1
                    )}>First</button>
                    <button id="previousPage" type="button" class="btn btn-secondary" ${isDisabled(
                      !hasPrevPage
                    )}>Previous</button>
                  </div>
                  <div id="pageList" class="btn-group mr-2" role="group" aria-label="Second group">
                    ${pageList}
                  </div>
                  <div class="btn-group" role="group" aria-label="Third group">
                    <button id="nextPage" type="button" class="btn btn-secondary" ${isDisabled(
                      !hasNextPage
                    )}>Next</button>
                    <button id="lastPage" type="button" class="btn btn-secondary" ${isDisabled(
                      currentPage === pageCount
                    )}>Last</button>
                  </div>
                </div>            
            </div>
            <div class="col-lg-2 m-0 text-center">
                <div id="currentItemCount" class="btn btn-secondary mt-1 btn-sm">
                 ${itemsOutOf}
                </div>
            </div>                        


    `;
};

export const returnHistoryFilterDefaultSelected = function () {
  return `
           <option selected
                href="#"
                data-value="0"
                data-path="default"
        >Filter</option>
    `;
};
