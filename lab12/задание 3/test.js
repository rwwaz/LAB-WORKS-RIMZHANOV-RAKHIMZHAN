'use strict';
const assert = require('node:assert/strict');
const { createServer } = require('./server');
const { startServer, Client, sleep, runScenarios } = require('./testkit');

(async () => {
  const app = await startServer(createServer);
  const ADMIN = { login: 'admin', password: 'Admin#Test2026' };
  const USER = { login: 'ivan', password: 'Ivan#Test2026' };

  await runScenarios('Вариант 16 — результаты тестирования', [
    {
      n: 1, name: 'Корректный вход',
      input: 'POST /api/login admin / верный пароль; GET /api/users',
      expected: '200; cookie HttpOnly + SameSite=Strict; список пользователей 200',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', ADMIN);
        assert.equal(r.status, 200);
        assert.equal(r.data.user.role, 'admin');
        const cookie = r.setCookie.join(';');
        assert.match(cookie, /HttpOnly/);
        assert.match(cookie, /SameSite=Strict/);
        const list = await c.get('/api/users');
        assert.equal(list.status, 200);
        assert.ok(list.data.users.every((u) => !('passwordHash' in u)), 'хеш пароля не должен отдаваться клиенту');
        return `вход ${r.status}; cookie HttpOnly, SameSite=Strict; пользователей: ${list.data.users.length}; хеши не отдаются`;
      },
    },
    {
      n: 2, name: 'Неверный пароль',
      input: 'POST /api/login admin / неверный пароль; затем проверка журнала',
      expected: '401, cookie нет; в журнале событие login_fail',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', { login: 'admin', password: 'wrong-password' });
        assert.equal(r.status, 401);
        assert.equal(r.setCookie.length, 0);
        const a = new Client(app.base);
        await a.post('/api/login', ADMIN);
        const log = await a.get('/api/audit');
        assert.ok(log.data.events.some((e) => e.type === 'login_fail' && e.username === 'admin'));
        return `${r.status} «${r.data.error}»; в журнале есть login_fail`;
      },
    },
    {
      n: 3, name: 'Пустые поля',
      input: 'POST /api/login с пустыми полями; POST /api/users с коротким паролем (admin)',
      expected: '400 в обоих случаях',
      async run() {
        const r1 = await new Client(app.base).post('/api/login', { login: '', password: '' });
        assert.equal(r1.status, 400);
        const a = new Client(app.base);
        await a.post('/api/login', ADMIN);
        const r2 = await a.post('/api/users', { username: 'newbie', name: 'Новичок', password: '123', role: 'user' });
        assert.equal(r2.status, 400);
        return `вход ${r1.status}; слабый пароль ${r2.status}`;
      },
    },
    {
      n: 4, name: 'Доступ без входа',
      input: 'GET /api/users, GET /api/audit без cookie',
      expected: '401 Unauthorized',
      async run() {
        const c = new Client(app.base);
        const r1 = await c.get('/api/users');
        const r2 = await c.get('/api/audit');
        assert.equal(r1.status, 401);
        assert.equal(r2.status, 401);
        return `/api/users → ${r1.status}; /api/audit → ${r2.status}`;
      },
    },
    {
      n: 5, name: 'Выход и повторный запрос защищённого ресурса',
      input: 'вход admin → запомнить cookie → POST /api/logout → GET /api/users со старой cookie; проверка журнала',
      expected: '401; в журнале событие logout',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', ADMIN);
        const old = c.cookie;
        assert.equal((await c.post('/api/logout')).status, 200);
        const replay = new Client(app.base);
        replay.cookie = old;
        const r = await replay.get('/api/users');
        assert.equal(r.status, 401);
        const a = new Client(app.base);
        await a.post('/api/login', ADMIN);
        const log = await a.get('/api/audit');
        assert.ok(log.data.events.some((e) => e.type === 'logout' && e.username === 'admin'));
        return `после выхода → ${r.status}; в журнале есть logout`;
      },
    },
    {
      n: 6, name: 'Истекшая сессия',
      input: 'сервер с ttl = 300 мс; вход; пауза 450 мс; GET /api/users',
      expected: '401, код session_expired',
      async run() {
        const short = await startServer(createServer, { ttlMs: 300 });
        try {
          const c = new Client(short.base);
          await c.post('/api/login', ADMIN);
          await sleep(450);
          const r = await c.get('/api/users');
          assert.equal(r.status, 401);
          assert.equal(r.data.code, 'session_expired');
          return `${r.status} «${r.data.error}»`;
        } finally {
          await short.close();
        }
      },
    },
    {
      n: 7, name: 'Попытка доступа к чужому ресурсу (повышение привилегий)',
      input: 'ivan (роль user): GET /api/users, GET /api/audit, POST /api/users, DELETE /api/users/admin',
      expected: '403 на все админские API; запросы пользователя к собственному профилю — 200',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', USER);
        const codes = [
          (await c.get('/api/users')).status,
          (await c.get('/api/audit')).status,
          (await c.post('/api/users', { username: 'hacker', name: 'X', password: 'password123', role: 'admin' })).status,
          (await c.del('/api/users/admin')).status,
        ];
        assert.deepEqual(codes, [403, 403, 403, 403]);
        const me = await c.get('/api/me');
        assert.equal(me.status, 200);
        const a = new Client(app.base);
        await a.post('/api/login', ADMIN);
        const list = await a.get('/api/users');
        assert.ok(!list.data.users.some((u) => u.username === 'hacker'), 'пользователь hacker не должен быть создан');
        return `коды: ${codes.join(', ')}; /api/me → ${me.status}; hacker не создан`;
      },
    },
    {
      n: 8, name: 'Обновление страницы после входа',
      input: 'вход admin; GET /; GET /api/session с той же cookie',
      expected: 'страница 200; /api/session 200 с ролью',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', ADMIN);
        const page = await c.get('/');
        const s = await c.get('/api/session');
        assert.equal(page.status, 200);
        assert.match(page.text, /Система управления пользователями/);
        assert.equal(s.status, 200);
        assert.equal(s.data.user.role, 'admin');
        return `страница ${page.status}; session ${s.status}, роль ${s.data.user.role}`;
      },
    },
    {
      n: 9, name: 'Дополнительно: блокировка после 5 неудачных входов',
      input: '5 неверных паролей для ivan, затем вход с ВЕРНЫМ паролем',
      expected: '429 locked (в журнале login_locked); после снятия блокировки вход возможен',
      async run() {
        const s = await startServer(createServer, { maxFails: 5, lockMs: 400 });
        try {
          const c = new Client(s.base);
          for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/login', { login: 'ivan', password: 'bad-pass-' + i })).status, 401);
          const locked = await c.post('/api/login', USER);
          assert.equal(locked.status, 429);
          await sleep(500);
          const after = await c.post('/api/login', USER);
          assert.equal(after.status, 200);
          return `при блокировке ${locked.status}; после паузы ${after.status}`;
        } finally {
          await s.close();
        }
      },
    },
    {
      n: 10, name: 'Дополнительно: удалённый пользователь теряет доступ сразу',
      input: 'ivan входит; admin удаляет ivan; ivan повторяет GET /api/me со своей cookie',
      expected: '401: сессия удалена вместе с пользователем',
      async run() {
        const u = new Client(app.base);
        const a = new Client(app.base);
        await a.post('/api/login', ADMIN);
        await a.post('/api/users', { username: 'temp_user', name: 'Временный', password: 'Temp#Pass2026', role: 'user' });
        await u.post('/api/login', { login: 'temp_user', password: 'Temp#Pass2026' });
        assert.equal((await u.get('/api/me')).status, 200);
        assert.equal((await a.del('/api/users/temp_user')).status, 200);
        const r = await u.get('/api/me');
        assert.equal(r.status, 401);
        return `после удаления пользователя → ${r.status}`;
      },
    },
  ], 'test-results.md');

  await app.close();
})();
