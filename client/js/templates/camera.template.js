//TODO - Improve the camera template
//The camera template isn't very robust, doesn't support multiple stream types, not a custom overlay / full screen option.
const hideMe = "d-none";

export const drawCamera = (id, { url, flipV, flipH, rotate90, hidden }) => {
  return `<img

        class="camImg ${hidden ? hideMe : ""}"
        id="camera-${id}"
        width="100%"
        style="transform: ${flipH} ${flipV} ${rotate90}"
        src="${url}"
     alt=""/>`;
};
