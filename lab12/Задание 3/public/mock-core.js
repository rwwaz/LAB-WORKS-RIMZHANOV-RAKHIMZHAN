'use strict';
(function () {
  if (location.protocol !== 'file:' || !window.DEMO) return;
  const cfg = window.DEMO;
  const KEY = 'lab12-demo-' + cfg.key;
  let st = null;
  try { st = JSON.parse(sessionStorage.getItem(KEY)); } catch {  }
  if (!st) st = { users: JSON.parse(JSON.stringify(cfg.users)), sessions: {}, sid: null, fails: {}, audit: [], data: cfg.init ? cfg.init() : {} };
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(st));
  const pub = (u) => (cfg.toPublic ? cfg.toPublic(u) : { username: u.username, name: u.name, role: u.role });
  const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const R = (status, data) => ({ status, data });
  const emit = (type, username, extra) => {
    st.audit.push({ ts: new Date().toISOString(), type, username: username || null, ip: 'локально', ...extra });
    if (st.audit.length > 1000) st.audit.shift();
  };


  window.api = async function (method, url, body) {
    const path = url.split('?')[0];
    let auth = 'none';
    let user = null;
    if (st.sid && st.sessions[st.sid]) {
      const s = st.sessions[st.sid];
      if (Date.now() >= s.expiresAt) {
        delete st.sessions[st.sid];
        auth = 'expired';
        emit('session_expired', s.username);
      } else if (st.users[s.username]) {
        auth = 'ok';
        user = st.users[s.username];
      } else {
        delete st.sessions[st.sid];
      }
    }
    const unauth = () =>
      auth === 'expired'
        ? R(401, { error: 'Сессия истекла. Войдите снова.', code: 'session_expired' })
        : R(401, { error: 'Требуется вход', code: 'unauthorized' });
    const ttl = cfg.ttlMs || 15 * 60 * 1000;
    let res;

    if (path === '/api/login' && method === 'POST') {
      const login = typeof body?.login === 'string' ? body.login.trim() : '';
      const password = typeof body?.password === 'string' ? body.password : '';
      const key = login.toLowerCase();
      const f = st.fails[key];
      if (!login || !password) res = R(400, { error: 'Введите логин и пароль', code: 'empty_fields' });
      else if (cfg.maxFails && f && f.until > Date.now()) {
        emit('login_locked', login);
        res = R(429, { error: 'Слишком много неудачных попыток. Повторите позже.', code: 'locked' });
      } else {
        const u = st.users[key];
        if (!u || u.password !== password) {
          const cur = st.fails[key] || { count: 0, until: 0 };
          cur.count += 1;
          if (cfg.maxFails && cur.count >= cfg.maxFails) { cur.until = Date.now() + (cfg.lockMs || 60000); cur.count = 0; }
          st.fails[key] = cur;
          emit('login_fail', login);
          res = R(401, { error: 'Неверный логин или пароль', code: 'bad_credentials' });
        } else {
          delete st.fails[key];
          if (st.sid) delete st.sessions[st.sid];
          st.sid = rnd();
          st.sessions[st.sid] = { username: u.username, expiresAt: Date.now() + ttl };
          emit('login_ok', u.username);
          res = R(200, { user: pub(u), expiresInSec: Math.floor(ttl / 1000) });
        }
      }
    } else if (path === '/api/logout' && method === 'POST') {
      if (st.sid) delete st.sessions[st.sid];
      st.sid = null;
      if (user) emit('logout', user.username);
      res = R(200, { ok: true });
    } else if (path === '/api/session' && method === 'GET') {
      res = user
        ? R(200, { user: pub(user), expiresInSec: Math.max(0, Math.floor((st.sessions[st.sid].expiresAt - Date.now()) / 1000)) })
        : unauth();
    } else {
      const c = {
        method, path, body: body || {}, user, unauth, R, emit, pub,
        users: st.users, data: st.data, audit: st.audit,
        destroyUserSessions: (name) => { for (const k of Object.keys(st.sessions)) if (st.sessions[k].username === name) delete st.sessions[k]; },
      };
      res = cfg.route(c) || R(404, { error: 'Не найдено' });
    }
    save();
    return JSON.parse(JSON.stringify(res));
  };
})();
