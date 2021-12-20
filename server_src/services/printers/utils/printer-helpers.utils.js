const mapStateToCategory = (state) => {
  if (state === "Operational") {
    return { name: "secondary", category: "Idle" };
  }
  if (state === "Paused") {
    return { name: "warning", category: "Idle" };
  }
  if (state === "Printing") {
    return { name: "warning", category: "Active" };
  }
  if (state === "Pausing") {
    return { name: "warning", category: "Active" };
  }
  if (state === "Cancelling") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Starting") {
    return { name: "warning", hex: "#583c0e", category: "Active" };
  }
  if (state === "Error!") {
    return { name: "danger", hex: "#2e0905", category: "Error!" };
  }
  if (state === "Offline") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Searching...") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Disconnected") {
    return { name: "danger", hex: "#2e0905", category: "Disconnected" };
  }
  if (state === "No-API") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Complete") {
    return { name: "success", hex: "#00330e", category: "Complete" };
  }
  if (state === "Shutdown") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Online") {
    return { name: "success", hex: "#00330e", category: "Idle" };
  }
  if (state === "Offline after error") {
    return { name: "danger", hex: "#2e0905", category: "Error!" };
  }
  return { name: "warning", hex: "#583c0e", category: "Idle" };
};

module.exports = {
  mapStateToCategory
};
