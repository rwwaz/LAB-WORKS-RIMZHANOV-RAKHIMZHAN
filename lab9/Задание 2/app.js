const API = 'https://jsonplaceholder.typicode.com';
const TIMEOUT = 10000;
const STORAGE_KEY = 'favoritePosts';

const form = document.querySelector('#form');
const select = document.querySelector('#userId');
const loadButton = document.querySelector('#load');
const retryButton = document.querySelector('#retry');
const onlyFavorites = document.querySelector('#onlyFavorites');
const favoriteCount = document.querySelector('#favoriteCount');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const meta = document.querySelector('#meta');

let posts = [];
let requestCount = 0;
let lastUserId = null;
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    return;
  }
}

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

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
  render();
}

function render() {
  favoriteCount.textContent = `Избранное: ${favorites.size}`;
  const visible = onlyFavorites.checked ? posts.filter((post) => favorites.has(post.id)) : posts;

  if (posts.length > 0 && visible.length === 0) {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'Среди этих публикаций нет избранных';
    results.replaceChildren(note);
    return;
  }

  const cards = visible.map((post) => {
    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('h3');
    title.textContent = `${post.id}. ${post.title || 'Без заголовка'}`;

    const body = document.createElement('p');
    body.textContent = post.body || '';

    const star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    const active = favorites.has(post.id);
    star.setAttribute('aria-pressed', String(active));
    star.textContent = active ? '★ В избранном' : '☆ В избранное';
    star.addEventListener('click', () => toggleFavorite(post.id));

    card.append(title, body, star);
    return card;
  });
  results.replaceChildren(...cards);
}

async function loadPosts(userId) {
  lastUserId = userId;
  loadButton.disabled = true;
  retryButton.disabled = true;
  posts = [];
  results.replaceChildren();
  setStatus('loading', 'Загрузка...');
  requestCount += 1;
  const started = performance.now();

  try {
    const response = await request(`/posts?userId=${encodeURIComponent(userId)}`);
    if (response.status === 404) {
      setStatus('empty', 'Ресурс не найден (HTTP 404)');
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    posts = Array.isArray(data) ? data : [];
    if (posts.length === 0) {
      setStatus('empty', `У пользователя ${userId} нет публикаций`);
      return;
    }
    render();
    setStatus('success', `Загружено публикаций: ${posts.length}`);
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
  loadPosts(select.value);
});

retryButton.addEventListener('click', () => {
  if (lastUserId !== null) loadPosts(lastUserId);
});

onlyFavorites.addEventListener('change', render);

favoriteCount.textContent = `Избранное: ${favorites.size}`;
