import Calc from "../utils/calc";

export const grabOctoFarmLogList = (log) => {
    return `
    <tr id="log-${log.name}">
        <td>${log.name}</td>
        <td>${new Date(log.created).toString().substring(0, 21)}</td>
        <td>${new Date(log.modified).toString().substring(0, 21)}</td>
        <td>${Calc.bytes(log.size)}</td>
        <td>
            <button id="${log.name}-download" type="button" class="btn btn-sm btn-outline-warning"><i class="fas fa-download"></i></button>
            <button id="${log.name}-delete" type="button" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
        </td>
   </tr>
    `
}