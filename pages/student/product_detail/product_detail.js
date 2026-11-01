
/* 상품 상세 페이지 · 담당: 윤한솔 */

document.addEventListener("DOMContentLoaded", function () {

    // HTML 요소 가져오기
    const productImage = document.querySelector(".detail-image img");
    const reserveButton = document.querySelector(".reserve-button");
  
    // 상품 이미지 오류 처리
    if (productImage) {
  
      function handleImageError() {
        productImage.style.display = "none";
      }
  
      // 이미지 로딩 실패 시
      productImage.addEventListener("error", handleImageError);
  
      // 페이지 로딩 전에 이미지 오류가 발생한 경우
      if (productImage.complete && productImage.naturalWidth === 0) {
        handleImageError();
      }
    }
  
    // 예약하기 버튼
    if (reserveButton) {
  
      reserveButton.addEventListener("click", function () {
  
        // HTML에서 상품 ID 가져오기
        const productId = reserveButton.dataset.productId;
  
        // 실제 DB 연결 전 임시 동작
        alert("예약번호는 마이페이지에서 확인해 주세요.");
  
        // TODO: DB 연결 후 예약 처리 구현
        // 상품 ID(productId)를 서버에 전송
        // 예약 성공 시 reserve_done 페이지로 이동
  
      });
    }
  
  });
  
