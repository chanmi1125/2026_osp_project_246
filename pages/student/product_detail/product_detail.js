document.addEventListener("DOMContentLoaded", function () {

  const productImage = document.querySelector(".detail-image img");
  const reserveButton = document.querySelector(".reserve-button");
  const qtyOutput = document.getElementById("reserve-qty");
  const totalOutput = document.getElementById("reserve-total");
  const likeButton = document.getElementById("like-button");

  // 상품 이미지 처리
  if (productImage) {
    const hideImage = () => {
      productImage.style.display = "none";
    };

    productImage.addEventListener("error", hideImage);

    if (productImage.complete && productImage.naturalWidth === 0) {
      hideImage();
    }
  }

  // 상품 좋아요 기능
  if (likeButton) {
    likeButton.addEventListener("click", async () => {

      const itemName = likeButton.dataset.itemName;

      likeButton.disabled = true;

      try {
        const response = await fetch("/toggle_like", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": likeButton.dataset.csrfToken
          },
          body: JSON.stringify({
            item_name: itemName
          })
        });

        // 로그인하지 않은 경우
        if (response.status === 401) {
          alert("로그인 후 이용해주세요.");
          return;
        }

        if (!response.ok) {
          throw new Error("좋아요 처리 실패");
        }

        const data = await response.json();

        // 좋아요 버튼 상태 변경
        likeButton.classList.toggle("liked", data.liked);

        likeButton.setAttribute(
          "aria-pressed",
          String(data.liked)
        );

      } catch (error) {
        console.error(error);
        alert("좋아요 처리 중 오류가 발생했습니다.");

      } finally {
        likeButton.disabled = false;
      }
    });
  }

  // 상품 예약 기능
  if (!reserveButton) return;

  const price = Number(reserveButton.dataset.price) || 0;
  const max = Math.max(1, Number(reserveButton.dataset.max) || 1);

  let qty = 1;

  // 예약 수량 및 가격 표시
  function render() {
    qtyOutput.textContent = qty;

    totalOutput.textContent =
      (price * qty).toLocaleString("ko-KR") + "원";

    document.querySelector(
      '.qty-step[data-step="-1"]'
    ).disabled = qty <= 1;

    document.querySelector(
      '.qty-step[data-step="1"]'
    ).disabled = qty >= max;
  }

  // 수량 조절 버튼
  if (qtyOutput) {
    document.querySelectorAll(".qty-step").forEach((button) =>
      button.addEventListener("click", () => {
        qty = Math.min(
          max,
          Math.max(1, qty + Number(button.dataset.step))
        );

        render();
      })
    );

    render();
  }

  // 예약하기 버튼
  reserveButton.addEventListener("click", () => {

    const d = reserveButton.dataset;

    const params = new URLSearchParams({
      name: d.productId,
      qty,
      total: price * qty,
      discount: d.discount,
      pickup: d.pickup,
      store: d.store,
      address: d.address,
    });

    location.href = d.doneUrl + "?" + params.toString();
  });

});