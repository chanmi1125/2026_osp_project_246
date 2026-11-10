// 로그인 페이지 · common/login
document.addEventListener('DOMContentLoaded', () => {
  // 비밀번호 보기 / 숨기기
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';

      input.type = show ? 'text' : 'password';
      btn.classList.toggle('is-on', show);
      btn.setAttribute(
        'aria-label',
        show ? '비밀번호 숨기기' : '비밀번호 보기'
      );
    });
  });

  const form = document.querySelector('.login-form');
  const error = document.getElementById('login-error');
  if (!form || !error) return;

  // 서버의 flash 메시지를 경고창과 본문에 표시
  const messagesNode = document.getElementById('login-messages');
  const messages = messagesNode
    ? JSON.parse(messagesNode.textContent)
    : [];

  if (messages.length > 0) {
    error.textContent = messages.join(' ');
    error.hidden = false;

    messages.forEach((message) => {
      window.alert(message);
    });
  }

  // 빈 입력만 차단하고, 나머지는 Flask 서버로 제출
  form.addEventListener('submit', (event) => {
    const idInput = form.elements.namedItem('user_id');
    const pwInput = form.elements.namedItem('password');

    if (!idInput.value.trim() || !pwInput.value) {
      event.preventDefault();
      error.textContent = '아이디와 비밀번호를 모두 입력해 주세요';
      error.hidden = false;
      return;
    }
  });
});
