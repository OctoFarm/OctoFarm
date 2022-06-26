export const spoolsManagerTableRow = (spool, allowMultiSelectIsEnabled) => {
  let multiple = "";
  let unassignSpools = "";
  if (allowMultiSelectIsEnabled) {
    multiple = "multiple=true";
    unassignSpools = `
            <button title="Unassign Spool" id="unassign-${spool._id}" type="button" class="btn btn-sm btn-warning unassign">
                <i class="fa-solid fa-ban text-dark"></i>
            </button>
        `;
  }
  return `
    <tr data-jplist-item id="spoolList-${spool._id}" class="jpSpoolItem">
        <th style="display: none;">${spool._id}</th>
        <th scope="row"><span class="d-none name">${spool.name}</span><input class="form-control" type="text" placeholder="${
          spool.name
        }" disabled></th>
        <td>
            <span class="d-none material" id="spoolsMaterialText-${
              spool._id
            }"></span>
            <select id="spoolsProfile-${
              spool._id
            }" class="form-control" disabled>
            </select>
        </td>
        <td><span class="d-none price">${
          spool.price
        }</span><input class="form-control" type="number" step="0.01" placeholder="${
    spool.price
  }" disabled></td>
        <td><span class="d-none weight">${
          spool.weight
        }</span><input class="form-control" type="number" step="1" placeholder="${
    spool.weight
  }" disabled></td>
        <td><span class="d-none grams">${
          spool.used
        }</span><input class="form-control" type="number" step="1" placeholder="${
    spool.weight - spool.used
  }" disabled></td>
        <td><input class="form-control" type="number" step="any" placeholder="${
          spool.tempOffset || 0
        }" disabled></td>
        <td><input class="form-control" type="number" step="any" placeholder="${
          spool.bedOffset || 0
        }" disabled></td>
        <td>

            <select id="spoolsPrinterAssignment-${
              spool._id
            }" class="form-control" ${multiple}>
        </select>
    </td>
        <td>
            ${unassignSpools}
            <button title="Clone Spool" id="clone-${
              spool._id
            }" type="button" class="btn btn-sm btn-success clone">
                <i class="far fa-copy"></i>
            </button>
            <button title="Edit Spool" id="edit-${
              spool._id
            }" type="button" class="btn btn-sm btn-primary edit">
                <i class="fas fa-edit editIcon"></i>
            </button>
            <button title="Save Spool" id="save-${
              spool._id
            }" type="button" class="btn btn-sm d-none btn-success save">
                <i class="fas fa-save saveIcon"></i>
            </button>
            <button title="Delete Spool" id="delete-${
              spool._id
            }" type="button" class="btn btn-sm btn-danger delete">
                <i class="fas fa-trash deleteIcon"></i>
            </button>
        </td>
    </tr>`;
};

export const profileManagerTableRow = (profile) => {
  return ` 
    <tr data-jplist-item id="profileList-${profile._id}" class="jpProfileItem">
        <td class="d-none">
            ${profile._id}
        </td>
        <td>
            <label>
                <input class="form-control"  type="text" placeholder="${profile.manufacturer}" disabled>
            </label>
        </td>
        <td>
            <label>
                <input class="form-control"  type="text" placeholder="${profile.material}" disabled>
            </label>
        </td>
        <td>
            <label>
                <input class="form-control"  type="number" step="0.01" placeholder="${profile.density}" disabled>
            </label>
        </td>
        <td>
            <label>
                <input class="form-control"  type="number" step="0.01" placeholder="${profile.diameter}" disabled>
            </label>
        </td>
        <td>
            <button id="edit-${profile._id}" type="button" class="btn btn-sm btn-info edit bg-colour-1">
                <i class="fas fa-edit editIcon"></i>
            </button>
            <button id="save-${profile._id}" type="button" class="btn d-none btn-sm btn-success save bg-colour-2">
                <i class="fas fa-save saveIcon"></i>
            </button>
            <button id="delete-${profile._id}" type="button" class="btn btn-sm btn-danger delete">
                <i class="fas fa-trash deleteIcon"></i>
            </button>
        </td>
    </tr>
    `;
};

export const materialsFilterList = (material) => {
  return `
      <option href="#" data-path=".${material.toLowerCase().replace(/ /g, "_").replace(/[^\w\s]/gi, "_")}">${material}</option>
    `;
};

export const materialsListTableRow = (material) => {
  return `
        <td><i class="fa-solid fa-brush"></i></td>
        <td>${material.code}</td>
        <td>${material.display}</td>
        <td>${material.abbr}</td>
        <td>${material.density}</td>
    `;
};
