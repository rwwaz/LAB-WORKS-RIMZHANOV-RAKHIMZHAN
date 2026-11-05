
import { COLUMNS, shiftColumn, isValidColumn } from "./columns.js";


export const MIN_TITLE = 3;
export const MAX_TITLE = 60;


export function validateTitle(raw, tasks) {
  const title = String(raw).trim().replace(/\s+/g, " "); 
  if (!title) throw new Error("Введите название задачи");
  if (title.length < MIN_TITLE) throw new Error(`Название слишком короткое (минимум ${MIN_TITLE} символа)`);
  if (title.length > MAX_TITLE) throw new Error(`Название слишком длинное (максимум ${MAX_TITLE} символов)`);
  if (tasks.some((task) => task.title.toLowerCase() === title.toLowerCase())) throw new Error("Такая задача уже есть");
  return title;
}

export function addTask(tasks, raw) {
  const title = validateTitle(raw, tasks);
  const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1; 
  return [...tasks, { id, title, status: COLUMNS[0].id }];
}


export function moveTask(tasks, id, step) {
  const task = tasks.find((item) => item.id === id);
  if (!task) throw new Error("Задача не найдена");
  const target = shiftColumn(task.status, step);
  if (!target) throw new Error("Дальше перемещать нельзя");
  return tasks.map((item) => (item.id === id ? { ...item, status: target } : item));
}

export const deleteTask = (tasks, id) => tasks.filter((task) => task.id !== id);

export const tasksByColumn = (tasks, columnId) => tasks.filter((task) => task.status === columnId);

export function sanitizeTasks(list) {
  return Array.isArray(list)
    ? list.filter((t) => Number.isInteger(t?.id) && typeof t.title === "string" && isValidColumn(t.status))
    : [];
}
