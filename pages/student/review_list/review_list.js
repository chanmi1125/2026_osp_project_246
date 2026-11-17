document.addEventListener("DOMContentLoaded", function () {
  const trigger = document.getElementById("review-sort-trigger");
  const sheet = document.getElementById("review-sort-sheet");
  if (!trigger || !sheet) return;

  function setOpen(open) {
    sheet.hidden = !open;
    document.body.classList.toggle("review-sort-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  }

  trigger.addEventListener("click", function () { setOpen(true); });
  document.getElementById("review-sort-backdrop").addEventListener("click", function () { setOpen(false); });
  document.getElementById("review-sort-close").addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) setOpen(false);
  });
});
