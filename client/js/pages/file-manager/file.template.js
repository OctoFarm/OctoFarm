export const getFolderTemplate = (folder, id) => {
    return `
    <a
              id="file-${folder.name}"
              href="#"
              class="list-group-item list-group-item-action flex-column align-items-start bg-dark folderAction"
              style="display: block;
                padding: 0.7rem 0.1rem;"
            >
              <div class="row">
                <div
                  class="col-lg-1"
                  style="display:flex; justify-content:center; align-items:center;"
                >
                  <center><i class="fas fa-folder fa-2x"></i></center>
                </div>
                <div class="col-lg-11">
                  <small class="float-right"></small>
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1 float-left">
                      ${folder.display.replace(/_/g, " ")}
                    </h5>
                    <div
                      class="float-right btn-group flex-wrap btn-group-sm"
                      role="group"
                      aria-label="Basic example"
                    >
                      <button id="${id}*folderActionMove*${
        folder.name
    }" type="button" class="btn btn-warning">
                        <i class="fas fa-people-carry"></i> Move
                      </button>
                      <button id="${id}*folderActionDelete*${
        folder.name
    }" type="button" class="btn btn-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </a>
    `
}
