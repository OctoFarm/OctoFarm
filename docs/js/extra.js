$(document).on("click", ".navbar-toggleable-xs.in", function(e) {
  if ($(e.target).is("a")) {
    $(this).collapse("hide");
  }
});
