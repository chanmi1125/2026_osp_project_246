// 회원가입 페이지 · common/signup

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.signup-form');
  const tabs = document.querySelectorAll('.signup-tab');
  const userType = document.getElementById('user-type');
  const studentBox = document.querySelector('.only-student');
  const ownerBox = document.querySelector('.only-owner');
  const studentFoot = document.querySelector('.only-student-foot');
  const submitBtn = document.getElementById('signup-submit');
  const formError = document.getElementById('form-error');

  // 숨겨진 칸은 비활성화해서 제출·검사에서 빠지게 함
  function setBoxEnabled(box, enabled) {
    box.hidden = !enabled;
    box.querySelectorAll('input').forEach((input) => {
      input.disabled = !enabled;
    });
  }

  // 1. 학생 / 사장님 탭 전환
  function switchType(type) {
    tabs.forEach((tab) => {
      const on = tab.dataset.type === type;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on);
    });
    userType.value = type;
    setBoxEnabled(studentBox, type === 'student');
    setBoxEnabled(ownerBox, type === 'owner');
    studentFoot.hidden = type === 'owner';
    submitBtn.textContent = type === 'owner' ? '사장님으로 가입하기' : '회원가입하기';
    formError.hidden = true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchType(tab.dataset.type));
  });

  // 2. 아이디 중복 확인
  const idInput = document.getElementById('su-id');
  const idMsg = document.getElementById('id-msg');
  let idChecked = false;

  function showMsg(el, text, ok) {
    el.textContent = text;
    el.classList.toggle('is-ok', ok);
    el.classList.toggle('is-error', !ok);
    el.hidden = false;
  }

  document.getElementById('check-id').addEventListener('click', () => {
    const id = idInput.value.trim();

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(id)) {
      idChecked = false;
      showMsg(idMsg, '영문, 숫자, _ 로 4~20자 입력해 주세요', false);
      return;
    }

    // TODO: 백엔드 연결 후 서버에 중복 여부 물어보기
    // fetch(`/check-id?user_id=${encodeURIComponent(id)}`).then(...)
    idChecked = true;
    showMsg(idMsg, '사용할 수 있는 아이디예요', true);
  });

  // 아이디를 바꾸면 다시 확인 필요
  idInput.addEventListener('input', () => {
    idChecked = false;
    idMsg.hidden = true;
  });

  // 3. 비밀번호 일치 확인
  const pw = document.getElementById('su-pw');
  const pw2 = document.getElementById('su-pw2');
  const pwMsg = document.getElementById('pw-msg');

  function checkPw() {
    if (!pw2.value) {
      pwMsg.hidden = true;
      return;
    }
    const same = pw.value === pw2.value;
    showMsg(pwMsg, same ? '비밀번호가 일치해요' : '비밀번호가 일치하지 않아요', same);
    pw2.classList.toggle('is-error', !same);
  }

  pw.addEventListener('input', checkPw);
  pw2.addEventListener('input', checkPw);

  // 4. 제출 전 검사
  form.addEventListener('submit', (e) => {
    let message = '';

    if (!idChecked) {
      message = '아이디 중복 확인을 해 주세요';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pw.value)) {
      message = '비밀번호는 영문, 숫자 포함 8자 이상이어야 해요';
    } else if (pw.value !== pw2.value) {
      message = '비밀번호가 일치하지 않아요';
    } else {
      // 보이는 칸 중 비어 있는 필수 칸 찾기
      const empty = [...form.querySelectorAll('input[required]:not([disabled])')]
        .find((input) => input.type !== 'checkbox' && !input.value.trim());
      if (empty) {
        message = '필수 항목(*)을 모두 입력해 주세요';
        empty.focus();
      } else if (!document.getElementById('su-agree').checked) {
        message = '이용약관에 동의해 주세요';
      }
    }

    if (message) {
      e.preventDefault();
      formError.textContent = message;
      formError.hidden = false;
      return;
    }

    // TODO: 백엔드 연결 후 아래 두 줄 지우고 서버로 제출
    e.preventDefault();
    location.href = form.dataset.next;
  });

  switchType('student');
});
