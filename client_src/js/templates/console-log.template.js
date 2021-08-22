export function logToConsole(event) {
  switch (event.color) {
    case "info":
      console.info("INFORMATION: ", JSON.stringify(event.name, undefined, 4));
      console.info("MESSAGE: ", JSON.stringify(event.message, undefined, 4));
      console.info("STACK: ", JSON.stringify(event.stack, undefined, 4));
      break;
    case "warning":
      console.warn("WARNING: ", JSON.stringify(event.name, undefined, 4));
      console.warn("MESSAGE: ", JSON.stringify(event.message, undefined, 4));
      console.warn("STACK: ", JSON.stringify(event.stack, undefined, 4));
      break;
    case "danger":
      console.error("ERROR: ", JSON.stringify(event.name, undefined, 4));
      console.error("MESSAGE: ", JSON.stringify(event.message, undefined, 4));
      console.error("STACK: ", JSON.stringify(event.stack, undefined, 4));
      console.warn("FULL: ", JSON.stringify(event, undefined, 4));
      break;
    default:
      console.error("ERROR: ", JSON.stringify(event.name, undefined, 4));
      console.error("MESSAGE: ", JSON.stringify(event.message, undefined, 4));
      console.error("STACK: ", JSON.stringify(event.stack, undefined, 4));
  }
}
