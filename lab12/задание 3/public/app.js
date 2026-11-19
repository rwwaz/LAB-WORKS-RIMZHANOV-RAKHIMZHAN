'use strict';
let me = null;

const EVENT_LABELS = {
  login_ok: 'Успешный вход',
  login_fail: 'Неудачный вход',
  login_locked: 'Вход заблокирован',
  logout: 'Выход',
  session_expired: 'Сессия истекла',
  access_denied: 'Отказ в доступе (403)',
  user_created: 'Создан пользователь',
  user_deleted: 'Удалён пользователь',
  role_changed: 'Изменена роль',
};

function showGuest(message, kind) {
  me = null;
  $('#private').hidden = true;
  $('#guest').hidden = false;
  setStatus(message, kind);
}

function handleFail(status, data) {
  if (status === 401) {
    showGuest(data?.code === 'session_expired' ? data.error : 'Требуется вход', 'error');
  } else {
    setStatus(`${data?.error || 'Ошибка'} (${status})`, 'error');
  }
}

function showPrivate(user) {
  me = user;
  $('#guest').hidden = true;
  $('#private').hidden = false;
  $('#who').textContent = user.name;
  const role = $('#role');
  role.textContent = user.role;
  role.className = 'badge ' + user.role;
  $('#admin').hidden = user.role !== 'admin';
  if (user.role === 'admin') {
    loadUsers();
    loadAudit();
  }
}

async function loadUsers() {
  const { status, data } = await api('GET', '/api/users');
  if (status !== 200) return handleFail(status, data);
  const body = $('#usersBody');
  body.replaceChildren();
  for (const u of data.users) {
    const self = u.username === me.username;
    const select = h('select', { 'aria-label': 'Роль ' + u.username, onchange: (e) => changeRole(u.username, e.target.value) },
      h('option', {}, 'user'), h('option', {}, 'admin'));
    select.value = u.role;
    select.disabled = self;
    const del = h('button', { class: 'small danger', type: 'button', onclick: () => deleteUser(u.username) }, 'Удалить');
    del.disabled = self;
    body.append(h('tr', {}, h('td', {}, u.username), h('td', {}, u.name), h('td', {}, select), h('td', {}, del)));
  }
}

async function changeRole(username, role) {
  const { status, data } = await api('PATCH', '/api/users/' + username, { role });
  if (status === 200) setStatus(`Роль пользователя ${username} изменена`, 'ok');
  else handleFail(status, data);
  loadUsers();
  loadAudit();
}

async function deleteUser(username) {
  const { status, data } = await api('DELETE', '/api/users/' + username);
  if (status === 200) setStatus(`Пользователь ${username} удалён`, 'ok');
  else handleFail(status, data);
  loadUsers();
  loadAudit();
}

async function loadAudit() {
  const { status, data } = await api('GET', '/api/audit');
  if (status !== 200) return handleFail(status, data);
  const body = $('#auditBody');
  body.replaceChildren();
  for (const ev of data.events) {
    const details = [ev.target && 'объект: ' + ev.target, ev.role && 'роль: ' + ev.role, ev.path && ev.path].filter(Boolean).join(', ');
    body.append(
      h('tr', {}, h('td', {}, new Date(ev.ts).toLocaleString('ru-RU')), h('td', {}, EVENT_LABELS[ev.type] || ev.type),
        h('td', {}, ev.username || '—'), h('td', {}, ev.ip || ''), h('td', {}, details)),
    );
  }
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
    showPrivate(data.user);
  } else {
    setStatus(`${data?.error || 'Ошибка входа'}`, 'error');
  }
});

$('#logout').addEventListener('click', async () => {
  await api('POST', '/api/logout');
  showGuest('Вы вышли из системы', 'ok');
});

$('#probe').addEventListener('click', async () => {
  const { status, data } = await api('GET', '/api/users');
  if (status === 200) setStatus('GET /api/users → 200: доступ разрешён (роль admin)', 'ok');
  else if (status === 403) setStatus('GET /api/users → 403: недостаточно прав', 'error');
  else handleFail(status, data);
});

$('#createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { username: $('#nu').value, name: $('#nn').value, password: $('#np').value, role: $('#nr').value };
  const { status, data } = await api('POST', '/api/users', body);
  if (status === 201) {
    setStatus('Пользователь создан', 'ok');
    e.target.reset();
    loadUsers();
    loadAudit();
  } else {
    handleFail(status, data);
  }
});

$('#refreshAudit').addEventListener('click', loadAudit);

(async () => {
  const { status, data } = await api('GET', '/api/session');
  if (status === 200) showPrivate(data.user);
  else if (data?.code === 'session_expired') showGuest(data.error, 'error');
})();
