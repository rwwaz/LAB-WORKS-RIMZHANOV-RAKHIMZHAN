
const KEY = "lab10.kanban";


export function loadTasks() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}


export function saveTasks(tasks) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(tasks));
  } catch {
  }
}
