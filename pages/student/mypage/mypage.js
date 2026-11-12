const tabs = document.querySelectorAll('[role="tab"]');

tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", selected);
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
  })
);
