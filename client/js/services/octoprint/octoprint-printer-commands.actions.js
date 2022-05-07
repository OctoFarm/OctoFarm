import OctoPrintClient from "./octoprint-client.service";
import bulkActionsStates from "../../pages/printer-manager/bulk-actions.constants";

export async function printerPreHeatChamber(printer, chamberTemp) {
  let chamberData = {
    command: "target",
    target: 0,
  };
  if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
    chamberData.target = parseInt(chamberTemp.value);
  }
  //Set chamber temp
  if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
    let post = await OctoPrintClient.post(
      printer,
      "printer/chamber",
      chamberData
    );
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: "Chamber successfully set at " + chamberData.target + "°C",
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message: "Failed to set chamber temp!",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Failed to contact OctoPrint, is it online?",
      };
    }
  }
}
export async function printerPreHeatBed(printer, bedTemp) {
  let bedData = {
    command: "target",
    target: 0,
  };
  if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
    bedData.target = parseInt(bedTemp.value);
  }
  //Set bed temp
  if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
    let post = await OctoPrintClient.post(printer, "printer/bed", bedData);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: "Bed successfully set at " + bedData.target + "°C",
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message: "Failed to set bed temp!",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Failed to contact OctoPrint, is it online?",
      };
    }
  }
}
export async function printerPreHeatTool(printer, toolTemp, toolNumber) {
  let toolData = {
    command: "target",
    targets: {},
  };
  if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
    toolData.targets["tool" + toolNumber.value] = parseInt(toolTemp.value);
  }
  if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
    let post = await OctoPrintClient.post(printer, "printer/tool", toolData);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message:
            "Tool(s) successfully set at " +
            toolData.targets["tool" + toolNumber.value] +
            "°C",
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message: "Failed to set Tool(s) temp!",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Failed to contact OctoPrint, is it online?",
      };
    }
  }
}

export async function printerStartPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "start",
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerPausePrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "pause",
    action: "pause",
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerRestartPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "restart",
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerResumePrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "pause",
    action: "resume",
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerStopPrint(printer, e) {
  e.target.disabled = true;
  const opts = {
    command: "cancel",
  };
  await OctoPrintClient.jobAction(printer, opts, e);
}

export async function printerMoveAxis(e, printer, axis, dir) {
  await OctoPrintClient.move(e, printer, "jog", axis, dir);
}

export async function printerHomeAxis(e, printer, axis) {
  await OctoPrintClient.move(e, printer, "home", axis);
}

export async function printerSendGcode(printer, result) {
  let lines = result.match(/[^\r\n]+/g);
  lines = lines.map(function (name) {
    if (!name.includes("=")) {
      return name.toLocaleUpperCase();
    } else {
      return name;
    }
  });
  const opt = {
    commands: lines,
  };
  const post = await OctoPrintClient.post(printer, "printer/command", opt);
  if (post.status === 204) {
    return {
      status: bulkActionsStates.SUCCESS,
      message: "Successfully sent your gcode script to the client!",
    };
  } else {
    return {
      status: bulkActionsStates.ERROR,
      message: "Failed to send your gcode script to the client!",
    };
  }
}

export async function printerEmergencyStop(printer) {
  const opt = {
    commands: ["M112"],
  };
  const { status } = await OctoPrintClient.post(
    printer,
    "printer/command",
    opt
  );
  if (status === 204) {
    return {
      status: bulkActionsStates.SUCCESS,
      message: "Emergency stop has successfully been actioned!",
    };
  } else {
    return {
      status: bulkActionsStates.ERROR,
      message: "Emergency stop failed to send!",
    };
  }
}

export async function printerHomeAllAxis(printer) {
  const opt = {
    commands: ["G28"],
  };
  const { status } = await OctoPrintClient.post(
    printer,
    "printer/command",
    opt
  );
  if (status === 204) {
    return {
      status: bulkActionsStates.SUCCESS,
      message: "Home printer command has successfully been actioned!",
    };
  } else {
    return {
      status: bulkActionsStates.ERROR,
      message: "Home printer command failed to send!",
    };
  }
}

export async function printerTurnOffHeaters(printer) {
  const opt = {
    commands: ["M104 S0", "M140 S0"],
  };
  const { status } = await OctoPrintClient.post(
    printer,
    "printer/command",
    opt
  );
  if (status === 204) {
    return {
      status: bulkActionsStates.SUCCESS,
      message:
        "Turn off printers heaters command has successfully been actioned!",
    };
  } else {
    return {
      status: bulkActionsStates.ERROR,
      message: "Turn off printers heaters command failed to send!",
    };
  }
}
