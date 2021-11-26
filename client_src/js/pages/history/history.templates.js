import UI from "../../lib/functions/ui";

export const returnHistoryTableRow = function (record) {
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
          <td title="${record.file.path.replace(/_/g, " ")}">
            ${record.file.name.replace(/_/g, " ")}
          </td>
          <td>
            ${record.startDate}
          </td>
          <td>
             ${UI.generateTime(record.printTime)}
          </td>
          <td>
            ${record.endDate}
          </td>
          <td>
            <p class="mb-0"> ${record.totalCost} </p>
            <code>${record.costPerHour} / hour</code>
          </td>
          <td>
              <button
                      type="button"
                      class="btn btn-info btn-small historyEdit bg-colour-1"
                      id="${record._id}"
                      data-toggle="modal"
                      data-target="#historyModal"
              >
                <i class="fas fa-eye"></i>
              </button>

              <button
                      type="button"
                      class="btn btn-danger btn-small historyDelete"
                      id="${record._id}"
              >
                <i class="fas fa-trash"></i>
              </button>
          </td>
       </tr>   
    `;
};
