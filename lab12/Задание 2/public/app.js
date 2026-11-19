'use strict';
let me = null;

function render() {
  $('#guest').hidden = !!me;
  $('#user').hidden = !me;
  if (me) $('#who').textContent = me.name;
}

async function loadBooks() {
  const { data } = await api('GET', '/api/books');
  const ul = $('#books');
  ul.replaceChildren();
  for (const b of data.books) {
    const li = h('li', {}, h('span', {}, `${b.title} — ${b.author}, ${b.year}`));
    if (me && b.owner === me.username) {
      li.append(h('button', { class: 'small danger', type: 'button', onclick: () => removeBook(b.id) }, 'Удалить'));
    }
    ul.append(li);
  }
}

async function removeBook(id) {
  const { status, data } = await api('DELETE', '/api/books/' + id);
  if (status === 200) setStatus('Запись удалена', 'ok');
  else if (status === 401) return sessionLost(data);
  else setStatus(`${data?.error || 'Ошибка'} (${status})`, 'error');
  loadBooks();
}

function sessionLost(data) {
  me = null;
  render();
  setStatus(data?.code === 'session_expired' ? data.error : 'Требуется вход', 'error');
  loadBooks();
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = $('#login').value.trim();
  const password = $('#password').value;
  if (!login || !password) return setStatus('Введите логин и пароль', 'error');
  const { status, data } = await api('POST', '/api/login', { login, password });
  $('#password').value = '';
  if (status === 200) {
    me = data.user;
    setStatus('Вход выполнен', 'ok');
    render();
    loadBooks();
  } else {
    setStatus(data?.error || 'Ошибка входа', 'error');
  }
});

$('#logout').addEventListener('click', async () => {
  if (!window.confirm('Вы действительно хотите выйти?')) return;
  await api('POST', '/api/logout');
  me = null;
  render();
  setStatus('Вы вышли из системы', 'ok');
  loadBooks();
});

$('#addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { title: $('#title').value, author: $('#author').value, year: $('#year').value };
  const { status, data } = await api('POST', '/api/books', body);
  if (status === 201) {
    setStatus('Книга добавлена', 'ok');
    e.target.reset();
    loadBooks();
  } else if (status === 401) {
    sessionLost(data);
  } else {
    setStatus(`${data?.error || 'Ошибка'} (${status})`, 'error');
  }
});

(async () => {
  const { status, data } = await api('GET', '/api/session');
  if (status === 200) me = data.user;
  else if (data?.code === 'session_expired') setStatus(data.error, 'error');
  render();
  loadBooks();
})();
