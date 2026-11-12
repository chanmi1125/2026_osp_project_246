const form = document.getElementById("review-form");
const stars = form.querySelectorAll(".star");
const ratingInput = document.getElementById("rating");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photo-preview");
const photoEmpty = document.getElementById("photo-empty");
const errorText = document.getElementById("form-error");

stars.forEach((star) => {
  star.addEventListener("click", () => {
    const value = Number(star.dataset.value);
    ratingInput.value = value;
    stars.forEach((s) => {
      const on = Number(s.dataset.value) <= value;
      s.classList.toggle("on", on);
      s.setAttribute("aria-checked", Number(s.dataset.value) === value);
    });
    star.parentElement.classList.remove("invalid");
  });
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoPreview.hidden = !file;
  photoEmpty.hidden = !!file;
  if (file) {
    photoPreview.src = URL.createObjectURL(file);
    photoInput.previousElementSibling.classList.remove("invalid");
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  let ok = true;

  form.querySelectorAll("input.input, textarea").forEach((el) => {
    const empty = !el.value.trim();
    el.classList.toggle("invalid", empty);
    if (empty) ok = false;
  });

  if (ratingInput.value === "0") {
    stars[0].parentElement.classList.add("invalid");
    ok = false;
  }

  if (!photoInput.files.length) {
    photoInput.previousElementSibling.classList.add("invalid");
    ok = false;
  }

  errorText.hidden = ok;
  if (ok) location.href = form.dataset.next;
});
