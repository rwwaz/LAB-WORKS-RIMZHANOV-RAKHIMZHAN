const http = require('node:http');
const { exec } = require('node:child_process');

const fs = require('node:fs');
const path = require('node:path');

function findServers(dir, depth) {
  const found = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  if (entries.some((e) => e.isFile() && e.name === 'server.js') && entries.some((e) => e.isFile() && e.name === 'lib.js')) {
    found.push(dir);
  }
  if (depth > 0) {
    for (const e of entries) {
      if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) {
        found.push(...findServers(path.join(dir, e.name), depth - 1));
      }
    }
  }
  return found;
}

const titles = { '07': 'Вариант 7', '10': 'Вариант 10', '16': 'Вариант 16' };
const variants = [];
let extraPort = 3100;
for (const dir of findServers(__dirname, 3)) {
  if (dir === __dirname) continue;
  const name = path.basename(dir);
  const num = (/(\d{1,2})/.exec(name) || [])[1];
  const key = num && num.padStart(2, '0');
  let create;
  try {
    create = require(path.join(dir, 'server.js')).createServer;
  } catch {
    continue;
  }
  if (typeof create !== 'function') continue;
  const port = titles[key] ? 3000 + Number(key) : extraPort++;
  variants.push({ port, title: `${titles[key] || 'Проект'} — ${name}`, create });
}
variants.sort((a, b) => a.port - b.port);

if (variants.length === 0) {
  console.error('Не найдены папки вариантов (variant07-..., variant10-..., variant16-...) рядом с start-all.js.');
  console.error('Папка запуска: ' + __dirname);
  try {
    console.error('Содержимое: ' + fs.readdirSync(__dirname).join(', '));
  } catch {
    console.error('Не удалось прочитать папку.');
  }
  console.error('Распакуйте архив целиком и запускайте start.bat из распакованной папки lab12.');
  process.exit(1);
}

const MENU_PORT = 3000;
const HOST = '127.0.0.1';

const menu = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Лабораторная работа №12</title>
<style>
body { font-family: Arial, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
a { display: block; margin: 12px 0; padding: 14px 16px; border: 1px solid #c8cedb; border-radius: 6px; color: #1b3a8a; text-decoration: none; }
a:hover { background: #eef2fb; }
</style>
</head>
<body>
<h1>Лабораторная работа №12</h1>
${variants.map((v) => `<a href="http://${HOST}:${v.port}/">${v.title}</a>`).join('\n')}
</body>
</html>`;

function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  const command = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(command, () => {});
}

function listen(server, port, name) {
  return new Promise((resolve) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') console.error(`Порт ${port} уже занят (${name}). Закройте предыдущий запуск и повторите.`);
      else console.error(error.message);
      process.exit(1);
    });
    server.listen(port, HOST, resolve);
  });
}

(async () => {
  for (const v of variants) {
    await listen(v.create(), v.port, v.title);
    console.log(`${v.title}: http://${HOST}:${v.port}/`);
  }
  const menuServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(menu);
  });
  await listen(menuServer, MENU_PORT, 'меню');
  console.log(`\nМеню: http://${HOST}:${MENU_PORT}/`);
  console.log('Для остановки закройте это окно или нажмите Ctrl+C.');
  openBrowser(`http://${HOST}:${MENU_PORT}/`);
})();
