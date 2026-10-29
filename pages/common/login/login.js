// 로그인 페이지 · common/login

document.addEventListener('DOMContentLoaded', () => {
  // 비밀번호 보기/숨기기
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.classList.toggle('is-on', show);
      btn.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
    });
  });

  // 빈칸 확인
  const form = document.querySelector('.login-form');
  const error = document.getElementById('login-error');

  form.addEventListener('submit', (e) => {
    const id = form.user_id.value.trim();
    const pw = form.password.value;

    if (!id || !pw) {
      e.preventDefault();
      error.textContent = '아이디와 비밀번호를 모두 입력해 주세요';
      error.hidden = false;
      return;
    }

    // TODO: 백엔드 연결 후 아래 두 줄 지우고 서버로 제출
    e.preventDefault();
    location.href = form.dataset.next;
  });
});
