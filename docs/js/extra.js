$(document).on("click", ".navbar-nav", function(e) {
  if ($(e.target).is("a")) {
    $(".navbar-collapse").collapse("hide");
  }
});
