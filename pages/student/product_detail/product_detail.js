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

  // 상품 좋아요 기능 (AJAX: 페이지 새로고침 없이 버튼만 바뀜)
  if (likeButton) {
    const likeUrl = likeButton.dataset.likeUrl;
    const likeMessage = document.getElementById("like-message");
    let liked = false;

    // 좋아요 상태를 버튼에 표시
    function showLikeState(value) {
      liked = value;
      likeButton.classList.toggle("liked", liked);
      likeButton.setAttribute("aria-pressed", String(liked));
      likeButton.setAttribute("aria-label", liked ? "좋아요 취소" : "좋아요");
    }

    // 처음 열었을 때 서버에서 좋아요 상태 불러오기
    async function loadLikeState() {
      try {
        const response = await fetch(likeUrl);
        if (response.status === 401) {
          throw new Error("로그인하면 좋아요를 누를 수 있어요.");
        }
        if (!response.ok) {
          throw new Error("좋아요 상태를 불러오지 못했어요.");
        }
        const data = await response.json();
        showLikeState(data.liked);
        likeButton.disabled = false;
      } catch (error) {
        likeMessage.textContent = error.message;
      }
    }

    // 클릭하면 반대 상태를 서버에 저장
    likeButton.addEventListener("click", async () => {
      const nextState = !liked;
      likeMessage.textContent = "";
      likeButton.disabled = true;

      try {
        const response = await fetch(likeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": likeButton.dataset.csrfToken,
          },
          body: JSON.stringify({ liked: nextState }),
        });
        if (response.status === 401) {
          throw new Error("로그인하면 좋아요를 누를 수 있어요.");
        }
        if (!response.ok) {
          throw new Error("좋아요를 저장하지 못했어요. 다시 시도해 주세요.");
        }
        const data = await response.json();
        showLikeState(data.liked);
      } catch (error) {
        likeMessage.textContent = error.message;
      } finally {
        likeButton.disabled = false;
      }
    });

    loadLikeState();
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