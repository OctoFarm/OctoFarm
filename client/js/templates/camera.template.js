const hideMe = "d-none";

export const drawCamera = (id, { url, flipV, flipH, rotate90, hidden, aspectRatio, modal = "" }) => {
  let changeAspect = "";
  switch(aspectRatio) {
    case("16x9"):
      changeAspect = " sixteen-by-nine";
      break;
    case("4x3"):
      changeAspect = " four-by-three";
      break;
    case("1x1"):
      changeAspect = " one-by-one";
      break;
    default:
      break;
  }

  return `<img
        loading="lazy"
        class="camImg ${hidden ? hideMe : ""}${changeAspect}"
        id="camera${modal}-${id}"
        width="100%"
        style="transform: ${flipH} ${flipV} ${rotate90}"
        src="${url}"
     alt=""/>`;
};
