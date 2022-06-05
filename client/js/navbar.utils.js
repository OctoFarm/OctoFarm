document.addEventListener("DOMContentLoaded", function () {
  const showOnOpen = () => {
    setTimeout(() => {
      const serverVersion = document.getElementById("versionInformation");
      serverVersion.classList.toggle("d-none");
      const octoFarmNavLogo = document.getElementById("octofarmNavLogo");
      octoFarmNavLogo.classList.toggle("d-none");
      const navTitle = document.getElementById("navTitle");
      navTitle.classList.toggle("d-none");
    },200)

  }
  const showNavbar = (toggleId, navId, bodyId, headerId, headerIconId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId),
      body = document.getElementById(bodyId),
      header = document.getElementById(headerId),
      headericon = document.getElementById(headerIconId);


    console.log(toggle)
    console.log(nav)
    console.log(body)
    console.log(headericon)

    // Validate that all variables exist
    if (toggle && nav && body && header && headericon) {
      console.log("EXISTS")
      toggle.addEventListener("click", () => {
        console.log("Toggle")
        // show navbar
        nav.classList.toggle("show");
        // change icon
        // headericon.classList.add("fa-solid fa-xmark");
        // add padding to body
        body.classList.toggle("body-pd");
        // add padding to header
        header.classList.toggle("body-pd");
        showOnOpen();
      });
    }
  };

  showNavbar("header-toggle", "nav-bar", "body-pd", "header", "header-icon");

  /*===== LINK ACTIVE =====*/
  const linkColor = document.querySelectorAll(".nav_link");

  function colorLink() {
    if (linkColor) {
      linkColor.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    }
  }
  linkColor.forEach((l) => l.addEventListener("click", colorLink));

  // Your code to run since DOM is loaded and ready
});
