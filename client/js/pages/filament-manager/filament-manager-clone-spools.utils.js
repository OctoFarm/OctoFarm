import {
  updateProfileDrop,
  updatePrinterDrops,
  reRenderPageInformation,
} from "./filament-manager-ui.utils";
import { addSpool } from "./filament-manager.actions";
import { findDigitsInString } from "../../constants/regex.constants";
import { pageElements } from "./filament-manager.utils";

export const cloneSpool = async (e) => {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const spool = [];
  editable.forEach((edit) => {
    spool.push(edit.placeholder);
  });

  let spoolName = spool[0];
  const nextSpoolIndex = pageElements.spoolsManagerTable.rows.length;
  const spoolClonedId = row.id;
  const clonedRowID = `clonedRow-${spoolClonedId}-`;
  const currentSpoolsClonedCount =
    document.querySelectorAll(`[id^=${clonedRowID}]`).length + 1;

  if (findDigitsInString.test(spoolName)) {
    const detectedDigits = findDigitsInString.exec(spoolName);
    const firstDetectedDigit = detectedDigits[0];
    const digitsLength = firstDetectedDigit.length;
    if (firstDetectedDigit.toString()[0] === "0") {
      const noZeros = firstDetectedDigit.replaceAll("0", "");
      const zeroesToAddBack = digitsLength - noZeros.length;
      let numberParse = parseFloat(noZeros) + currentSpoolsClonedCount;
      let zeroString = "";
      if (zeroesToAddBack > 0) {
        for (let z = 0; z < zeroesToAddBack; z++) {
          zeroString += "0";
        }
      }
      spoolName = spoolName.replace(
        firstDetectedDigit,
        `${zeroString}${numberParse}`
      );
    } else {
      const increment =
        parseFloat(firstDetectedDigit) + currentSpoolsClonedCount;
      spoolName = spoolName.replace(firstDetectedDigit, increment);
    }

    // const removeZer
  } else {
    spoolName = `${spoolName} (${currentSpoolsClonedCount + 1})`;
  }

  document.getElementById(row.id).insertAdjacentHTML(
    "afterend",
    `
              <tr id="clonedRow-${spoolClonedId}-${nextSpoolIndex}">
                <th style="display: none;">${nextSpoolIndex}</th>
                <th scope="row"><input id="clonedName-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" placeholder="${spoolName}" value="${spoolName}"></th>
                <td>
                     <span class="d-none material" id="spoolsMaterialText-${spoolClonedId}-${nextSpoolIndex}"></span>
                     <select id="spoolsProfile-${spoolClonedId}-${nextSpoolIndex}" class="form-control">

                     </select>
                 </td>
                <td><input id="clonedPrice-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" step="0.01" placeholder="${spool[1]}" value="${spool[1]}"></td>
                <td><input id="clonedWeight-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" placeholder="${spool[2]}" value="1000"></td>
                <td><input id="clonedUsed-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" placeholder="0" value="0"></td>
                <td><input id="clonedToolOffset-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" placeholder="${spool[4]}" value="${spool[4]}"></td>
                <td><input id="clonedBedOffset-${spoolClonedId}-${nextSpoolIndex}" class="form-control" type="text" placeholder="${spool[5]}" value="${spool[5]}"></td>
                 <td>
                     <select id="spoolsPrinterAssignment-${spoolClonedId}-${nextSpoolIndex}" class="form-control" disabled>

                     </select>
                 </td>
                 <td>
                <button id="clonedSave-${spoolClonedId}-${nextSpoolIndex}" type="button" class="btn btn-sm btn-success">
                  <i class="fas fa-save saveIcon"></i>
                </button>
                <button id="clonedDelete-${spoolClonedId}-${nextSpoolIndex}" type="button" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash saveIcon"></i>
                </button>
                </td>
              </tr>
              `
  );

  await updateProfileDrop();
  await updatePrinterDrops();
  document.getElementById(
    `spoolsProfile-${spoolClonedId}-${nextSpoolIndex}`
  ).selectedIndex = 0;
  const spoolPrinterAssignment = document.getElementById(
    `spoolsPrinterAssignment-${spoolClonedId}-${nextSpoolIndex}`
  );
  spoolPrinterAssignment.selectedIndex = 0;

  document
    .getElementById(`clonedSave-${spoolClonedId}-${nextSpoolIndex}`)
    .addEventListener("click", async function () {
      const clonedRow = document.getElementById(
        `clonedRow-${spoolClonedId}-${nextSpoolIndex}`
      );
      const addedSpool = addSpool(
        document.getElementById(
          `clonedName-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `spoolsProfile-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `clonedPrice-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `clonedWeight-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `clonedUsed-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `clonedToolOffset-${spoolClonedId}-${nextSpoolIndex}`
        ),
        document.getElementById(
          `clonedBedOffset-${spoolClonedId}-${nextSpoolIndex}`
        )
      );
      if (addedSpool) {
        // Remove Row
        clonedRow.remove();
      }

      await reRenderPageInformation();
    });

  document
    .getElementById(`clonedDelete-${spoolClonedId}-${nextSpoolIndex}`)
    .addEventListener("click", function () {
      const clonedRow = document.getElementById(
        `clonedRow-${spoolClonedId}-${nextSpoolIndex}`
      );
      clonedRow.remove();
    });
};
