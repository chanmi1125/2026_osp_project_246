document.addEventListener("DOMContentLoaded", function () {

    const productImage = document.querySelector(".detail-image img");
    const reserveButton = document.querySelector(".reserve-button");
  
    if (productImage) {
  
      function handleImageError() {
        productImage.style.display = "none";
      }
  
      productImage.addEventListener("error", handleImageError);
  
      if (productImage.complete && productImage.naturalWidth === 0) {
        handleImageError();
      }
    }
  
    if (reserveButton) {
  
      reserveButton.addEventListener("click", function () {
  
        const productId = reserveButton.dataset.productId;
  
        alert("예약번호는 마이페이지에서 확인해 주세요.");
  
  
      });
    }
  
  });
  
