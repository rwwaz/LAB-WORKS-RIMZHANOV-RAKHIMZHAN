const API = 'https://jsonplaceholder.typicode.com';
const TIMEOUT = 10000;

const select = document.querySelector('#userId');
const reloadButton = document.querySelector('#reload');
const retryButton = document.querySelector('#retry');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const meta = document.querySelector('#meta');
const totalEl = document.querySelector('#total');
const doneEl = document.querySelector('#done');
const pendingEl = document.querySelector('#pending');
const percentEl = document.querySelector('#percent');
const bar = document.querySelector('#bar');

let todos = [];
let requestCount = 0;

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

function render() {
  const userId = select.value;
  const list = userId === 'all' ? todos : todos.filter((todo) => String(todo.userId) === userId);
  const done = list.filter((todo) => todo.completed === true).length;
  const total = list.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  totalEl.textContent = total;
  doneEl.textContent = done;
  pendingEl.textContent = total - done;
  percentEl.textContent = `${percent}%`;
  bar.style.width = `${percent}%`;

  if (total === 0) {
    const note = document.createElement('li');
    note.className = 'empty-note';
    note.textContent = todos.length === 0 ? 'Данные ещё не загружены' : 'Для этого пользователя задач нет';
    results.replaceChildren(note);
    return;
  }

  const items = list.map((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed === true ? 'todo completed' : 'todo';
    const mark = document.createElement('span');
    mark.className = 'mark';
    mark.textContent = todo.completed === true ? '✓' : '○';
    const text = document.createElement('span');
    text.textContent = `${todo.id}. ${todo.title || 'Без названия'}`;
    item.append(mark, text);
    return item;
  });
  results.replaceChildren(...items);
}

async function loadTodos() {
  reloadButton.disabled = true;
  retryButton.disabled = true;
  setStatus('loading', 'Загрузка...');
  requestCount += 1;
  const started = performance.now();

  try {
    const response = await request('/todos');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    todos = Array.isArray(data) ? data : [];
    render();
    setStatus('success', `Загружено задач: ${todos.length}`);
  } catch (error) {
    todos = [];
    render();
    setStatus('error', errorText(error));
  } finally {
    const elapsed = Math.round(performance.now() - started);
    meta.textContent = `Запросов: ${requestCount} · Время ответа: ${elapsed} мс`;
    reloadButton.disabled = false;
    retryButton.disabled = false;
  }
}

select.addEventListener('change', render);
reloadButton.addEventListener('click', loadTodos);
retryButton.addEventListener('click', loadTodos);

loadTodos();
