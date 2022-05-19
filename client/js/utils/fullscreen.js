export default function doubleClickFullScreen(element) {
  if (element.type == "submit") {
    return;
  }
  element.requestFullscreen();
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}
