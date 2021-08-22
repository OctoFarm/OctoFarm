import Noty from "noty";

function createNotificationPopUp(event) {
  let alert = new Noty({
    type: event.type,
    theme: "bootstrap-v4",
    closeWith: ["click"],
    timeout: event.notification_timeout,
    layout: "bottomRight",
    text: `${event.message}`,
    animation: {
      open: "animated fadeInRight",
      close: "animated fadeOutRight"
    }
  });
  alert.show();
  return alert;
}

export { createNotificationPopUp };
