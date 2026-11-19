'use strict';
(function () {
  const COURSES = { web: 'Веб-разработка на JavaScript', py: 'Основы Python' };
  const LESSONS = [
    { id: 1, course: 'web', title: 'HTML и семантическая разметка', date: '2026-11-23', info: 'Теги, структура документа, доступность.' },
    { id: 2, course: 'web', title: 'CSS: сетка и адаптивность', date: '2026-11-25', info: 'Flexbox, Grid, медиазапросы.' },
    { id: 3, course: 'web', title: 'JavaScript: события и fetch', date: '2026-11-30', info: 'DOM, обработчики, запросы к API.' },
    { id: 4, course: 'py', title: 'Типы данных и ветвления', date: '2026-11-24', info: 'int, str, list, dict, if/elif.' },
    { id: 5, course: 'py', title: 'Функции и модули', date: '2026-11-26', info: 'Аргументы, возвращаемые значения, import.' },
    { id: 6, course: 'py', title: 'Работа с файлами', date: '2026-12-01', info: 'open, with, чтение и запись CSV.' },
  ];
  window.DEMO = {
    key: 'v07',
    ttlMs: 5 * 60 * 1000,
    users: {
      anna: { username: 'anna', name: 'Анна Тестова', role: 'student', course: 'web', password: 'Anna#Test2026' },
      boris: { username: 'boris', name: 'Борис Тестов', role: 'student', course: 'py', password: 'Boris#Test2026' },
    },
    toPublic: (u) => ({ username: u.username, name: u.name, role: u.role, courseTitle: COURSES[u.course] }),
    route(c) {
      if (c.path === '/api/lessons' && c.method === 'GET') {
        if (!c.user) return c.unauth();
        const lessons = LESSONS.filter((l) => l.course === c.user.course).map(({ id, title, date }) => ({ id, title, date }));
        return c.R(200, { course: COURSES[c.user.course], lessons });
      }
      const m = /^\/api\/lessons\/(\d+)$/.exec(c.path);
      if (m && c.method === 'GET') {
        if (!c.user) return c.unauth();
        const lesson = LESSONS.find((l) => l.id === Number(m[1]));
        if (!lesson) return c.R(404, { error: 'Занятие не найдено' });
        if (lesson.course !== c.user.course) {
          c.emit('access_denied', c.user.username, { path: c.path });
          return c.R(403, { error: 'Это занятие другого курса', code: 'forbidden' });
        }
        return c.R(200, lesson);
      }
      return null;
    },
  };
})();
