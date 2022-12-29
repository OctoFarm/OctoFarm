document.addEventListener("DOMContentLoaded", function () {
    const toggleNavBarItems = () => {
        setTimeout(() => {
            const serverVersion = document.getElementById("versionInformation"),
                navTitle = document.getElementById("navTitle"),
                nav = document.getElementById("nav-bar"),
                body = document.getElementById("body-pd"),
                header = document.getElementById("header");

            serverVersion.classList.toggle("slow-hide");
            navTitle.classList.toggle("slow-hide");
            nav.classList.toggle("expand-nav");
            // change icon
            body.classList.toggle("body-pd");
            // add padding to header
            header.classList.toggle("body-pd");
        },200)

    }
    const showNavbar = (toggleId) => {
        const toggle = document.getElementById(toggleId)

        // Validate that all variables exist
        if (toggle) {
            toggle.addEventListener("click", () => {
                toggleNavBarItems();
            });
        }
    };

    showNavbar("header-toggle");
});