// 예약 관리 · 담당: 김지우
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.reservations');
  if (!root) return;
 
  // 예약 카드 · 필터 버튼 · 픽업 코드 입력칸(4자리) · 안내 문구 · 확인 팝업
  const cards = Array.from(root.querySelectorAll('.reservation-card'));
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const digits = Array.from(root.querySelectorAll('.pickup-digits input'));
  const feedback = document.getElementById('pickup-feedback');
  const dialog = document.getElementById('pickup-dialog');
 
  // filter: 현재 선택한 필터 / pending: 팝업에서 확인 중인 예약 / opener: 팝업을 연 버튼(닫은 뒤 포커스 복귀용)
  let filter = 'all', pending = null, opener = null;
 
  // 픽업 코드 안내 문구 표시
  function message(text, error = false) {
    feedback.hidden = false;
    feedback.textContent = text;
    feedback.classList.toggle('is-error', error);
    digits.forEach(input => input.setAttribute('aria-invalid', String(error)));
  }
 
  // 필터에 맞게 카드 보이기/숨기기 + 상태별 개수 · 필터 버튼 · 빈 목록 문구 갱신
  function render() {
    const counts = {waiting:0, completed:0, cancelled:0};
    cards.forEach(card => { counts[card.dataset.status]++; card.hidden = filter !== 'all' && card.dataset.status !== filter; });
    document.querySelectorAll('[data-count]').forEach(node => { node.textContent = counts[node.dataset.count]; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    document.getElementById('reservation-empty').hidden = cards.some(card => !card.hidden);
  }
 
  // 필터 버튼 클릭
  filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
 
  // 픽업 코드 입력칸
  digits.forEach((input, i) => {
    // 숫자만 입력, 입력하면 다음 칸으로 이동
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
      input.setAttribute('aria-invalid', 'false');
      if (input.value && i < 3) digits[i + 1].focus();
    });
 
    // 칸에 포커스하면 기존 숫자 전체 선택 (바로 덮어쓰기)
    input.addEventListener('focus', () => input.select());
 
    // 백스페이스(빈 칸이면 이전 칸) · 좌우 방향키로 칸 이동
    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace' && !input.value && i > 0) digits[i - 1].focus();
      if (event.key === 'ArrowLeft' && i > 0) { event.preventDefault(); digits[i - 1].focus(); }
      if (event.key === 'ArrowRight' && i < 3) { event.preventDefault(); digits[i + 1].focus(); }
    });
 
    // 붙여넣기
    input.addEventListener('paste', event => {
      event.preventDefault();
      const text = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
      if (!text) return;
      const start = text.length === 4 ? 0 : i;
      [...text].forEach((char, n) => { if (digits[start + n]) digits[start + n].value = char; });
      digits[Math.min(start + text.length, 3)].focus();
    });
  });
 
  // 픽업 완료 확인 팝업 열기
  function confirm(card, button) {
    pending = card; opener = button;
    document.getElementById('pickup-dialog-description').textContent = card.querySelector('h2').textContent + ' · ' + card.querySelector('.reservation-info p').textContent;
    dialog.returnValue = '';
    dialog.showModal();
  }
 
  // 픽업 코드 확인
  document.getElementById('pickup-code-form').addEventListener('submit', event => {
    event.preventDefault();
    const code = digits.map(input => input.value).join('');
 
    // 4자리를 모두 입력하지 않은 경우
    if (!/^\d{4}$/.test(code)) { message('픽업 코드 4자리를 모두 입력해 주세요.', true); digits.find(input => !input.value)?.focus(); return; }
 
    // 코드와 일치하는 예약이 정확히 1건인지 확인
    const matches = cards.filter(card => card.dataset.code === code);
    if (matches.length !== 1) { message('일치하는 예약을 찾을 수 없습니다. 코드를 다시 확인해 주세요.', true); return; }
 
    // 이미 완료되었거나 취소된 예약은 처리X
    const card = matches[0];
    if (card.dataset.status !== 'waiting') { message(card.dataset.status === 'completed' ? '이미 픽업 완료된 예약입니다.' : '취소된 예약입니다.', true); return; }
 
    confirm(card, event.submitter);
  });
 
  // 카드의 '픽업 완료' 버튼 클릭 → 확인 팝업
  root.addEventListener('click', event => { const button = event.target.closest('.complete-pickup'); if (button) confirm(button.closest('.reservation-card'), button); });
 
  // 팝업이 닫힐 때: '완료'를 눌렀다면 해당 예약을 픽업 완료로 변경
  // TODO: DB 연결 후 픽업 완료 상태를 서버에 저장
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
 
    // 팝업을 연 버튼으로 포커스 복귀
    if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus();
    else digits[0].focus();
    pending = null;
  });
 
  // 처음 화면 그리기
  render();
});