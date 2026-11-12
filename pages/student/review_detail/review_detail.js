document.addEventListener('DOMContentLoaded', function () {
  const gallery = document.querySelector('.review-gallery');
  if (!gallery) return;
 
  const dialog = document.getElementById('review-photo-dialog');
  const expanded = document.getElementById('expanded-review-photo');
  const prev = document.getElementById('photo-prev');
  const next = document.getElementById('photo-next');
 
  const thumbnails = Array.from(gallery.querySelectorAll('.review-thumbnails [data-photo]'));
  const photos = (thumbnails.length ? thumbnails : [gallery.querySelector('.review-main-photo')]).map(button => button.querySelector('img'));
 
  let index = 0, opener = null;
 
  function showPhoto(n) {
    index = Math.max(0, Math.min(n, photos.length - 1));
    expanded.src = photos[index].src;
    expanded.alt = photos[index].alt;
    prev.disabled = index === 0;
    next.disabled = index === photos.length - 1;
    document.getElementById('photo-position').textContent = (index + 1) + ' / ' + photos.length;
  }
 
  gallery.addEventListener('click', function (event) {
    const button = event.target.closest('[data-photo]');
    if (!button) return;
    opener = button;
    showPhoto(Number(button.dataset.photo));
    dialog.showModal();
  });
 
  prev.addEventListener('click', () => showPhoto(index - 1));
  next.addEventListener('click', () => showPhoto(index + 1));
  document.getElementById('photo-close').addEventListener('click', () => dialog.close());
 
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(index + 1); }
  });
 
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
 
  dialog.addEventListener('close', () => { if (opener) opener.focus(); });
});