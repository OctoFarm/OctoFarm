// Create the drop down template
const printerDrop = document.getElementById("printerSelection");

export function setupClientSwitchDropDown(
  currentPrinterId,
  printerControlList,
  onChangeFunction,
  forceCreate
) {
  // Create call back function refereance
  const changeEventFunction = (event) => {
    if (document.getElementById("printerControls")) {
      document.getElementById("printerControls").innerHTML = "";
    }
    document.getElementById("pmStatus").innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById("pmStatus").className = "btn btn-secondary mb-2";
    //Load Connection Panel
    document.getElementById("printerPortDrop").innerHTML = "";
    document.getElementById("printerBaudDrop").innerHTML = "";
    document.getElementById("printerProfileDrop").innerHTML = "";
    document.getElementById("printerConnect").innerHTML = "";
    onChangeFunction(event.target.value);
  };

  if (forceCreate) {
    if (printerDrop) {
      printerDrop.innerHTML = "";
      printerControlList.forEach((list) => {
        if (list.state.category !== "Offline") {
          printerDrop.insertAdjacentHTML(
            "beforeend",
            `
                <option value="${list.printerID}" selected>${list.printerName}</option>
            `
          );
        }
      });
    }
  }

  printerDrop.value = currentPrinterId;
  if (printerDrop.getAttribute("listener") === null) {
    printerDrop.addEventListener("change", changeEventFunction, false);
    printerDrop.setAttribute("listener", "true");
  }

  // Insert into the client
  // Select the current printer
}
