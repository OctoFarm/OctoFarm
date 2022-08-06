const mapStateToCategory = (state) => {
  if (state === "Operational") {
    return { name: "secondary", category: "Idle" };
  }
  if (state === "Paused") {
    return { name: "warning text-dark", category: "Idle" };
  }
  if (state === "Printing from SD") {
    return { name: "warning text-dark", category: "Active" };
  }
  if (state === "Printing") {
    return { name: "warning text-dark", category: "Active" };
  }
  if (state === "Pausing") {
    return { name: "warning text-dark", category: "Active" };
  }
  if (state === "Cancelling") {
    return { name: "warning text-dark", hex: "#583c0e", category: "Active" };
  }
  if (state === "Starting") {
    return { name: "warning text-dark", hex: "#583c0e", category: "Active" };
  }
  if (state === "Error!") {
    return { name: "danger", hex: "#2e0905", category: "Error!" };
  }
  if (state === "Offline") {
    return { name: "danger", hex: "#2e0905", category: "Offline" };
  }
  if (state === "Re-Sync") {
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
  if (state === "Setting Up") {
    return { name: "info", hex: "#2e0905", category: "Info" };
  }
  if (state === "Searching...") {
    return { name: "info", hex: "#2e0905", category: "Info" };
  }
  if (state === "Disabled") {
    return { name: "dark", hex: "#2e0905", category: "Disabled" };
  }
  return { name: "warning text-dark", hex: "#583c0e", category: "Active" };
};

module.exports = {
  mapStateToCategory
};
