'use strict';
let timerId = null;
let left = 0;

function showGuest(message, kind) {
  clearInterval(timerId);
  $('#private').hidden = true;
  $('#guest').hidden = false;
  setStatus(message, kind);
}

function handle401(data) {
  if (data && data.code === 'session_expired') showGuest(data.error, 'error');
  else showGuest('Требуется вход', 'error');
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function startTimer(sec) {
  left = sec;
  clearInterval(timerId);
  const tick = () => {
    $('#timer').textContent = 'Сессия истекает через ' + fmt(Math.max(left, 0));
    $('#timer').classList.toggle('warn', left <= 60);
    if (left <= 0) {
      clearInterval(timerId);
      showGuest('Сессия истекла. Войдите снова.', 'error');
      return;
    }
    left -= 1;
  };
  tick();
  timerId = setInterval(tick, 1000);
}

async function loadLessons() {
  const { status, data } = await api('GET', '/api/lessons');
  if (status === 401) return handle401(data);
  $('#courseTitle').textContent = 'Курс: ' + data.course;
  const ul = $('#lessons');
  ul.replaceChildren();
  for (const l of data.lessons) {
    ul.append(
      h('li', {}, h('span', {}, `${l.date} — ${l.title}`),
        h('button', { class: 'small secondary', type: 'button', onclick: () => openLesson(l.id) }, 'Открыть')),
    );
  }
}

async function openLesson(id) {
  const box = $('#lessonDetail');
  const { status, data } = await api('GET', '/api/lessons/' + encodeURIComponent(id));
  if (status === 401) return handle401(data);
  if (status === 403) {
    box.hidden = true;
    return setStatus('Доступ запрещён (403): ' + data.error, 'error');
  }
  if (status === 404) {
    box.hidden = true;
    return setStatus('Занятие не найдено (404)', 'error');
  }
  setStatus('');
  box.hidden = false;
  box.replaceChildren(h('b', {}, data.title), h('div', {}, `Дата: ${data.date}`), h('div', {}, data.info));
}

function showPrivate(user, expiresInSec) {
  $('#guest').hidden = true;
  $('#private').hidden = false;
  $('#who').textContent = user.name;
  $('#role').textContent = user.role;
  $('#lessonDetail').hidden = true;
  startTimer(expiresInSec);
  loadLessons();
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = $('#login').value.trim();
  const password = $('#password').value;
  if (!login || !password) return setStatus('Введите логин и пароль', 'error');
  const { status, data } = await api('POST', '/api/login', { login, password });
  $('#password').value = '';
  if (status === 200) {
    setStatus('Вход выполнен', 'ok');
    showPrivate(data.user, data.expiresInSec);
  } else {
    setStatus(data?.error || 'Ошибка входа', 'error');
  }
});

$('#logout').addEventListener('click', async () => {
  await api('POST', '/api/logout');
  showGuest('Вы вышли из системы', 'ok');
});

$('#byIdForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('#lessonId').value;
  if (id) openLesson(id);
});

(async () => {
  const { status, data } = await api('GET', '/api/session');
  if (status === 200) showPrivate(data.user, data.expiresInSec);
  else if (data && data.code === 'session_expired') showGuest(data.error, 'error');
})();
