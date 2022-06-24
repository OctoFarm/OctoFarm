export const updateCameraImage = (printerID, cameraURL) => {
    const currentCameraElement = document.getElementById(`camera-${printerID}`)
    if(!!currentCameraElement){
        currentCameraElement.src = cameraURL;
    }
}
