// 리뷰 작성 · 담당: 유지우

const form = document.getElementById("review-form");
const stars = form.querySelectorAll(".star");
const ratingInput = document.getElementById("rating");
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photo-preview");
const photoEmpty = document.getElementById("photo-empty");
const errorText = document.getElementById("form-error");

// 별 클릭 → 그 점수까지 채우기
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

// 사진 고르면 미리보기
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoPreview.hidden = !file;
  photoEmpty.hidden = !!file;
  if (file) {
    photoPreview.src = URL.createObjectURL(file);
    photoInput.previousElementSibling.classList.remove("invalid");
  }
});

// 필수 항목 검사 후 리뷰 목록으로 이동
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
