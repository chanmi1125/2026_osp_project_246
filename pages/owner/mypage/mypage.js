// 마이페이지 · 담당: 박찬미

/* ---------- 오늘 픽업 예정 / 등록한 상품 탭 전환 (페이지 이동 없음) ---------- */
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
