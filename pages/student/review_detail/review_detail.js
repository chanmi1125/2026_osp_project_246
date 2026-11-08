// 리뷰 상세 · 담당: 김지우
document.addEventListener('DOMContentLoaded', function () {
  // 리뷰 사진이 없으면(리뷰를 찾을 수 없는 화면 등) 아무것도 하지 않음
  const gallery = document.querySelector('.review-gallery');
  if (!gallery) return;
 
  // 확대 팝업 · 확대 사진 · 이전/다음 버튼
  const dialog = document.getElementById('review-photo-dialog');
  const expanded = document.getElementById('expanded-review-photo');
  const prev = document.getElementById('photo-prev');
  const next = document.getElementById('photo-next');
 
  // 팝업에서 넘겨볼 사진 목록
  const thumbnails = Array.from(gallery.querySelectorAll('.review-thumbnails [data-photo]'));
  const photos = (thumbnails.length ? thumbnails : [gallery.querySelector('.review-main-photo')]).map(button => button.querySelector('img'));
 
  // index: 지금 보고 있는 사진 번호 / opener: 팝업을 연 버튼(닫은 뒤 포커스 복귀용)
  let index = 0, opener = null;
 
  // n번째 사진을 팝업에 표시
  function showPhoto(n) {
    index = Math.max(0, Math.min(n, photos.length - 1));
    expanded.src = photos[index].src;
    expanded.alt = photos[index].alt;
    prev.disabled = index === 0;
    next.disabled = index === photos.length - 1;
    document.getElementById('photo-position').textContent = (index + 1) + ' / ' + photos.length;
  }
 
  // 확대 팝업 열기
  gallery.addEventListener('click', function (event) {
    const button = event.target.closest('[data-photo]');
    if (!button) return;
    opener = button;
    showPhoto(Number(button.dataset.photo));
    dialog.showModal();
  });
 
  // 이전 / 다음 사진, 닫기 버튼
  prev.addEventListener('click', () => showPhoto(index - 1));
  next.addEventListener('click', () => showPhoto(index + 1));
  document.getElementById('photo-close').addEventListener('click', () => dialog.close());
 
  // 키보드 좌우 방향키로 사진 넘기기
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(index + 1); }
  });
 
  // 팝업 바깥(어두운 배경) 클릭하면 닫기
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
 
  // 팝업이 닫히면 팝업을 연 사진 버튼으로 포커스 복귀
  dialog.addEventListener('close', () => { if (opener) opener.focus(); });
});