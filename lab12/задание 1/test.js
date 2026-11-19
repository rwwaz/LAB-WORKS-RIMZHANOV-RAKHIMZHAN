'use strict';
const assert = require('node:assert/strict');
const { createServer } = require('./server');
const { startServer, Client, sleep, runScenarios } = require('./testkit');

(async () => {
  const app = await startServer(createServer);
  const A = { login: 'anna', password: 'Anna#Test2026' };
  const B = { login: 'boris', password: 'Boris#Test2026' };

  await runScenarios('Вариант 7 — результаты тестирования', [
    {
      n: 1, name: 'Корректный вход',
      input: 'POST /api/login anna / верный пароль, затем GET /api/lessons',
      expected: '200; cookie sid с HttpOnly и SameSite=Strict; токена в теле ответа нет; список занятий своего курса (3)',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', A);
        assert.equal(r.status, 200);
        const cookie = r.setCookie.join(';');
        assert.match(cookie, /HttpOnly/);
        assert.match(cookie, /SameSite=Strict/);
        assert.ok(!/token|sid/i.test(JSON.stringify(r.data)), 'в теле ответа не должно быть идентификатора сессии');
        const l = await c.get('/api/lessons');
        assert.equal(l.status, 200);
        assert.equal(l.data.lessons.length, 3);
        return `200; cookie: HttpOnly, SameSite=Strict; занятий: ${l.data.lessons.length}`;
      },
    },
    {
      n: 2, name: 'Неверный пароль',
      input: 'POST /api/login anna / неверный пароль',
      expected: '401, сообщение «Неверный логин или пароль», cookie не выдаётся',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', { login: 'anna', password: 'wrong-password' });
        assert.equal(r.status, 401);
        assert.equal(r.setCookie.length, 0);
        const r2 = await c.post('/api/login', { login: 'nobody', password: 'wrong-password' });
        assert.equal(r2.data.error, r.data.error, 'сообщение не должно выдавать существование логина');
        return `${r.status}, «${r.data.error}», Set-Cookie нет`;
      },
    },
    {
      n: 3, name: 'Пустые поля',
      input: 'POST /api/login с пустым логином/паролем; с отсутствующим паролем',
      expected: '400, код empty_fields',
      async run() {
        const c = new Client(app.base);
        const r1 = await c.post('/api/login', { login: '', password: '' });
        const r2 = await c.post('/api/login', { login: 'anna' });
        assert.equal(r1.status, 400);
        assert.equal(r2.status, 400);
        assert.equal(r1.data.code, 'empty_fields');
        return `${r1.status} и ${r2.status}, «${r1.data.error}»`;
      },
    },
    {
      n: 4, name: 'Доступ без входа',
      input: 'GET /api/lessons без cookie',
      expected: '401 Unauthorized',
      async run() {
        const r = await new Client(app.base).get('/api/lessons');
        assert.equal(r.status, 401);
        assert.equal(r.data.code, 'unauthorized');
        return `${r.status} «${r.data.error}»`;
      },
    },
    {
      n: 5, name: 'Выход и повторный запрос защищённого ресурса',
      input: 'вход → запомнить cookie → POST /api/logout → GET /api/lessons со СТАРОЙ cookie',
      expected: 'после выхода 401: серверная сессия уничтожена, старая cookie недействительна',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', A);
        const old = c.cookie;
        assert.equal((await c.get('/api/lessons')).status, 200);
        assert.equal((await c.post('/api/logout')).status, 200);
        const replay = new Client(app.base);
        replay.cookie = old;
        const r = await replay.get('/api/lessons');
        assert.equal(r.status, 401);
        return `после выхода повтор со старой cookie → ${r.status}`;
      },
    },
    {
      n: 6, name: 'Истекшая сессия',
      input: 'сервер с ttl = 300 мс; вход; пауза 450 мс; GET /api/lessons',
      expected: '401, код session_expired',
      async run() {
        const short = await startServer(createServer, { ttlMs: 300 });
        try {
          const c = new Client(short.base);
          await c.post('/api/login', A);
          assert.equal((await c.get('/api/lessons')).status, 200);
          await sleep(450);
          const r = await c.get('/api/lessons');
          assert.equal(r.status, 401);
          assert.equal(r.data.code, 'session_expired');
          return `${r.status} «${r.data.error}»`;
        } finally {
          await short.close();
        }
      },
    },
    {
      n: 7, name: 'Попытка доступа к чужому ресурсу',
      input: 'boris (курс py) запрашивает GET /api/lessons/1 (занятие курса web) и свой /api/lessons/4',
      expected: '403 для чужого занятия, 200 для своего',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', B);
        const foreign = await c.get('/api/lessons/1');
        const own = await c.get('/api/lessons/4');
        assert.equal(foreign.status, 403);
        assert.equal(own.status, 200);
        const missing = await c.get('/api/lessons/999');
        assert.equal(missing.status, 404);
        return `чужое → ${foreign.status}, своё → ${own.status}, несуществующее → ${missing.status}`;
      },
    },
    {
      n: 8, name: 'Обновление страницы после входа',
      input: 'вход; GET / (загрузка страницы); GET /api/session с той же cookie',
      expected: 'страница 200; /api/session 200 — состояние восстанавливается из серверной сессии',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', A);
        const page = await c.get('/');
        const s = await c.get('/api/session');
        assert.equal(page.status, 200);
        assert.match(page.text, /Личный кабинет/);
        assert.equal(s.status, 200);
        assert.equal(s.data.user.username, 'anna');
        assert.ok(s.data.expiresInSec > 0);
        return `страница ${page.status}; session ${s.status}, пользователь ${s.data.user.username}`;
      },
    },
  ], 'test-results.md');

  await app.close();
})();
