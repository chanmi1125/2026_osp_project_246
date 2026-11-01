// 상품 목록 · 담당: 윤한솔

document.addEventListener("DOMContentLoaded", function () {

    // HTML 요소 가져오기
    const discountButtons = document.querySelectorAll(".discount-filter");
    const categoryButtons = document.querySelectorAll(".category-filter");
    const productCards = Array.from(document.querySelectorAll(".product-card"));
  
    // 페이지네이션 요소 가져오기
  const pageNumbers = document.getElementById("page-numbers");
  const prevButton = document.querySelector('[data-direction="prev"]');
  const nextButton = document.querySelector('[data-direction="next"]');
  
    // 현재 선택된 필터
    let selectedDiscount = "all";
    let selectedCategory = "all";
  
    // 페이지 설정
    let currentPage = 1;
    const itemsPerPage = 4;
  
    // 필터 적용 + 페이지 표시
    function updateProducts() {
  
      // 선택한 조건에 맞는 상품만 가져오기
      const filteredProducts = productCards.filter(function (card) {
  
        const discount = card.dataset.discount;
        const category = card.dataset.category;
  
        const matchDiscount =
          selectedDiscount === "all" || discount === selectedDiscount;
  
        const matchCategory =
          selectedCategory === "all" || category === selectedCategory;
  
        return matchDiscount && matchCategory;
      });
  
      // 전체 페이지 수 계산
      const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / itemsPerPage)
      );
  
      // 현재 페이지 범위 확인
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }
  
      // 모든 상품 숨기기
      productCards.forEach(function (card) {
        card.hidden = true;
        card.style.display = "none";
      });
  
      // 현재 페이지에 해당하는 상품만 표시
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
  
      filteredProducts
        .slice(startIndex, endIndex)
        .forEach(function (card) {
          card.hidden = false;
          card.style.display = "";
        });
  
      // 페이지 번호 업데이트
      updatePagination(totalPages);
    }
  
    // 페이지네이션 업데이트

    function updatePagination(totalPages) {
        pageNumbers.innerHTML = "";
      
        // 전체 페이지 수만큼 번호 생성
        for (let page = 1; page <= totalPages; page++) {
          const button = document.createElement("button");
      
          button.type = "button";
          button.className = "page-number";
          button.textContent = page;
      
          // 현재 페이지 표시
          if (page === currentPage) {
            button.classList.add("active");
            button.setAttribute("aria-current", "page");
          }
      
          // 페이지 번호 클릭
          button.addEventListener("click", function () {
            currentPage = page;
            updateProducts();
          });
      
          pageNumbers.appendChild(button);
        }
      
        // 이전 / 다음 버튼
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
    }
      
  
  
    // 할인 필터 클릭
    discountButtons.forEach(function (button) {
  
      button.addEventListener("click", function () {
  
        selectedDiscount = button.dataset.discount;
        currentPage = 1;
  
        discountButtons.forEach(function (btn) {
          btn.classList.remove("active");
        });
  
        button.classList.add("active");
  
        updateProducts();
      });
    });
  
    // 카테고리 필터 클릭
    categoryButtons.forEach(function (button) {
  
      button.addEventListener("click", function () {
  
        selectedCategory = button.dataset.category;
        currentPage = 1;
  
        categoryButtons.forEach(function (btn) {
          btn.classList.remove("active");
        });
  
        button.classList.add("active");
  
        updateProducts();
      });
    });

    // 이전 페이지
    if (prevButton) {
      prevButton.addEventListener("click", function () {
  
        if (currentPage > 1) {
          currentPage--;
          updateProducts();
        }
      });
    }
  
    // 다음 페이지
    if (nextButton) {
      nextButton.addEventListener("click", function () {
  
        const filteredCount = productCards.filter(function (card) {
          return (
            (selectedDiscount === "all" ||
              card.dataset.discount === selectedDiscount) &&
            (selectedCategory === "all" ||
              card.dataset.category === selectedCategory)
          );
        }).length;
  
        const totalPages = Math.max(
          1,
          Math.ceil(filteredCount / itemsPerPage)
        );
  
        if (currentPage < totalPages) {
          currentPage++;
          updateProducts();
        }
      });
    }
  
    // 처음 페이지가 열리면 상품 표시
    updateProducts();
  
  });
  