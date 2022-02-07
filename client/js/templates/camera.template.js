//FIXME - Camera work https://github.com/OctoFarm/OctoFarm/projects/34
export const drawCamera = ({ url, flipV, flipH, rotate90 }) => {
    return `<img
        loading="lazy"
        class="camImg"
        id="camera-${printer._id}"
        width="100%"
        style="transform: ${flipH} ${flipV} ${rotate90}";
        src="${url}"
     alt=""/>`;
};