document.addEventListener("DOMContentLoaded", function () {
  const page = document.querySelector(".student-reviews");
  if (!page) return;

  const reviewList = page.querySelector("#review-list");
  const reviewCards = Array.from(page.querySelectorAll(".review-card"));
  const categoryButtons = page.querySelectorAll(".category-filter");
  const reviewCount = page.querySelector("#review-count");
  const pagination = page.querySelector("#review-pagination");
  const emptyMessage = page.querySelector("#empty-reviews");

  const sortTrigger = page.querySelector("#review-sort-trigger");
  const sortLabel = page.querySelector("#review-sort-label");
  const sortSheet = page.querySelector("#review-sort-sheet");
  const sortBackdrop = page.querySelector("#review-sort-backdrop");
  const sortClose = page.querySelector("#review-sort-close");
  const sortOptions = page.querySelectorAll(".review-sort-option");

  const itemsPerPage = 5;
  let selectedCategory = "all";
  let selectedLabel = "전체";
  let selectedSort = "recent";
  let currentPage = 1;

  function openSortSheet() {
    sortSheet.hidden = false;
    document.body.classList.add("review-sort-open");
    sortTrigger.setAttribute("aria-expanded", "true");
  }

  function closeSortSheet() {
    sortSheet.hidden = true;
    document.body.classList.remove("review-sort-open");
    sortTrigger.setAttribute("aria-expanded", "false");
  }

  sortTrigger.addEventListener("click", openSortSheet);
  sortBackdrop.addEventListener("click", closeSortSheet);
  sortClose.addEventListener("click", closeSortSheet);

  sortOptions.forEach(function (button) {
    button.addEventListener("click", function () {
      selectedSort = button.dataset.sort;
      sortLabel.textContent = button.querySelector("span").textContent;

      sortOptions.forEach(function (option) {
        const active = option === button;
        option.classList.toggle("active", active);
        option.setAttribute("aria-pressed", String(active));
      });

      currentPage = 1;
      updateReviews();
      closeSortSheet();
    });
  });

  function createPageButton(label, targetPage, isArrow, disabled) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "pagination-button";
    button.textContent = label;
    button.disabled = disabled;

    if (isArrow) {
      button.classList.add("arrow");

      button.setAttribute(
        "aria-label",
        label === "‹" ? "이전 페이지" : "다음 페이지"
      );
    } else {
      button.setAttribute("aria-label", label + "페이지");

      if (targetPage === currentPage) {
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
      }
    }

    button.addEventListener("click", function () {
      currentPage = targetPage;
      updateReviews();

      reviewList.scrollIntoView({
      behavior: "smooth",
      block: "start"
      });
    });

    return button;
  }

  function updatePagination(totalPages, totalReviews) {
    pagination.replaceChildren();

    if (totalReviews === 0) return;

    pagination.append(
      createPageButton(
        "‹",
        Math.max(1, currentPage - 1),
        true,
        currentPage === 1
      )
    );

    const startPage = Math.max(
      1,
      Math.min(currentPage - 2, totalPages - 4)
    );

    const endPage = Math.min(totalPages, startPage + 4);

    for (let number = startPage; number <= endPage; number++) {
      pagination.append(
        createPageButton(String(number), number, false, false)
      );
    }

    pagination.append(
      createPageButton(
        "›",
        Math.min(totalPages, currentPage + 1),
        true,
        currentPage === totalPages
      )
    );
  }

  function updateReviews() {
    const filtered = reviewCards.filter(function (card) {
      return selectedCategory === "all" ||
             card.dataset.category === selectedCategory;
    });

    filtered.sort(function (a, b) {
      const ratingA = Number(a.dataset.rating);
      const ratingB = Number(b.dataset.rating);
      const dateCompare = b.dataset.date.localeCompare(a.dataset.date);

      if (selectedSort === "high") {
        return ratingB - ratingA || dateCompare;
      }

      if (selectedSort === "low") {
        return ratingA - ratingB || dateCompare;
      }

      return dateCompare;
    });

    const totalPages = Math.max(
      1,
      Math.ceil(filtered.length / itemsPerPage)
    );

    currentPage = Math.min(currentPage, totalPages);

    filtered.forEach(function (card) {
      reviewList.appendChild(card);
    });

    reviewCards.forEach(function (card) {
      card.hidden = true;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;

    filtered
      .slice(startIndex, startIndex + itemsPerPage)
      .forEach(function (card) {
        card.hidden = false;
      });

    const number = document.createElement("strong");
    number.textContent = filtered.length + "개";

    reviewCount.replaceChildren(
      document.createTextNode(selectedLabel + " 리뷰 "),
      number
    );

    emptyMessage.hidden = filtered.length !== 0;

    updatePagination(totalPages, filtered.length);
  }

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectedCategory = button.dataset.category;
      selectedLabel = button.textContent.trim();
      currentPage = 1;

      categoryButtons.forEach(function (categoryButton) {
        const active = categoryButton === button;

        categoryButton.classList.toggle("active", active);
        categoryButton.setAttribute("aria-pressed", String(active));
      });

      updateReviews();
    });
  });

  updateReviews();
});
