$("#printerManagerModal").on("hidden.bs.modal", function () {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
  if (document.getElementById("printerControlCamera")) {
    document.getElementById("printerControlCamera").src = "";
  }
});
