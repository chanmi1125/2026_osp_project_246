document.addEventListener('DOMContentLoaded', () => {
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
