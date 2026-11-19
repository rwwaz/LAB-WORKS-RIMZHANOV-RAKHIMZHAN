'use strict';
const path = require('node:path');
const { makeApp, hashPassword } = require('./lib');

const SEED = [
  { username: 'librarian', name: 'Библиотекарь Тестовый', role: 'editor', password: 'Library#Test2026' },
  { username: 'reader', name: 'Читатель Тестовый', role: 'editor', password: 'Reader#Test2026' },
];

function validateBook(b) {
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const author = typeof b.author === 'string' ? b.author.trim() : '';
  const year = Number(b.year);
  if (!title || title.length > 200) return { error: 'Название обязательно (до 200 символов)' };
  if (!author || author.length > 120) return { error: 'Автор обязателен (до 120 символов)' };
  if (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear() + 1) {
    return { error: 'Год издания — целое число от 1000 до текущего' };
  }
  return { value: { title, author, year } };
}

function createServer(opts = {}) {
  const users = new Map();
  for (const u of SEED) {
    users.set(u.username, { username: u.username, name: u.name, role: u.role, passwordHash: hashPassword(u.password) });
  }
  let nextId = 4;
  const books = [
    { id: 1, title: 'Чистый код', author: 'Роберт Мартин', year: 2008, owner: 'system' },
    { id: 2, title: 'Грокаем алгоритмы', author: 'Адитья Бхаргава', year: 2016, owner: 'system' },
    { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', year: 2018, owner: 'system' },
  ];

  return makeApp({
    users,
    publicDir: path.join(__dirname, 'public'),
    ttlMs: opts.ttlMs ?? 15 * 60 * 1000,
    secure: opts.secure ?? process.env.SECURE_COOKIE === '1',
    async api(ctx) {
      const { pathname } = ctx.url;
      if (pathname === '/api/books' && ctx.method === 'GET') {
        ctx.json(200, { books });
        return true;
      }
      if (pathname === '/api/books' && ctx.method === 'POST') {
        const user = ctx.requireAuth();
        if (!user) return true;
        const v = validateBook(await ctx.body());
        if (v.error) {
          ctx.json(400, { error: v.error, code: 'invalid_book' });
          return true;
        }
        const book = { id: nextId++, ...v.value, owner: user.username };
        books.push(book);
        ctx.json(201, { book });
        return true;
      }
      const m = /^\/api\/books\/(\d+)$/.exec(pathname);
      if (m && ctx.method === 'DELETE') {
        const user = ctx.requireAuth();
        if (!user) return true;
        const idx = books.findIndex((b) => b.id === Number(m[1]));
        if (idx < 0) {
          ctx.json(404, { error: 'Запись не найдена' });
        } else if (books[idx].owner !== user.username) {
          ctx.emit('access_denied', user.username, { path: pathname });
          ctx.json(403, { error: 'Можно удалять только свои записи', code: 'forbidden' });
        } else {
          books.splice(idx, 1);
          ctx.json(200, { ok: true });
        }
        return true;
      }
      return false;
    },
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3010;
  createServer().listen(port, '127.0.0.1', () => console.log(`Вариант 10: http://127.0.0.1:${port}`));
}
