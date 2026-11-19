'use strict';
const path = require('node:path');
const { makeApp, hashPassword } = require('./lib');

const SEED = [
  { username: 'admin', name: 'Администратор Тестовый', role: 'admin', password: 'Admin#Test2026' },
  { username: 'ivan', name: 'Иван Тестов', role: 'user', password: 'Ivan#Test2026' },
];
const ROLES = ['admin', 'user'];
const AUDIT_LIMIT = 1000;

function createServer(opts = {}) {
  const users = new Map();
  for (const u of SEED) {
    users.set(u.username, { username: u.username, name: u.name, role: u.role, passwordHash: hashPassword(u.password) });
  }
  const audit = [];

  return makeApp({
    users,
    publicDir: path.join(__dirname, 'public'),
    ttlMs: opts.ttlMs ?? 15 * 60 * 1000,
    secure: opts.secure ?? process.env.SECURE_COOKIE === '1',
    maxFails: opts.maxFails ?? 5,
    lockMs: opts.lockMs ?? 60_000,
    onEvent(e) {
      audit.push(e);
      if (audit.length > AUDIT_LIMIT) audit.shift();
    },
    async api(ctx) {
      const { pathname } = ctx.url;
      const pub = ctx.toPublic;

      if (pathname === '/api/me' && ctx.method === 'GET') {
        const user = ctx.requireAuth();
        if (user) ctx.json(200, { user: pub(user) });
        return true;
      }

      if (pathname === '/api/users' && ctx.method === 'GET') {
        if (!ctx.requireRole('admin')) return true;
        ctx.json(200, { users: [...users.values()].map(pub) });
        return true;
      }

      if (pathname === '/api/users' && ctx.method === 'POST') {
        const admin = ctx.requireRole('admin');
        if (!admin) return true;
        const b = await ctx.body();
        const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : '';
        const name = typeof b.name === 'string' ? b.name.trim() : '';
        const password = typeof b.password === 'string' ? b.password : '';
        const role = b.role;
        if (!/^[a-z0-9_]{3,20}$/.test(username)) return ctx.json(400, { error: 'Логин: 3–20 символов a-z, 0-9, _' }), true;
        if (!name || name.length > 60) return ctx.json(400, { error: 'Имя обязательно (до 60 символов)' }), true;
        if (password.length < 8 || password.length > 100) return ctx.json(400, { error: 'Пароль: от 8 символов' }), true;
        if (!ROLES.includes(role)) return ctx.json(400, { error: 'Недопустимая роль' }), true;
        if (users.has(username)) return ctx.json(409, { error: 'Такой логин уже существует' }), true;
        users.set(username, { username, name, role, passwordHash: hashPassword(password) });
        ctx.emit('user_created', admin.username, { target: username, role });
        ctx.json(201, { user: pub(users.get(username)) });
        return true;
      }

      const m = /^\/api\/users\/([a-z0-9_]{3,20})$/.exec(pathname);
      if (m && (ctx.method === 'DELETE' || ctx.method === 'PATCH')) {
        const admin = ctx.requireRole('admin');
        if (!admin) return true;
        const target = users.get(m[1]);
        if (!target) return ctx.json(404, { error: 'Пользователь не найден' }), true;
        if (target.username === admin.username) {
          return ctx.json(400, { error: 'Нельзя изменять или удалять самого себя' }), true;
        }
        if (ctx.method === 'DELETE') {
          users.delete(target.username);
          ctx.destroyUserSessions(target.username);
          ctx.emit('user_deleted', admin.username, { target: target.username });
          ctx.json(200, { ok: true });
        } else {
          const b = await ctx.body();
          if (!ROLES.includes(b.role)) return ctx.json(400, { error: 'Недопустимая роль' }), true;
          target.role = b.role;
          ctx.emit('role_changed', admin.username, { target: target.username, role: b.role });
          ctx.json(200, { user: pub(target) });
        }
        return true;
      }

      if (pathname === '/api/audit' && ctx.method === 'GET') {
        if (!ctx.requireRole('admin')) return true;
        ctx.json(200, { events: audit.slice(-100).reverse() });
        return true;
      }
      return false;
    },
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3016;
  createServer().listen(port, '127.0.0.1', () => console.log(`Вариант 16: http://127.0.0.1:${port}`));
}
