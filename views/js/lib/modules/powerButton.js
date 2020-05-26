

export default class PowerButton {
    static returnPowerBtn(printer){
        let powerBtn = `
             <button title="Toggle your printers power"
                                    id="printerPower-${printer._id}"
                                    class="btn btn-danger btn-sm" type="button">
                                <i id="printerStatus-${printer._id}" class="textActive fas fa-power-off"></i>
                            </button>
                            <button title="Other power actions" type="button" class="btn btn-sm btn-danger dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <div class="dropdown-menu text-center">
                                <a id="printerPowerOff-${printer._id}" title="Turn off your printer" class="dropdown-item d-none" href="#"><i class="textActive fas fa-power-off"></i> Power Off Printer</a>
                                <a id="printerPowerOn-${printer._id}" title="Turn on your printer" class="dropdown-item d-none" href="#"><i class="textComplete fas fa-power-off"></i> Power On Printer</a>
                                <div id="printerDropDownMaker-${printer._id}" class="dropdown-divider d-none"></div>
                                <a id="printerRestartOctoPrint-${printer._id}" title="Restart OctoPrint Service" class="dropdown-item" href="#"><i class="textActive fas fa-redo"></i> Restart OctoPrint</a>
                                <a id="printerRestartHost-${printer._id}" title="Reboot OctoPrint Host" class="dropdown-item" href="#"><i class="textActive fas fa-sync-alt"></i> Reboot Host</a>
                                <a id="printerShutdownHost-${printer._id}" title="Shutdown OctoPrint Host" class="dropdown-item" href="#"><i class="textActive fas fa-power-off"></i> Shutdown Host</a>
                            </div>
            `
        return powerBtn
    }
    static applyBtn(printer){
        console.log("APPLY")
    }
    static applyState(printer){

    }
    static powerOff(printer){

    }
    static powerOn(printer){}
    static powerToggle(printer){}
    static restartOctoPrint(printer){
    }
    static restartHost(printer){

    }
    static shutdownHost(printer){}
}