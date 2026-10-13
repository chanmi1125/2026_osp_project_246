// Highlight the menu of the current page
const menuLinks = document.querySelectorAll(".navbar__menu a");
menuLinks.forEach((link) => {
    if (link.getAttribute("href") === window.location.pathname) {
        link.style.fontWeight = "bold";
    }
});
