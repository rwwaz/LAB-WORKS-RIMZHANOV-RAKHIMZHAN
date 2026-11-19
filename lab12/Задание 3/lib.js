'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [alg, saltHex, hashHex] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const DUMMY_HASH = hashPassword('dummy-password-for-timing');

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {

    }
  }
  return out;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooBig = false;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) tooBig = true;
      else chunks.push(c);
    });
    req.on('end', () => {
      if (tooBig) return reject(httpError(413, 'Слишком большое тело запроса'));
      if (!chunks.length) return resolve({});
      try {
        const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(v && typeof v === 'object' && !Array.isArray(v) ? v : {});
      } catch {
        reject(httpError(400, 'Некорректный JSON'));
      }
    });
    req.on('error', reject);
  });
}

function makeApp(opts) {
  const {
    users,
    publicDir,
    api = async () => false,
    onEvent = () => {},
    ttlMs = 15 * 60 * 1000,
    secure = false,
    maxFails = 0,
    lockMs = 60_000,
    toPublic = (u) => ({ username: u.username, name: u.name, role: u.role }),
  } = opts;

  const sessions = new Map();
  const fails = new Map();

  const emit = (type, username, req, extra = {}) =>
    onEvent({
      ts: new Date().toISOString(),
      type,
      username: username || null,
      ip: req.socket.remoteAddress,
      ...extra,
    });

  const cookieAttrs = () =>
    `HttpOnly; SameSite=Strict; Path=/${secure ? '; Secure' : ''}`;

  function destroyUserSessions(username) {
    for (const [sid, s] of sessions) if (s.username === username) sessions.delete(sid);
  }

  function buildCtx(req, res, url) {
    const sid = parseCookies(req.headers.cookie).sid;
    let auth = 'none';
    let user = null;
    let session = null;
    if (sid) {
      const s = sessions.get(sid);
      if (s) {
        if (Date.now() >= s.expiresAt) {
          sessions.delete(sid);
          auth = 'expired';
          emit('session_expired', s.username, req);
        } else {
          const u = users.get(s.username);
          if (u) {
            auth = 'ok';
            user = u;
            session = s;
          } else {
            sessions.delete(sid);
          }
        }
      }
    }
    const ctx = {
      req,
      res,
      url,
      method: req.method,
      auth,
      user,
      session,
      sid,
      json: (status, obj) => sendJson(res, status, obj),
      body: () => readJson(req),
      emit: (type, username, extra) => emit(type, username, req, extra),
      destroyUserSessions,
      toPublic,
      requireAuth() {
        if (user) return user;
        const expired = auth === 'expired';
        ctx.json(401, {
          error: expired ? 'Сессия истекла. Войдите снова.' : 'Требуется вход',
          code: expired ? 'session_expired' : 'unauthorized',
        });
        return null;
      },
      requireRole(role) {
        const u = ctx.requireAuth();
        if (!u) return null;
        if (u.role !== role) {
          emit('access_denied', u.username, req, { path: url.pathname });
          ctx.json(403, { error: 'Недостаточно прав', code: 'forbidden' });
          return null;
        }
        return u;
      },
    };
    return ctx;
  }

  async function handleLogin(ctx) {
    const body = await ctx.body();
    const login = typeof body.login === 'string' ? body.login.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!login || !password) {
      return ctx.json(400, { error: 'Введите логин и пароль', code: 'empty_fields' });
    }
    const key = login.toLowerCase();
    const f = fails.get(key);
    if (maxFails && f && f.until > Date.now()) {
      emit('login_locked', login, ctx.req);
      return ctx.json(429, {
        error: 'Слишком много неудачных попыток. Повторите позже.',
        code: 'locked',
      });
    }
    const u = users.get(key);
    const passOk = verifyPassword(password, u ? u.passwordHash : DUMMY_HASH);
    if (!u || !passOk) {
      const cur = fails.get(key) || { count: 0, until: 0 };
      cur.count += 1;
      if (maxFails && cur.count >= maxFails) {
        cur.until = Date.now() + lockMs;
        cur.count = 0;
      }
      fails.set(key, cur);
      emit('login_fail', login, ctx.req);
      return ctx.json(401, { error: 'Неверный логин или пароль', code: 'bad_credentials' });
    }
    fails.delete(key);
    if (ctx.sid) sessions.delete(ctx.sid);
    const now = Date.now();
    for (const [sid, s] of sessions) if (now > s.expiresAt + 600_000) sessions.delete(sid);
    const sid = crypto.randomBytes(32).toString('hex');
    sessions.set(sid, { username: u.username, createdAt: now, expiresAt: now + ttlMs });
    ctx.res.setHeader('Set-Cookie', `sid=${sid}; ${cookieAttrs()}; Max-Age=${Math.ceil(ttlMs / 1000)}`);
    emit('login_ok', u.username, ctx.req);
    return ctx.json(200, { user: toPublic(u), expiresInSec: Math.floor(ttlMs / 1000) });
  }

  function handleLogout(ctx) {
    if (ctx.sid) sessions.delete(ctx.sid);
    ctx.res.setHeader('Set-Cookie', `sid=; ${cookieAttrs()}; Max-Age=0`);
    if (ctx.user) emit('logout', ctx.user.username, ctx.req);
    return ctx.json(200, { ok: true });
  }

  function serveStatic(req, res, url) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      return res.end();
    }
    let p;
    try {
      p = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400);
      return res.end();
    }
    if (p === '/') p = '/index.html';
    const root = path.resolve(publicDir);
    const file = path.resolve(root, '.' + p);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");
      if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url);

      res.setHeader('Cache-Control', 'no-store');
      const ctx = buildCtx(req, res, url);
      if (url.pathname === '/api/login' && req.method === 'POST') return await handleLogin(ctx);
      if (url.pathname === '/api/logout' && req.method === 'POST') return handleLogout(ctx);
      if (url.pathname === '/api/session' && req.method === 'GET') {
        const u = ctx.requireAuth();
        if (!u) return;
        return ctx.json(200, {
          user: toPublic(u),
          expiresInSec: Math.max(0, Math.floor((ctx.session.expiresAt - Date.now()) / 1000)),
        });
      }
      if (await api(ctx)) return;
      ctx.json(404, { error: 'Не найдено' });
    } catch (e) {
      if (e && e.status) return sendJson(res, e.status, { error: e.message });
      console.error(e);
      sendJson(res, 500, { error: 'Внутренняя ошибка сервера' });
    }
  });

  return server;
}

module.exports = { makeApp, hashPassword, verifyPassword, httpError };
