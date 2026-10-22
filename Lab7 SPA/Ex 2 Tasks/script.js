"use strict";


let tasks = [
  { id: 1, title: "Оформить отчёт по лабораторной № 7", done: false },
  { id: 2, title: "Повторить работу с DOM", done: true },
  { id: 3, title: "Сдать расчётную работу по математике", done: false }
];
let nextId = 4;
let currentTab = "all";

const emptyText = {
  all: "Задач пока нет. Добавьте первую!",
  active: "Все задачи выполнены — отдыхайте.",
  done: "Выполненных задач пока нет."
};

const content = document.querySelector("#content");
const tabButtons = document.querySelectorAll("[data-page]");
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const errorBox = document.querySelector("#form-error");


function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function filterTasks(tab) {
  if (tab === "active") return tasks.filter(t => !t.done);
  if (tab === "done") return tasks.filter(t => t.done);
  return tasks;
}


function updateCounters() {
  ["all", "active", "done"].forEach(tab => {
    document.querySelector(`[data-count="${tab}"]`).textContent = filterTasks(tab).length;
  });
}

function renderTaskItem(task) {
  const li = h("li", "task" + (task.done ? " is-done" : ""));

  const label = h("label", "task-label");
  const checkbox = h("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Выполнено: " + task.title);
  checkbox.addEventListener("change", () => toggleTask(task.id));
  label.append(checkbox, h("span", "task-title", task.title));

  const removeBtn = h("button", "btn ghost small", "Удалить");
  removeBtn.type = "button";
  removeBtn.addEventListener("click", () => removeTask(task.id));

  li.append(label, removeBtn);
  return li;
}

function render() {
  const visible = filterTasks(currentTab);
  content.replaceChildren();

  if (visible.length === 0) {
    content.append(h("p", "empty", emptyText[currentTab]));
  } else {
    const list = h("ul", "tasks");
    visible.forEach(task => list.append(renderTaskItem(task)));
    content.append(list);
  }

  tabButtons.forEach(btn => {
    const isActive = btn.dataset.page === currentTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  updateCounters();
}


function addTask(title) {
  tasks.push({ id: nextId++, title, done: false });
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  render();
}

function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  render();
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.page;
    render();
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = input.value.trim();

  if (title === "") {
    errorBox.textContent = "Введите название задачи.";
    return;
  }
  if (tasks.some(t => t.title.toLowerCase() === title.toLowerCase())) {
    errorBox.textContent = "Такая задача уже есть в списке.";
    return;
  }

  errorBox.textContent = "";
  addTask(title);
  input.value = "";
  input.focus();
});

render();
