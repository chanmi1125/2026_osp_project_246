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

document.querySelectorAll("button.more-btn").forEach((button) => {
  const rows = button.closest(".tab-panel").querySelectorAll(".list-row[hidden]");
  if (!rows.length) {
    button.hidden = true;
    return;
  }
  button.addEventListener("click", () => {
    rows.forEach((row) => (row.hidden = false));
    button.hidden = true;
  });
});
