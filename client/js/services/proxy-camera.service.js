export const updateCameraImage = (printerID, cameraURL) => {
    const currentCameraElement = document.getElementById(`camera-${printerID}`)
    if(!!currentCameraElement){
        currentCameraElement.src = cameraURL;
    }
    const printerCameraControlElements = document.querySelectorAll("*[id^=\"printerCameraControl\"]");
    if(printerCameraControlElements.length > 0){
        const elementToUpdate = _.findIndex(printerCameraControlElements, function(o) {
            const split = o.id.split("-");
            return split[1] === printerID;
        });
        if(!!printerCameraControlElements[elementToUpdate]){
            printerCameraControlElements[elementToUpdate].src = cameraURL;
        }
    }
}
