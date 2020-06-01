import UI from "../functions/ui.js"
import OctoFarmclient from "../octofarm.js";

document.getElementById("testScript").addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
  let elements = Script.grabPage();
  let errors = Script.checkPage(elements);
  if(errors.length > 0){
      UI.createAlert("warning", "There are issues with your input, please correct the highlighted fields", 3000, "Clicked")
      errors.forEach(error => {
        if(error === "script"){
            elements.script.style.borderColor = "red";
        }
        if(error === "message"){
            elements.message.style.borderColor = "red";
        }
        if(error === "trigger"){
            elements.trigger.style.borderColor = "red";
        }
      })
  }else{
      elements.script.style.borderColor = "green";
      elements.message.style.borderColor = "green";
      elements.trigger.style.borderColor = "green";
      Script.test(elements.script.value, elements.message.value);
  }
});
document.getElementById("saveScript").addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    let elements = Script.grabPage();
    let errors = Script.checkPage(elements);
    if(errors.length > 0){
        UI.createAlert("warning", "There are issues with your input, please correct the highlighted fields", 3000, "Clicked")
        errors.forEach(error => {
            if(error === "script"){
                elements.script.style.borderColor = "red";
            }
            if(error === "message"){
                elements.message.style.borderColor = "red";
            }
            if(error === "trigger"){
                elements.trigger.style.borderColor = "red";
            }
        })
    }else{
        elements.script.style.borderColor = "green";
        elements.message.style.borderColor = "green";
        elements.trigger.style.borderColor = "green";
        Script.save([], elements.trigger.value, elements.script.value, elements.message.value);
    }
});

export default class Script {
    static async get(){
       let post = await OctoFarmclient.get("scripts/get");
       post = await post.json();
       let alertsTable = document.getElementById("alertsTable")
       if(post.status === 200){
           post.alerts.forEach(alert => {
               if(alert.printer.length === 0){
                   alert.printer = "All Printers"
               }
               alertsTable.insertAdjacentHTML('beforeend', `
                <tr>
                <td class="d-none">
                    ${alert._id}
                </td>
                <td>  <div class="custom-control custom-checkbox">
                          <input type="checkbox" class="custom-control-input" id="customCheck1">
                          <label class="custom-control-label" for="customCheck1">Check this custom checkbox</label>
                        </div>  
                </td>
                <td>  
                      ${alert.trigger}
                </td> 
                <td>    
                        ${alert.scriptLocation}
                </td>
                <td>    
                                        ${alert.message}
                </td>
                <td>
                         ${alert.printer}
                </td>
                </tr>
           `)
           })

       }else{
           alertsTable.insertAdjacentHTML('beforeend' `
                           <tr class="d-none">

                </td>
                <td>  
                </td>
                <td>  

                </td> 
                <td>    
                    No Alerts Found
                </td>
                <td>    

                </td>
                <td>

                </td>
                </tr>`)
       }
    }
    static async edit(printer, trigger, scriptLocation, message){
        if(printer){

        }else{

        }
    }
    static async save(printer, trigger, scriptLocation, message){
        let opts = {
            printer: printer,
            trigger: trigger,
            scriptLocation: scriptLocation,
            message: message,
        }
        let post = await OctoFarmclient.post("scripts/save", opts);
        post = await post.json();
        if(post.status !== 200){
            UI.createAlert("error", "Failed to save your alert!", 3000, "Clicked");
        }else{
            UI.createAlert("success", "Successfully saved your alert!", 3000, "Clicked")
        }

    }
    static async test(scriptLocation, message){
        let opts = {
            scriptLocation: scriptLocation,
            message: message
        }
        let post = await OctoFarmclient.post("scripts/test", opts)
        post = await post.json();
        if(typeof post.testFire === "object"){
            UI.createAlert("error", post.testFire.stderr, 3000, "Clicked");
        }else{
            UI.createAlert("success", post.testFire, 3000, "Clicked")
        }
    }
    static checkPage(elements){
        let errors = []

        if(elements.script.value === ""){
            errors.push("script")
        }
        if(elements.trigger.value === "0"){
            errors.push("trigger")
        }
        if(elements.message.value === ""){
            errors.push("message")
        }
        return errors;
    }
    static grabPage(){
        return {
            trigger: document.getElementById("alertsTrigger"),
            script: document.getElementById("scriptLocation"),
            message: document.getElementById("scriptMessage")
        };
    }
}
Script.get();