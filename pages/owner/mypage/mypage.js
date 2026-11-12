const tabs = document.querySelectorAll('[role="tab"]');

function selectTab(tab) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", selected);
    document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
  });
}

tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab)));

document.querySelectorAll("[data-open-tab]").forEach((link) =>
  link.addEventListener("click", () => selectTab(document.getElementById(link.dataset.openTab)))
);

if (location.hash === "#products") selectTab(document.getElementById("tab-products"));
