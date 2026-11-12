document.addEventListener("DOMContentLoaded", function () {

  const productImage = document.querySelector(".detail-image img");
  const reserveButton = document.querySelector(".reserve-button");
  const qtyOutput = document.getElementById("reserve-qty");
  const totalOutput = document.getElementById("reserve-total");

  if (productImage) {
    const hideImage = () => { productImage.style.display = "none"; };
    productImage.addEventListener("error", hideImage);
    if (productImage.complete && productImage.naturalWidth === 0) hideImage();
  }

  if (!reserveButton) return;

  const price = Number(reserveButton.dataset.price) || 0;
  const max = Math.max(1, Number(reserveButton.dataset.max) || 1);
  let qty = 1;

  function render() {
    qtyOutput.textContent = qty;
    totalOutput.textContent = (price * qty).toLocaleString("ko-KR") + "원";
    document.querySelector('.qty-step[data-step="-1"]').disabled = qty <= 1;
    document.querySelector('.qty-step[data-step="1"]').disabled = qty >= max;
  }

  if (qtyOutput) {
    document.querySelectorAll(".qty-step").forEach((button) =>
      button.addEventListener("click", () => {
        qty = Math.min(max, Math.max(1, qty + Number(button.dataset.step)));
        render();
      })
    );
    render();
  }

  reserveButton.addEventListener("click", () => {
    const d = reserveButton.dataset;
    const params = new URLSearchParams({
      name: d.productId, qty, total: price * qty,
      discount: d.discount, pickup: d.pickup, store: d.store, address: d.address,
    });
    location.href = d.doneUrl + "?" + params.toString();
  });
});
