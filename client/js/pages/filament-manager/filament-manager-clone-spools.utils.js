import { updateProfileDrop } from "./filament-manager-ui.utils";
import { addSpool } from "./filament-manager.actions";

const clonedSpools = [];

export const cloneSpool = async (e) => {
    const row = e.parentElement.parentElement;
    const editable = row.querySelectorAll("input");
    const selects = row.querySelectorAll("select");
    const spool = [];
    editable.forEach((edit) => {
        spool.push(edit.placeholder);
    });

    let clonedIndex = clonedSpools.length;

    document.getElementById("addSpoolsTable").insertAdjacentHTML(
        "afterend",
        `
              <tr id="clonedRow-${clonedIndex}">
                <th style="display: none;">${clonedIndex}</th>
                <th scope="row"><input id="clonedName-${clonedIndex}" class="form-control" type="text" placeholder="${spool[0]}-${clonedIndex}" value="${spool[0]} (${clonedIndex})"></th>
                <td>
                     <span class="d-none material" id="spoolsMaterialText-${clonedIndex}"></span>
                     <select id="spoolsProfile-${clonedIndex}" class="form-control">

                     </select>
                 </td>
                <td><input id="clonedPrice-${clonedIndex}" class="form-control" type="text" step="0.01" placeholder="${spool[1]}" value="${spool[1]}"></td>
                <td><input id="clonedWeight-${clonedIndex}" class="form-control" type="text" placeholder="${spool[2]}" value="1000"></td>
                <td><input id="clonedUsed-${clonedIndex}" class="form-control" type="text" placeholder="${spool[3]}" value="0"></td>
                <td><input id="clonedToolOffset-${clonedIndex}" class="form-control" type="text" placeholder="${spool[4]}" value="${spool[4]}"></td>
                <td><input id="clonedBedOffset-${clonedIndex}" class="form-control" type="text" placeholder="${spool[5]}" value="${spool[5]}"></td>
                 <td>
                     <select id="spoolsPrinterAssignment-${clonedIndex}" class="form-control" disabled>

                     </select>
                 </td>
                 <td>
                <button id="clonedSave-${clonedIndex}" type="button" class="btn btn-sm btn-success">
                  <i class="fas fa-save saveIcon"></i>
                </button></td>
              </tr>
              `
    );

    document.getElementById("clonedSave-" + clonedIndex).addEventListener("click", function () {
        const clonedRow = document.getElementById(`clonedRow-${clonedIndex}`);
        const addedSpool = addSpool(
            document.getElementById(`clonedName-${clonedIndex}`),
            document.getElementById(`spoolsProfile-${clonedIndex}`),
            document.getElementById(`clonedPrice-${clonedIndex}`),
            document.getElementById(`clonedWeight-${clonedIndex}`),
            document.getElementById(`clonedUsed-${clonedIndex}`),
            document.getElementById(`clonedToolOffset-${clonedIndex}`),
            document.getElementById(`clonedBedOffset-${clonedIndex}`)
        );
        if (addedSpool) {
            // Remove Row
            clonedRow.remove();
            clonedSpools.pop();
        }
    });

    clonedSpools.push(clonedIndex);
    document.getElementById(`spoolsProfile-${clonedIndex}`).value = selects[0].value;
    await updateProfileDrop();
}