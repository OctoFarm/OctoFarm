import UI from "../../utils/ui";
const formatLayerDataPercent = (currentLayer, totalLayer) => {
  let layerPercent = "0";
  if (currentLayer !== "-" && totalLayer !== "-") {
    layerPercent = ((currentLayer / totalLayer) * 100).toFixed(0);
  }
  return layerPercent;
};
const formatLayerHeightPercent = (
  currentHeightFormatted,
  totalHeightFormatted
) => {
  let heightPercent = "0";
  if (currentHeightFormatted !== "-" && totalHeightFormatted !== "-") {
    heightPercent = (
      (currentHeightFormatted / totalHeightFormatted) *
      100
    ).toFixed(0);
  }
  return heightPercent;
};

export const returnMinimalLayerDataDisplay = (layerData) => {
  const {
    currentLayer,
    totalLayer,
    currentHeightFormatted,
    totalHeightFormatted,
  } = layerData;
  const layerPercent = formatLayerDataPercent(currentLayer, totalLayer);
  let heightPercent = formatLayerHeightPercent(
    currentHeightFormatted,
    totalHeightFormatted
  );
  return `
        <i class="fa-solid fa-layer-group"></i> ${currentLayer} / ${totalLayer} (${layerPercent}%) | <i class="fa-solid fa-ruler"></i> ${currentHeightFormatted}mm / ${totalHeightFormatted}mm (${heightPercent}%)
    `;
};

export const returnExpandedLayerDataDisplay = (layerData) => {
  const {
    currentLayer,
    totalLayer,
    currentHeightFormatted,
    totalHeightFormatted,
    averageLayerDurationInSeconds,
    lastLayerDurationInSeconds,
    fanspeed,
    feedrate,
  } = layerData;
  const layerPercent = formatLayerDataPercent(currentLayer, totalLayer);
  let heightPercent = formatLayerHeightPercent(
    currentHeightFormatted,
    totalHeightFormatted
  );
  let averageLayerDuration = 0;
  if (averageLayerDurationInSeconds !== "-") {
    averageLayerDuration = averageLayerDurationInSeconds;
  }
  let lastLayerDuration = 0;
  if (lastLayerDurationInSeconds !== "-") {
    lastLayerDuration = lastLayerDurationInSeconds;
  }
  return {
    layerData: `
            <i class="fa-solid fa-layer-group"></i> ${currentLayer} / ${totalLayer} (${layerPercent}%) 
        `,
    heightData: `
            <i class="fa-solid fa-ruler"></i> ${currentHeightFormatted}mm / ${totalHeightFormatted}mm (${heightPercent}%)
        `,
    averageLayerDuration: `
            <i class="fa-solid fa-gauge"></i> ${UI.generateMilisecondsTime(
              averageLayerDuration * 1000
            )}
        `,
    lastLayerTime: `
            <i class="fa-solid fa-stopwatch"></i> ${UI.generateMilisecondsTime(
              lastLayerDuration * 1000
            )}
        `,
    currentFanSpeed: `
            <i class="fa-solid fa-fan"></i> ${fanspeed}
        `,
    currentFeedRate: `
            <i class="fa-solid fa-paint-roller"></i> ${feedrate}
        `,
  };
};
