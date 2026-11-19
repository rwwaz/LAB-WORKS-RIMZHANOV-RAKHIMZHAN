'use strict';
(function () {
  const ROLES = ['admin', 'user'];
  window.DEMO = {
    key: 'v16',
    ttlMs: 15 * 60 * 1000,
    maxFails: 5,
    lockMs: 60000,
    users: {
      admin: { username: 'admin', name: 'Администратор Тестовый', role: 'admin', password: 'Admin#Test2026' },
      ivan: { username: 'ivan', name: 'Иван Тестов', role: 'user', password: 'Ivan#Test2026' },
    },
    route(c) {
      const { path, method, user } = c;
      const needAdmin = () => {
        if (!user) return c.unauth();
        if (user.role !== 'admin') {
          c.emit('access_denied', user.username, { path });
          return c.R(403, { error: 'Недостаточно прав', code: 'forbidden' });
        }
        return null;
      };
      if (path === '/api/me' && method === 'GET') return user ? c.R(200, { user: c.pub(user) }) : c.unauth();

      if (path === '/api/users' && method === 'GET') {
        return needAdmin() || c.R(200, { users: Object.values(c.users).map(c.pub) });
      }
      if (path === '/api/users' && method === 'POST') {
        const denied = needAdmin();
        if (denied) return denied;
        const b = c.body;
        const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
        const name = typeof b.name === 'string' ? b.name.trim() : '';
        const password = typeof b.password === 'string' ? b.password : '';
        if (!/^[a-z0-9_]{3,20}$/.test(username)) return c.R(400, { error: 'Логин: 3–20 символов a-z, 0-9, _' });
        if (!name || name.length > 60) return c.R(400, { error: 'Имя обязательно (до 60 символов)' });
        if (password.length < 8 || password.length > 100) return c.R(400, { error: 'Пароль: от 8 символов' });
        if (!ROLES.includes(b.role)) return c.R(400, { error: 'Недопустимая роль' });
        if (c.users[username]) return c.R(409, { error: 'Такой логин уже существует' });
        c.users[username] = { username, name, role: b.role, password };
        c.emit('user_created', user.username, { target: username, role: b.role });
        return c.R(201, { user: c.pub(c.users[username]) });
      }
      const m = /^\/api\/users\/([a-z0-9_]{3,20})$/.exec(path);
      if (m && (method === 'DELETE' || method === 'PATCH')) {
        const denied = needAdmin();
        if (denied) return denied;
        const target = c.users[m[1]];
        if (!target) return c.R(404, { error: 'Пользователь не найден' });
        if (target.username === user.username) return c.R(400, { error: 'Нельзя изменять или удалять самого себя' });
        if (method === 'DELETE') {
          delete c.users[target.username];
          c.destroyUserSessions(target.username);
          c.emit('user_deleted', user.username, { target: target.username });
          return c.R(200, { ok: true });
        }
        if (!ROLES.includes(c.body.role)) return c.R(400, { error: 'Недопустимая роль' });
        target.role = c.body.role;
        c.emit('role_changed', user.username, { target: target.username, role: c.body.role });
        return c.R(200, { user: c.pub(target) });
      }
      if (path === '/api/audit' && method === 'GET') {
        return needAdmin() || c.R(200, { events: c.audit.slice(-100).reverse() });
      }
      return null;
    },
  };
})();
