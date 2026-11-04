// 받은 리뷰 · 담당: 정난희

document.addEventListener("DOMContentLoaded", function () {
  const page = document.querySelector(".received-reviews");
  if (!page) return;

  const filterButtons = page.querySelectorAll(".review-filter");
  const reviewCards = page.querySelectorAll(".review-card");
  const pendingCount = page.querySelector("#pending-count");
  const reviewList = page.querySelector("#review-list");

  let selectedFilter = "all";

  // DB 연결 전 답글을 임시 저장
  const storageKey = "ewhapick-owner-review-replies-v1";

  // DB 연결 전 브라우저에 저장된 답글 불러오기
  let savedReplies = {};

  try {
    savedReplies = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch (error) {
    savedReplies = {};
  }

  // 답글 등록 후 입력창을 사장님 답글로 변경
  function showReply(card, reply) {
    const form = card.querySelector(".reply-form");
    if (!form) return;

    const replyBox = document.createElement("div");
    replyBox.className = "owner-reply";

    const title = document.createElement("strong");
    title.className = "reply-title";
    title.textContent = "↳ 사장님 답글";

    const content = document.createElement("p");
    content.className = "reply-text";
    content.textContent = reply;

    replyBox.append(title, content);
    form.replaceWith(replyBox);
    card.dataset.replied = "true";
  }

  // 저장된 답글 표시
  reviewCards.forEach(function (card) {
    const reply = savedReplies[card.dataset.reviewId];
    if (typeof reply === "string" && reply.trim()) {
      showReply(card, reply);
    }
  });

  // 전체 / 답글 대기 필터
  function updateReviews() {
    let pending = 0;

    reviewCards.forEach(function (card) {
      const isPending = card.dataset.replied === "false";

      if (isPending) pending++;

      card.hidden = selectedFilter === "pending" && !isPending;
    });

    pendingCount.textContent = pending;
  }

  // 필터 버튼 클릭
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectedFilter = button.dataset.status;

      filterButtons.forEach(function (btn) {
        const active = btn === button;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
      });

      updateReviews();
    });
  });

  // 답글 등록 (페이지 이동 없음)
  reviewList.addEventListener("submit", function (event) {
    const form = event.target.closest(".reply-form");
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector(".reply-input");
    const reply = input.value.trim();
    if (!reply) return;

    const card = form.closest(".review-card");
    showReply(card, reply);

    // TODO: DB 연결 후 답글 서버 저장
    savedReplies[card.dataset.reviewId] = reply;

    try {
      localStorage.setItem(storageKey, JSON.stringify(savedReplies));
    } catch (error) {
      // 저장할 수 없어도 현재 화면에는 답글 표시
    }

    updateReviews();
  });

  updateReviews();
});