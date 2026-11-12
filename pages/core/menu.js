const drawer = document.querySelector(".drawer");
const dim = document.querySelector(".drawer-dim");

function setMenu(open) {
  if (!drawer) return;
  drawer.hidden = !open;
  dim.hidden = !open;
}

document.querySelectorAll("[data-menu-open]").forEach((btn) => btn.addEventListener("click", () => setMenu(true)));
document.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
