$(document).on("click", ".navbar-nav", function(e) {
  console.log("clicked");
  console.log(e.target);
  if ($(e.target).is("a")) {
    $(".navbar-collapse").collapse("hide");
  }
});
