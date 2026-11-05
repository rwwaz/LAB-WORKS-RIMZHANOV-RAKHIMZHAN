
import { addTask, moveTask, deleteTask, sanitizeTasks } from "./tasks.js";
import { loadTasks, saveTasks } from "./storage.js";
import { renderBoard, showMessage } from "./ui.js";

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
