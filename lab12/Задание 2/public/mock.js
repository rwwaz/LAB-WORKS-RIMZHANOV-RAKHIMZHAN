'use strict';
(function () {
  window.DEMO = {
    key: 'v10',
    ttlMs: 15 * 60 * 1000,
    users: {
      librarian: { username: 'librarian', name: 'Библиотекарь Тестовый', role: 'editor', password: 'Library#Test2026' },
      reader: { username: 'reader', name: 'Читатель Тестовый', role: 'editor', password: 'Reader#Test2026' },
    },
    init: () => ({
      nextId: 4,
      books: [
        { id: 1, title: 'Чистый код', author: 'Роберт Мартин', year: 2008, owner: 'system' },
        { id: 2, title: 'Грокаем алгоритмы', author: 'Адитья Бхаргава', year: 2016, owner: 'system' },
        { id: 3, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', year: 2018, owner: 'system' },
      ],
    }),
    route(c) {
      const d = c.data;
      if (c.path === '/api/books' && c.method === 'GET') return c.R(200, { books: d.books });
      if (c.path === '/api/books' && c.method === 'POST') {
        if (!c.user) return c.unauth();
        const title = typeof c.body.title === 'string' ? c.body.title.trim() : '';
        const author = typeof c.body.author === 'string' ? c.body.author.trim() : '';
        const year = Number(c.body.year);
        if (!title || title.length > 200) return c.R(400, { error: 'Название обязательно (до 200 символов)', code: 'invalid_book' });
        if (!author || author.length > 120) return c.R(400, { error: 'Автор обязателен (до 120 символов)', code: 'invalid_book' });
        if (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear() + 1) {
          return c.R(400, { error: 'Год издания — целое число от 1000 до текущего', code: 'invalid_book' });
        }
        const book = { id: d.nextId++, title, author, year, owner: c.user.username };
        d.books.push(book);
        return c.R(201, { book });
      }
      const m = /^\/api\/books\/(\d+)$/.exec(c.path);
      if (m && c.method === 'DELETE') {
        if (!c.user) return c.unauth();
        const i = d.books.findIndex((b) => b.id === Number(m[1]));
        if (i < 0) return c.R(404, { error: 'Запись не найдена' });
        if (d.books[i].owner !== c.user.username) {
          c.emit('access_denied', c.user.username, { path: c.path });
          return c.R(403, { error: 'Можно удалять только свои записи', code: 'forbidden' });
        }
        d.books.splice(i, 1);
        return c.R(200, { ok: true });
      }
      return null;
    },
  };
})();
