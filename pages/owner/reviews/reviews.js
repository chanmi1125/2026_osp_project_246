document.addEventListener("DOMContentLoaded", function () {
  const page = document.querySelector(".received-reviews");
  if (!page) return;

  const filterButtons = page.querySelectorAll(".review-filter");
  const reviewCards = page.querySelectorAll(".review-card");
  const pendingCount = page.querySelector("#pending-count");
  const reviewList = page.querySelector("#review-list");

  let selectedFilter = "all";

  const storageKey = "ewhapick-owner-review-replies-v1";

  let savedReplies = {};

  try {
    savedReplies = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch (error) {
    savedReplies = {};
  }

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

  reviewCards.forEach(function (card) {
    const reply = savedReplies[card.dataset.reviewId];
    if (typeof reply === "string" && reply.trim()) {
      showReply(card, reply);
    }
  });

  function updateReviews() {
    let pending = 0;

    reviewCards.forEach(function (card) {
      const isPending = card.dataset.replied === "false";

      if (isPending) pending++;

      card.hidden = selectedFilter === "pending" && !isPending;
    });

    pendingCount.textContent = pending;
  }

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

  reviewList.addEventListener("submit", function (event) {
    const form = event.target.closest(".reply-form");
    if (!form) return;

    event.preventDefault();

    const input = form.querySelector(".reply-input");
    const reply = input.value.trim();
    if (!reply) return;

    const card = form.closest(".review-card");
    showReply(card, reply);

    savedReplies[card.dataset.reviewId] = reply;

    try {
      localStorage.setItem(storageKey, JSON.stringify(savedReplies));
    } catch (error) {
    }

    updateReviews();
  });

  updateReviews();
});