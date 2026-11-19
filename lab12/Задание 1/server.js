'use strict';
const path = require('node:path');
const { makeApp, hashPassword } = require('./lib');

const COURSES = {
  web: 'Веб-разработка на JavaScript',
  py: 'Основы Python',
};

const LESSONS = [
  { id: 1, course: 'web', title: 'HTML и семантическая разметка', date: '2026-11-23', info: 'Теги, структура документа, доступность.' },
  { id: 2, course: 'web', title: 'CSS: сетка и адаптивность', date: '2026-11-25', info: 'Flexbox, Grid, медиазапросы.' },
  { id: 3, course: 'web', title: 'JavaScript: события и fetch', date: '2026-11-30', info: 'DOM, обработчики, запросы к API.' },
  { id: 4, course: 'py', title: 'Типы данных и ветвления', date: '2026-11-24', info: 'int, str, list, dict, if/elif.' },
  { id: 5, course: 'py', title: 'Функции и модули', date: '2026-11-26', info: 'Аргументы, возвращаемые значения, import.' },
  { id: 6, course: 'py', title: 'Работа с файлами', date: '2026-12-01', info: 'open, with, чтение и запись CSV.' },
];

const SEED = [
  { username: 'anna', name: 'Анна Тестова', role: 'student', course: 'web', password: 'Anna#Test2026' },
  { username: 'boris', name: 'Борис Тестов', role: 'student', course: 'py', password: 'Boris#Test2026' },
];

function createServer(opts = {}) {
  const users = new Map();
  for (const u of SEED) {
    users.set(u.username, {
      username: u.username,
      name: u.name,
      role: u.role,
      course: u.course,
      passwordHash: hashPassword(u.password),
    });
  }

  const lessonRe = /^\/api\/lessons\/(\d+)$/;

  return makeApp({
    users,
    publicDir: path.join(__dirname, 'public'),
    ttlMs: opts.ttlMs ?? 5 * 60 * 1000,
    secure: opts.secure ?? process.env.SECURE_COOKIE === '1',
    toPublic: (u) => ({ username: u.username, name: u.name, role: u.role, courseTitle: COURSES[u.course] }),
    async api(ctx) {
      if (ctx.url.pathname === '/api/lessons' && ctx.method === 'GET') {
        const user = ctx.requireAuth();
        if (!user) return true;
        const lessons = LESSONS.filter((l) => l.course === user.course).map(({ id, title, date }) => ({ id, title, date }));
        ctx.json(200, { course: COURSES[user.course], lessons });
        return true;
      }
      const m = lessonRe.exec(ctx.url.pathname);
      if (m && ctx.method === 'GET') {
        const user = ctx.requireAuth();
        if (!user) return true;
        const lesson = LESSONS.find((l) => l.id === Number(m[1]));
        if (!lesson) {
          ctx.json(404, { error: 'Занятие не найдено' });
        } else if (lesson.course !== user.course) {
          ctx.emit('access_denied', user.username, { path: ctx.url.pathname });
          ctx.json(403, { error: 'Это занятие другого курса', code: 'forbidden' });
        } else {
          ctx.json(200, lesson);
        }
        return true;
      }
      return false;
    },
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3007;
  createServer().listen(port, '127.0.0.1', () => console.log(`Вариант 7: http://127.0.0.1:${port}`));
}
