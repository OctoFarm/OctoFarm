import OctoFarmClient from "./services/octofarm-client.service";
import { getSingleStatTemplate } from "./templates/bootstrap.templates";
import Calc from "./utils/calc"
import e from "./utils/elements";

const systemInformationModal = document.getElementById("informationSystemModal");
const updateInterval = 20000;
const releasesURL = "https://github.com/OctoFarm/OctoFarm/releases/tag/";
const npmURL = "https://www.npmjs.com/package/@notexpectedyet/octofarm-client";
let interval;
let elements;

const grabSystemElements = () => {
    return {
        internetConnection: e.get("si-internet-connection"),
        poweredBy: e.get("si-powered-by"),
        runningUnder: e.get("si-running-under"),
        nodeEnvironment: e.get("si-node-environment"),
        cpuDonut: e.get("si-cpu-usage-donut"),
        memoryDonut: e.get("si-memory-usage-donut"),
        historyUsageGraph: e.get("si-history-usage-graph"),
        octofarmUptime: e.get("si-octofarm-uptime"),
        clientVersion:  e.get("si-client-version"),
        serverVersion:  e.get("si-server-version"),
        timezone:  e.get("si-timezone"),
        systemUptime:  e.get("si-system-uptime"),
        operatingSystem:  e.get("si-operating-system"),
        systemArch:  e.get("si-system-arch"),
        diskUsage:  e.get("si-disk-usage")
    }
}


const updatePageData = async () => {
    if(!elements){
        elements = grabSystemElements();
    }
    const { clientVersion, serverVersion, serviceInformation, systemEnvironment, systemInformation } = await OctoFarmClient.getSystemInformation();


    const internetConnected = {
        additionalInformation: "Internet <br> Connected",
        icon: "fa-solid fa-infinity",
        type: "success"
    }
    const internetDisconnected = {
        additionalInformation: "Internet <br> Disconnected",
        icon: "fa-solid fa-heart-crack",
        type: "warning"
    }
    elements.internetConnection.innerHTML =  getSingleStatTemplate(!serviceInformation?.airGapped ? internetConnected : internetDisconnected)


    elements.poweredBy.innerHTML = getSingleStatTemplate({
        icon: "fa-brands fa-node text-success",
        additionalInformation: "Powered By <br> NodeJs"
    });

    let runningUnder = {
        icon: "fa-solid fa-bullseye",
        additionalInformation: "PM2 <br> Service"
    };

    if(serviceInformation?.isNodemon){
        runningUnder = {
            icon: "fa-solid fa-circle-nodes",
            additionalInformation: "Nodemon <br> Service"
        }
    }

    if(serviceInformation?.isDockerContainer){
        runningUnder = {
            icon: "fa-brands fa-docker",
            additionalInformation: "Docker <br> Container"
        }
    }

    elements.runningUnder.innerHTML = getSingleStatTemplate(runningUnder);

    let environment = {
        additionalInformation: "Production <br> Environment",
        icon: "fa-solid fa-heart"
    }

    if(systemEnvironment === "development"){
        environment = {
            additionalInformation: "Development <br> Environment",
            icon: "fa-solid fa-code"
        }
    }

    elements.nodeEnvironment.innerHTML = getSingleStatTemplate(environment);
    // elements.cpuDonut.innerHTML = getSingleStatTemplate();
    // elements.memoryDonut.innerHTML = getSingleStatTemplate();
    // elements.historyUsageGraph.innerHTML = getSingleStatTemplate();

    elements.octofarmUptime.innerHTML = getSingleStatTemplate({
        additionalInformation: `OctoFarm Uptime <br> ${Calc.generateTime(systemInformation?.uptime)}`,
        icon: "fa-solid fa-hourglass"
    });
    elements.clientVersion.innerHTML = getSingleStatTemplate({
        linkTitle: `Client Version <br> v${clientVersion}`,
        link: npmURL,
        icon: "fa-solid fa-code-branch"
    });
    elements.serverVersion.innerHTML = getSingleStatTemplate({
        linkTitle: `Server Version <br> v${serverVersion}`,
        link: `${releasesURL}${serverVersion}`,
        icon: "fa-solid fa-code-branch"
    });
    elements.timezone.innerHTML = getSingleStatTemplate({
        additionalInformation: `${systemInformation?.timezoneName ? systemInformation.timezoneName : "Unknown"}<br>${systemInformation?.timezone ? systemInformation.timezone : "Unkown"}`,
        icon: "fa-solid fa-hourglass"
    });
    elements.systemUptime.innerHTML = getSingleStatTemplate({
        additionalInformation: `System Uptime <br> ${Calc.generateTime(systemInformation?.osUptime)}`,
        icon: "fa-solid fa-hourglass"
    });
    elements.operatingSystem.innerHTML = getSingleStatTemplate({
        additionalInformation: `OS <br> ${systemInformation?.distro ? systemInformation.distro : "Unknown"}`,
        icon: "fa-solid fa-server"
    });
    elements.systemArch.innerHTML = getSingleStatTemplate({
        additionalInformation: `Architechture <br> ${systemInformation?.architecture ? systemInformation.architecture : "Unknown"}`,
        icon: "fa-solid fa-building-columns"
    });
    elements.diskUsage.innerHTML = getSingleStatTemplate({
        additionalInformation: `System Disk (${systemInformation?.systemDisk?.mount ? systemInformation.systemDisk.mount : "Unknown"}) <br> ${ Calc.bytes(systemInformation?.systemDisk?.size) } (${ systemInformation?.systemDisk?.use?.toFixed(2) }%)`,
        icon: "fa-solid fa-server"
    });
}

systemInformationModal.addEventListener("show.bs.modal", async () => {
    await updatePageData();
    if(!interval){
        interval = setInterval(async () => {
            await updatePageData();
        }, updateInterval)
    }
})

systemInformationModal.addEventListener("hide.bs.modal", () => {
    if(!!interval){
        clearInterval(interval);
        interval = null;
        elements = null;
    }
})
