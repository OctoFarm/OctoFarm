import OctoFarmClient from "./services/octofarm-client.service";
import { patreonTemplate } from "./templates/patreon-data.template";


const patreonDataList = document.getElementById("aboutPatreonsList");
const aboutOctoFarmModal = document.getElementById("aboutModal");



aboutOctoFarmModal.addEventListener("show.bs.modal", async () => {
    if(patreonDataList.innerHTML.includes("spinner")){
        const patreonData = await OctoFarmClient.getPatreonDataList();
        if(!!patreonData){
            patreonDataList.innerHTML = "";
            patreonData.forEach(patreon => {
                patreonDataList.insertAdjacentHTML("beforeend", patreonTemplate(patreon))
            })
        }
    }
})
