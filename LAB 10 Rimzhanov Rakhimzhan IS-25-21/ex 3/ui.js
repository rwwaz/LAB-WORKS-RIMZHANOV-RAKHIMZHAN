
import { COLUMNS } from "./columns.js";
import { tasksByColumn } from "./tasks.js";

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

function renderCard(task, columnIndex) {
  const back = columnIndex > 0 ? `<button data-move="-1" data-id="${task.id}" title="Назад">←</button>` : "";
  const forward = columnIndex < COLUMNS.length - 1 ? `<button data-move="1" data-id="${task.id}" title="Вперёд">→</button>` : "";
  return `<li class="card"><span>${escapeHtml(task.title)}</span><div>${back}${forward}<button data-delete data-id="${task.id}" title="Удалить">✕</button></div></li>`;
}

export function renderBoard(board, tasks) {
  board.innerHTML = COLUMNS.map((column, index) => {
    const items = tasksByColumn(tasks, column.id);
    return `<section class="column"><h3>${column.title} (${items.length})</h3><ul>${items.map((t) => renderCard(t, index)).join("")}</ul></section>`;
  }).join("");
}

export function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.className = isError ? "error" : "ok";
}
