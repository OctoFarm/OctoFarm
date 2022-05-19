import Calc from "../../utils/calc";

export const getFileQueueRow = (file) => {
  return `
        <tr id="queueRow-${file.index}">
            <td class="align-middle">${file.printer}</td>
            <td class="align-middle">${file.name}</td>
            <td class="align-middle">${file.currentFolder}</td>
            <td class="align-middle">${Calc.bytes(file.size)}</td>
            <td class="align-middle">
                <div class="progress">
                    <div id="queueProgressBar-${
                      file.index
                    }" class="progress-bar progress-bar-striped bg-info"
                     role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </td>
        </tr>
    `;
};

export const getFileRowID = (record) => {
  return `${record.name.replace(/[^a-zA-Z0-9 ]/g, "")}-${record.printer.replace(
    /[^a-zA-Z0-9 ]/g,
    ""
  )}`;
};
