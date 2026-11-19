const API = 'https://jsonplaceholder.typicode.com';
const TIMEOUT = 10000;

const form = document.querySelector('#form');
const input = document.querySelector('#userId');
const loadButton = document.querySelector('#load');
const retryButton = document.querySelector('#retry');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const meta = document.querySelector('#meta');

let requestCount = 0;
let lastId = null;

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(API + path, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function errorText(error) {
  if (error.name === 'AbortError') return 'Превышено время ожидания ответа';
  if (error instanceof TypeError) return 'Ошибка сети: нет соединения с сервером';
  return `Ошибка загрузки: ${error.message}`;
}

function setStatus(kind, text) {
  status.className = kind;
  status.textContent = text;
  retryButton.hidden = kind !== 'error';
}

function renderUser(user) {
  const title = document.createElement('h2');
  title.textContent = user.name || 'Без имени';

  const list = document.createElement('dl');
  const rows = [
    ['Имя', user.name],
    ['Город', user.address && user.address.city],
    ['Компания', user.company && user.company.name],
  ];
  for (const [label, value] of rows) {
    const term = document.createElement('dt');
    const desc = document.createElement('dd');
    term.textContent = label;
    desc.textContent = value || '—';
    list.append(term, desc);
  }

  const card = document.createElement('div');
  card.className = 'card';
  card.append(title, list);
  result.replaceChildren(card);
}

async function loadUser(id) {
  lastId = id;
  loadButton.disabled = true;
  retryButton.disabled = true;
  result.replaceChildren();
  setStatus('loading', 'Загрузка...');
  requestCount += 1;
  const started = performance.now();

  try {
    const response = await request(`/users/${id}`);
    if (response.status === 404) {
      setStatus('empty', `Пользователь с ID ${id} не найден`);
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const user = await response.json();
    renderUser(user);
    setStatus('success', 'Данные получены');
  } catch (error) {
    setStatus('error', errorText(error));
  } finally {
    const elapsed = Math.round(performance.now() - started);
    meta.textContent = `Запросов: ${requestCount} · Время ответа: ${elapsed} мс`;
    loadButton.disabled = false;
    retryButton.disabled = false;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = input.value.trim();
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    result.replaceChildren();
    setStatus('error', 'Введите ID — целое положительное число');
    retryButton.hidden = true;
    return;
  }
  loadUser(Number(value));
});

retryButton.addEventListener('click', () => {
  if (lastId !== null) loadUser(lastId);
});
