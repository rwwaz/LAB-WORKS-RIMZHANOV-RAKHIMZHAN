'use strict';
const assert = require('node:assert/strict');
const { createServer } = require('./server');
const { startServer, Client, sleep, runScenarios } = require('./testkit');

(async () => {
  const app = await startServer(createServer);
  const L = { login: 'librarian', password: 'Library#Test2026' };
  const R = { login: 'reader', password: 'Reader#Test2026' };
  const book = { title: 'Тестовая книга', author: 'Автор Тестовый', year: 2024 };

  await runScenarios('Вариант 10 — результаты тестирования', [
    {
      n: 1, name: 'Корректный вход',
      input: 'POST /api/login librarian / верный пароль; затем POST /api/books',
      expected: '200; cookie HttpOnly + SameSite=Strict; добавление книги 201',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', L);
        assert.equal(r.status, 200);
        const cookie = r.setCookie.join(';');
        assert.match(cookie, /HttpOnly/);
        assert.match(cookie, /SameSite=Strict/);
        const add = await c.post('/api/books', book);
        assert.equal(add.status, 201);
        return `вход ${r.status}; cookie HttpOnly, SameSite=Strict; добавление ${add.status}`;
      },
    },
    {
      n: 2, name: 'Неверный пароль',
      input: 'POST /api/login librarian / неверный пароль',
      expected: '401, cookie не выдаётся',
      async run() {
        const c = new Client(app.base);
        const r = await c.post('/api/login', { login: 'librarian', password: 'nope-nope' });
        assert.equal(r.status, 401);
        assert.equal(r.setCookie.length, 0);
        return `${r.status} «${r.data.error}», Set-Cookie нет`;
      },
    },
    {
      n: 3, name: 'Пустые поля',
      input: 'вход с пустыми полями; добавление книги с пустым названием и неверным годом',
      expected: '400 в обоих случаях',
      async run() {
        const c = new Client(app.base);
        const r1 = await c.post('/api/login', { login: '', password: '' });
        assert.equal(r1.status, 400);
        await c.post('/api/login', L);
        const r2 = await c.post('/api/books', { title: '', author: 'X', year: 2020 });
        const r3 = await c.post('/api/books', { title: 'Y', author: 'X', year: 'abc' });
        assert.equal(r2.status, 400);
        assert.equal(r3.status, 400);
        return `вход ${r1.status}; пустое название ${r2.status}; неверный год ${r3.status}`;
      },
    },
    {
      n: 4, name: 'Доступ без входа',
      input: 'гость: GET /api/books (открытый) и POST /api/books (защищённый)',
      expected: 'просмотр 200; добавление 401',
      async run() {
        const c = new Client(app.base);
        const view = await c.get('/api/books');
        const add = await c.post('/api/books', book);
        assert.equal(view.status, 200);
        assert.ok(view.data.books.length >= 3);
        assert.equal(add.status, 401);
        return `просмотр ${view.status} (книг: ${view.data.books.length}); добавление ${add.status}`;
      },
    },
    {
      n: 5, name: 'Выход и повторный запрос защищённого ресурса',
      input: 'вход → запомнить cookie → POST /api/logout → POST /api/books со старой cookie',
      expected: '401: серверная сессия уничтожена',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', L);
        const old = c.cookie;
        assert.equal((await c.post('/api/logout')).status, 200);
        const replay = new Client(app.base);
        replay.cookie = old;
        const r = await replay.post('/api/books', book);
        assert.equal(r.status, 401);
        return `после выхода добавление со старой cookie → ${r.status}`;
      },
    },
    {
      n: 6, name: 'Истекшая сессия',
      input: 'сервер с ttl = 300 мс; вход; пауза 450 мс; POST /api/books',
      expected: '401, код session_expired',
      async run() {
        const short = await startServer(createServer, { ttlMs: 300 });
        try {
          const c = new Client(short.base);
          await c.post('/api/login', L);
          await sleep(450);
          const r = await c.post('/api/books', book);
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
      input: 'librarian добавляет книгу; reader пытается её удалить (DELETE /api/books/:id); затем удаляет сам librarian',
      expected: 'reader → 403; владелец → 200',
      async run() {
        const lib = new Client(app.base);
        await lib.post('/api/login', L);
        const added = await lib.post('/api/books', book);
        const id = added.data.book.id;
        const other = new Client(app.base);
        await other.post('/api/login', R);
        const denied = await other.del('/api/books/' + id);
        assert.equal(denied.status, 403);
        const own = await lib.del('/api/books/' + id);
        assert.equal(own.status, 200);
        return `чужая запись → ${denied.status}; владелец → ${own.status}`;
      },
    },
    {
      n: 8, name: 'Обновление страницы после входа',
      input: 'вход; GET / ; GET /api/session с той же cookie',
      expected: 'страница 200; /api/session 200 с данными пользователя',
      async run() {
        const c = new Client(app.base);
        await c.post('/api/login', L);
        const page = await c.get('/');
        const s = await c.get('/api/session');
        assert.equal(page.status, 200);
        assert.match(page.text, /Каталог книг/);
        assert.equal(s.status, 200);
        assert.equal(s.data.user.username, 'librarian');
        return `страница ${page.status}; session ${s.status}, пользователь ${s.data.user.username}`;
      },
    },
  ], 'test-results.md');

  await app.close();
})();
