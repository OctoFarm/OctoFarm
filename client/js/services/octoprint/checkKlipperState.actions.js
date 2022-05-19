import UI from "../../utils/ui";

export const checkKlipperState = (printer) => {
    const { klipperState, _id } = printer;

    if(typeof klipperState === "undefined"){
        return;
    }

    const klipperElement = document.getElementById("klipperState-"+_id);
    if(!!klipperElement){
        UI.removeDisplayNoneFromElement(klipperElement)
        if(klipperState === "danger"){
            UI.removeClassIfExists(klipperElement, "text-success");
            UI.removeClassIfExists(klipperElement, "text-warning");
            UI.addClassIfDoesNotExist(klipperElement, "text-danger");
        }
        if(klipperState === "warning"){
            UI.removeClassIfExists(klipperElement, "text-success");
            UI.removeClassIfExists(klipperElement, "text-danger");
            UI.addClassIfDoesNotExist(klipperElement, "text-warning");
        }
        if(klipperState === "success"){
            UI.removeClassIfExists(klipperElement, "text-warning");
            UI.removeClassIfExists(klipperElement, "text-danger");
            UI.addClassIfDoesNotExist(klipperElement, "text-success");
        }
    }
}