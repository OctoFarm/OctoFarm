import UI from "./functions/ui.js";

export default class OctoPrintClient{
  static post(printer, item, data) {
    let url = `http://${printer.ip}:${printer.port}/api/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    });
  }
  static async connect(command, printer){
    let opts = null;
    if(command === "connect"){
      opts = {
        command: "connect",
        port: document.getElementById("pmSerialPort").value,
        baudrate: parseInt(document.getElementById("pmBaudrate").value),
        printerProfile: document.getElementById("pmProfile").value
      };
    }else{
      opts = {
        command: "disconnect"
      };
    }
    let post = await OctoPrintClient.post(printer, "connection", opts);
    if(post.status === 204){
      UI.createAlert("success", `Printer: ${printer.index} has ${opts.command}ed successfully.`,3000,"click");
    }else{
      UI.createAlert("danger", `Printer: ${printer.index} could not ${opts.command}.`,3000,"click");
    }
  }
}
