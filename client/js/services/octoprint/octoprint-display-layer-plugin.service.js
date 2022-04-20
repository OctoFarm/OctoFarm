const formatLayerDataPercent = (currentLayer, totalLayer) => {
    let layerPercent = "0"
    if(currentLayer !== "-" && totalLayer !== "-"){
        layerPercent = (currentLayer / totalLayer * 100).toFixed(0);
    }
    return layerPercent;
}
const formatLayerHeightPercent = (currentHeightFormatted, totalHeightFormatted) => {
    let heightPercent = "0"
    if(currentHeightFormatted !== "-" && totalHeightFormatted !== "-"){
        heightPercent = (currentHeightFormatted / totalHeightFormatted * 100).toFixed(2);
    }
    return heightPercent;
}

export const returnMinimalLayerDataDisplay = (layerData) => {
    const { currentLayer, totalLayer, currentHeightFormatted, totalHeightFormatted } = layerData;
    const layerPercent = formatLayerDataPercent(currentLayer, totalLayer)
    let heightPercent = formatLayerHeightPercent(currentHeightFormatted, totalHeightFormatted)
    return `
        <i class="fa-solid fa-layer-group"></i> ${currentLayer} / ${totalLayer} (${layerPercent}%) | <i class="fa-solid fa-ruler"></i> ${currentHeightFormatted}mm / ${totalHeightFormatted}mm (${heightPercent}%)
    `
}

export const returnExpandedLayerDataDisplay = (layerData) => {
    console.log(layerData)
}