document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.reservations');
  if (!root) return;
 
  const cards = Array.from(root.querySelectorAll('.reservation-card'));
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const digits = Array.from(root.querySelectorAll('.pickup-digits input'));
  const feedback = document.getElementById('pickup-feedback');
  const dialog = document.getElementById('pickup-dialog');
 
  let filter = 'all', pending = null, opener = null;
 
  function message(text, error = false) {
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.classList.toggle('is-error', error);
    digits.forEach(input => input.setAttribute('aria-invalid', String(error)));
  }
 
  function render() {
    const counts = {waiting:0, completed:0, cancelled:0};
    cards.forEach(card => { counts[card.dataset.status]++; card.hidden = filter !== 'all' && card.dataset.status !== filter; });
    document.querySelectorAll('[data-count]').forEach(node => { node.textContent = counts[node.dataset.count]; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    document.getElementById('reservation-empty').hidden = cards.some(card => !card.hidden);
  }
 
  filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
 
  digits.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
      input.setAttribute('aria-invalid', 'false');
      if (input.value && i < 3) digits[i + 1].focus();
    });
 
    input.addEventListener('focus', () => input.select());
 
    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace' && !input.value && i > 0) digits[i - 1].focus();
      if (event.key === 'ArrowLeft' && i > 0) { event.preventDefault(); digits[i - 1].focus(); }
      if (event.key === 'ArrowRight' && i < 3) { event.preventDefault(); digits[i + 1].focus(); }
    });
 
    input.addEventListener('paste', event => {
      event.preventDefault();
      const text = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
      if (!text) return;
      const start = text.length === 4 ? 0 : i;
      [...text].forEach((char, n) => { if (digits[start + n]) digits[start + n].value = char; });
      digits[Math.min(start + text.length, 3)].focus();
    });
  });
 
  function confirm(card, button) {
    pending = card; opener = button;
    document.getElementById('pickup-dialog-description').textContent = card.querySelector('h2').textContent + ' · ' + card.querySelector('.reservation-info p').textContent;
    dialog.returnValue = '';
    dialog.showModal();
  }
 
  document.getElementById('pickup-code-form').addEventListener('submit', event => {
    event.preventDefault();
    const code = digits.map(input => input.value).join('');
 
    if (!/^\d{4}$/.test(code)) { message('픽업 코드 4자리를 모두 입력해 주세요.', true); digits.find(input => !input.value)?.focus(); return; }
 
    const matches = cards.filter(card => card.dataset.code === code);
    if (matches.length !== 1) { message('일치하는 예약을 찾을 수 없습니다. 코드를 다시 확인해 주세요.', true); return; }
 
    const card = matches[0];
    if (card.dataset.status !== 'waiting') { message(card.dataset.status === 'completed' ? '이미 픽업 완료된 예약입니다.' : '취소된 예약입니다.', true); return; }
 
    confirm(card, event.submitter);
  });
 
  root.addEventListener('click', event => { const button = event.target.closest('.complete-pickup'); if (button) confirm(button.closest('.reservation-card'), button); });
 
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'complete' && pending && pending.dataset.status === 'waiting') {
      pending.dataset.status = 'completed';
      pending.querySelector('.reservation-state').textContent = '픽업 완료';
      pending.querySelector('.reservation-soon')?.remove();
      pending.querySelector('.complete-pickup')?.remove();
      digits.forEach(input => { input.value = ''; });
      message(pending.querySelector('h2').textContent + ' 픽업을 완료했습니다.');
      render();
    }
 
    if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus();
    else digits[0].focus();
    pending = null;
  });
 
  render();
});