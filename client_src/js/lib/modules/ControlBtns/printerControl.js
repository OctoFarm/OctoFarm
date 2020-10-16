function getPrinterControlBtn(printer) {
  const printerControlBtn = `
      <button  
            title="Control Your Printer"
            id="printerButton-${printer._id}"
                     type="button"
                     class="tag btn btn-primary btn-sm"
                     data-toggle="modal"
                     data-target="#printerManagerModal" disabled
            ><i class="fas fa-print"></i>
      </button>
    `;
  return printerControlBtn;
}

export function addPrinterControlBtn(printer, element) {
  let printerControlBtn = getPrinterControlBtn(printer);
  element.insertAdjacentHTML("beforeend", printerControlBtn);
}

function addPrinterControlListeners() {}
