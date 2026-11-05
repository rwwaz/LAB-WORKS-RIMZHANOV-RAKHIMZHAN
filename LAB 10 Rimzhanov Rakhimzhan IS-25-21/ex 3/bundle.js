
(function () {
"use strict";

const COLUMNS = [
  { id: "todo", title: "К выполнению" },
  { id: "doing", title: "В работе" },
  { id: "done", title: "Готово" },
];

const isValidColumn = (id) => COLUMNS.some((column) => column.id === id);

function shiftColumn(id, step) {
  const index = COLUMNS.findIndex((column) => column.id === id);
  return COLUMNS[index + step]?.id ?? null;
}

const MIN_TITLE = 3;
const MAX_TITLE = 60;

function validateTitle(raw, tasks) {
  const title = String(raw).trim().replace(/\s+/g, " "); 
  if (!title) throw new Error("Введите название задачи");
  if (title.length < MIN_TITLE) throw new Error(`Название слишком короткое (минимум ${MIN_TITLE} символа)`);
  if (title.length > MAX_TITLE) throw new Error(`Название слишком длинное (максимум ${MAX_TITLE} символов)`);
  // повторы не разрешаем (регистр не важен)
  if (tasks.some((task) => task.title.toLowerCase() === title.toLowerCase())) throw new Error("Такая задача уже есть");
  return title;
}

function addTask(tasks, raw) {
  const title = validateTitle(raw, tasks);
  const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1; 
  return [...tasks, { id, title, status: COLUMNS[0].id }]; 
}

function moveTask(tasks, id, step) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена");
  const target = shiftColumn(task.status, step);
  if (!target) throw new Error("Дальше перемещать нельзя");
  return tasks.map((item) => (item.id === id ? { ...item, status: target } : item));
}

const deleteTask = (tasks, id) => tasks.filter((task) => task.id !== id);

const tasksByColumn = (tasks, columnId) => tasks.filter((task) => task.status === columnId);


function sanitizeTasks(list) {
  return Array.isArray(list)
    ? list.filter((t) => Number.isInteger(t?.id) && typeof t.title === "string" && isValidColumn(t.status))
    : [];
}


const KEY = "lab10.kanban";

function loadTasks() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(tasks));
  } catch {

  }
}


const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

function renderCard(task, columnIndex) {
  const back = columnIndex > 0 ? `<button data-move="-1" data-id="${task.id}" title="Назад">←</button>` : "";
  const forward = columnIndex < COLUMNS.length - 1 ? `<button data-move="1" data-id="${task.id}" title="Вперёд">→</button>` : "";
  return `<li class="card"><span>${escapeHtml(task.title)}</span><div>${back}${forward}<button data-delete data-id="${task.id}" title="Удалить">✕</button></div></li>`;
}

function renderBoard(board, tasks) {
  board.innerHTML = COLUMNS.map((column, index) => {
    const items = tasksByColumn(tasks, column.id);
    return `<section class="column"><h3>${column.title} (${items.length})</h3><ul>${items.map((t) => renderCard(t, index)).join("")}</ul></section>`;
  }).join("");
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.className = isError ? "error" : "ok";
}


window.__esModulesLoaded = true; 

const $ = (selector) => document.querySelector(selector);
const board = $("#board"), titleEl = $("#title"), message = $("#message");


let tasks = sanitizeTasks(loadTasks());

function refresh() {
  renderBoard(board, tasks);
  saveTasks(tasks);
}


function run(action, okText) {
  try {
    tasks = action(tasks);
    refresh();
    showMessage(message, okText);
    return true;
  } catch (error) {
    showMessage(message, error.message, true);
    return false;
  }
}


$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (run((t) => addTask(t, titleEl.value), "Задача добавлена")) titleEl.value = "";
});


board.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return; 
  const id = Number(button.dataset.id);
  if ("delete" in button.dataset) run((t) => deleteTask(t, id), "Задача удалена");
  else run((t) => moveTask(t, id, Number(button.dataset.move)), "Задача перемещена");
});

refresh(); 

})();
