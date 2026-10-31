// 상품 등록 · 담당: 박찬미
const form = document.getElementById("registerForm");
const toastEl = document.getElementById("toast");
const DRAFT_KEY = "ewhapick:product-draft";
const MAX_PHOTOS = 5;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toastEl.hidden = true), 2000);
}

const onlyDigits = (value) => value.replace(/[^0-9]/g, "");
const won = (n) => n.toLocaleString("ko-KR") + "원";

/* ---------- 상품 사진 (최대 5장, 첫 장이 대표) ---------- */
const photoInput = document.getElementById("photoInput");
const photoList = document.getElementById("photoList");
const photoAdd = document.getElementById("photoAdd");
const photoCount = document.getElementById("photoCount");
let photos = [];

function renderPhotos() {
  photoList.querySelectorAll(".photo-item").forEach((el) => {
    URL.revokeObjectURL(el.querySelector("img").src); // 이전 미리보기 메모리 정리
    el.remove();
  });
  photos.forEach((file, i) => {
    const item = document.createElement("div");
    item.className = "photo-item";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = `상품 사진 ${i + 1}`;
    item.appendChild(img);
    if (i === 0) {
      const badge = document.createElement("span");
      badge.className = "main-badge";
      badge.textContent = "대표";
      item.appendChild(badge);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.setAttribute("aria-label", `사진 ${i + 1} 삭제`);
    remove.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M1 1l6 6M7 1 1 7"/></svg>';
    remove.addEventListener("click", () => {
      photos.splice(i, 1);
      renderPhotos();
    });
    item.appendChild(remove);
    photoList.appendChild(item);
  });

  // 서버로 보낼 input.files 도 같은 순서로 맞추기
  const dt = new DataTransfer();
  photos.forEach((file) => dt.items.add(file));
  photoInput.files = dt.files;

  photoCount.textContent = photos.length;
  photoAdd.classList.toggle("is-full", photos.length >= MAX_PHOTOS);
}

photoAdd.addEventListener("click", () => {
  if (photos.length >= MAX_PHOTOS) {
    showToast("사진은 최대 5장까지 올릴 수 있어요");
    return;
  }
  photoInput.click();
});

photoInput.addEventListener("change", () => {
  const picked = Array.from(photoInput.files).filter((f) => f.type.startsWith("image/"));
  const room = MAX_PHOTOS - photos.length;
  if (picked.length > room) showToast("사진은 최대 5장까지 올릴 수 있어요");
  photos = photos.concat(picked.slice(0, room));
  renderPhotos();
});

/* ---------- 픽업 주소 변경 ---------- */
const address = document.getElementById("address");
document.getElementById("addressEdit").addEventListener("click", (e) => {
  address.readOnly = false;
  address.focus();
  address.select();
  e.currentTarget.hidden = true;
});

/* ---------- 글자 수 ---------- */
document.querySelectorAll("[data-counter-for]").forEach((counter) => {
  const target = document.getElementById(counter.dataset.counterFor);
  const update = () => (counter.textContent = `${target.value.length}/${target.maxLength}`);
  target.addEventListener("input", update);
  update();
});

/* ---------- 가격 · 할인율 → 판매가 미리보기 ---------- */
const price = document.getElementById("price");
const rate = document.getElementById("discountRate");

function updatePreview() {
  const p = Number(onlyDigits(price.value)) || 0;
  const r = Math.min(Number(onlyDigits(rate.value)) || 0, 99);
  const sale = Math.round((p * (100 - r)) / 100 / 10) * 10; // 10원 단위 반올림
  document.getElementById("previewRate").textContent = `${r}%`;
  document.getElementById("previewSale").textContent = won(sale);
  document.getElementById("previewOrigin").textContent = won(p);
}

// 입력 중에는 숫자만 남기고, 칸을 벗어날 때 콤마 붙이기 (입력 중 커서가 튀지 않게)
price.addEventListener("input", () => {
  price.value = price.value.replace(/[^0-9,]/g, "");
  updatePreview();
});
price.addEventListener("blur", () => {
  const digits = onlyDigits(price.value);
  price.value = digits ? Number(digits).toLocaleString("ko-KR") : "";
});
rate.addEventListener("input", () => {
  const digits = onlyDigits(rate.value);
  rate.value = digits ? String(Math.min(Number(digits), 99)) : "";
  updatePreview();
});
updatePreview();

/* ---------- 픽업 시간: 칸 어디를 눌러도 시간 선택창 열기 ---------- */
document.querySelectorAll(".time-row .input-box").forEach((box) => {
  const input = box.querySelector("input");
  box.addEventListener("click", () => {
    try { input.showPicker(); } catch { input.focus(); }
  });
});

/* ---------- 판매 수량 스테퍼 ---------- */
const quantity = document.getElementById("quantity");
const minus = document.querySelector(".step.minus");

function setQuantity(n) {
  const q = Math.max(0, Math.min(999, n));
  quantity.value = q;
  minus.disabled = q <= 0;
}
document.querySelectorAll("[data-step]").forEach((btn) =>
  btn.addEventListener("click", () => setQuantity((Number(quantity.value) || 0) + Number(btn.dataset.step)))
);
quantity.addEventListener("input", () => setQuantity(Number(onlyDigits(quantity.value)) || 0));
setQuantity(Number(quantity.value));

/* ---------- 임시저장 (사진 제외, 이 브라우저에만 저장) ---------- */
const DRAFT_FIELDS = ["address", "discount_type", "category", "name", "price", "discount_rate",
  "pickup_start", "pickup_end", "quantity", "status", "description"];

document.getElementById("tempSave").addEventListener("click", () => {
  const data = {};
  DRAFT_FIELDS.forEach((name) => (data[name] = form.elements[name].value));
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    showToast("임시저장했어요 (사진은 다시 올려주세요)");
  } catch {
    showToast("이 브라우저에서는 임시저장을 할 수 없어요");
  }
});

