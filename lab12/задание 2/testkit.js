'use strict';
const fs = require('node:fs');
const path = require('node:path');

async function startServer(createServer, opts) {
  const server = createServer(opts);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    close: () =>
      new Promise((r) => {
        server.closeAllConnections?.();
        server.close(r);
      }),
  };
}

class Client {
  constructor(base) {
    this.base = base;
    this.cookie = null;
  }
  async req(method, url, body) {
    const headers = {};
    if (this.cookie) headers.cookie = this.cookie;
    let payload;
    if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const r = await fetch(this.base + url, { method, headers, body: payload });
    const setCookie = r.headers.getSetCookie();
    for (const c of setCookie) {
      const kv = c.split(';')[0];
      this.cookie = /Max-Age=0/i.test(c) ? null : kv;
    }
    const text = await r.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {

    }
    return { status: r.status, data, text, setCookie };
  }
  get(u) { return this.req('GET', u); }
  post(u, b) { return this.req('POST', u, b ?? {}); }
  del(u) { return this.req('DELETE', u); }
  patch(u, b) { return this.req('PATCH', u, b); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runScenarios(title, scenarios, outFile) {
  const rows = [];
  for (const s of scenarios) {
    let actual;
    let ok = true;
    try {
      actual = await s.run();
    } catch (e) {
      ok = false;
      actual = 'ОШИБКА: ' + e.message;
    }
    rows.push({ n: s.n, name: s.name, input: s.input, expected: s.expected, actual, ok });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${s.n}. ${s.name} -> ${actual}`);
  }
  const esc = (t) => String(t).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  let md = `# ${title}\n\n| № | Сценарий | Входные условия | Ожидаемый результат | Фактический результат | Статус |\n|---|---|---|---|---|---|\n`;
  for (const r of rows) {
    md += `| ${r.n} | ${esc(r.name)} | ${esc(r.input)} | ${esc(r.expected)} | ${esc(r.actual)} | ${r.ok ? 'Пройден' : 'Не пройден'} |\n`;
  }
  fs.writeFileSync(path.resolve(outFile), md);
  const failed = rows.filter((r) => !r.ok).length;
  console.log(`\nИтого: ${rows.length - failed}/${rows.length} пройдено. Таблица: ${outFile}`);
  if (failed) process.exitCode = 1;
}

module.exports = { startServer, Client, sleep, runScenarios };
