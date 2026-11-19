'use strict';
const $ = (sel) => document.querySelector(sel);

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await r.json();
  } catch {

  }
  return { status: r.status, data };
}

function setStatus(message, kind = '') {
  const el = $('#status');
  el.textContent = message || '';
  el.className = kind;
}

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const kid of kids) e.append(kid);
  return e;
}