function loadDraft() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(DRAFT_KEY));
  } catch {
    return;
  }
  if (!data) return;
  DRAFT_FIELDS.forEach((name) => {
    if (data[name] !== undefined) form.elements[name].value = data[name];
  });
  form.querySelectorAll("[data-counter-for]").forEach((c) =>
    document.getElementById(c.dataset.counterFor).dispatchEvent(new Event("input"))
  );
  setQuantity(Number(quantity.value));
  updatePreview();
  showToast("임시저장한 내용을 불러왔어요");
}
loadDraft();

/* ---------- 등록하기 (필수 항목 확인) ---------- */
function markInvalid(el, invalid) {
  el.classList.toggle("is-invalid", invalid);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const checks = [
    [photos.length > 0, photoAdd, "상품 사진을 1장 이상 올려주세요"],
    [address.value.trim() !== "", address.closest(".input-box"), "픽업 주소를 입력해주세요"],
    [form.elements.name.value.trim() !== "", form.elements.name.closest(".input-box"), "상품 이름을 입력해주세요"],
    [Number(onlyDigits(price.value)) > 0, price.closest(".input-box"), "정가를 입력해주세요"],
    [Number(rate.value) >= 1 && Number(rate.value) <= 99, rate.closest(".input-box"), "할인율은 1~99% 사이로 입력해주세요"],
    [form.elements.pickup_start.value !== "" && form.elements.pickup_end.value !== ""
      && form.elements.pickup_start.value < form.elements.pickup_end.value,
      form.elements.pickup_end.closest(".input-box"), "픽업 종료 시간이 시작 시간보다 늦어야 해요"],
    [Number(quantity.value) >= 1, quantity.closest(".stepper"), "판매 수량을 1개 이상 입력해주세요"],
  ];

  let firstError = null;
  checks.forEach(([ok, el, message]) => {
    markInvalid(el, !ok);
    if (!ok && !firstError) firstError = { el, message };
  });

  if (firstError) {
    showToast(firstError.message);
    firstError.el.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // 두 번 눌러서 두 번 등록되지 않게 막기
  form.querySelector('[type="submit"]').disabled = true;

  // TODO: 서버 저장 라우트 생기면 아래 두 줄 대신 form.submit() 으로 보내기
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  showToast("상품을 등록했어요");
  setTimeout(() => (location.href = form.dataset.doneUrl), 800);
});

// 입력하면 빨간 테두리 지우기
form.addEventListener("input", (e) => {
  const box = e.target.closest(".is-invalid");
  if (box) box.classList.remove("is-invalid");
});
photoInput.addEventListener("change", () => markInvalid(photoAdd, false));
