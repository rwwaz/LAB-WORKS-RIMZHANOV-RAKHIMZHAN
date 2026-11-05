
import { writeFileSync } from "node:fs";
import { addTask, moveTask } from "./tasks.js";

const attempt = (fn) => { try { return String(fn()); } catch (e) { return "Ошибка: " + e.message; } };
const one = addTask([], "Сделать лабу"); 

const tests = [
  ["Корректные данные", "«Сделать лабу»", "задач: 1, колонка: todo", () => `задач: ${one.length}, колонка: ${one[0].status}`],
  ["Пустое поле", "«   »", "Ошибка: Введите название задачи", () => addTask([], "   ")],
  ["Неверный формат", "«ab»", "Ошибка: Название слишком короткое (минимум 3 символа)", () => addTask([], "ab")],
  ["Граничное значение", "60 символов", "ок: 60", () => "ок: " + addTask([], "а".repeat(60))[0].title.length],
  ["Выход за границу", "61 символ", "Ошибка: Название слишком длинное (максимум 60 символов)", () => addTask([], "а".repeat(61))],
  ["Повторное действие", "«сделать лабу» ещё раз", "Ошибка: Такая задача уже есть", () => addTask(one, "сделать лабу")],
  ["Перемещение вперёд", "todo → doing", "doing", () => moveTask(one, 1, 1)[0].status],
  ["Перемещение за край", "done → вперёд", "Ошибка: Дальше перемещать нельзя", () => moveTask(moveTask(moveTask(one, 1, 1), 1, 1), 1, 1)],
];

let ok = true;
const rows = tests.map(([name, input, expected, fn], i) => {
  const actual = attempt(fn), pass = actual === expected; ok &&= pass;
  return `| ${i + 1} | ${name} | ${input} | ${expected} | ${actual} | ${pass ? "✔ пройден" : "✘ ошибка"} |`;
});
const md = `| № | Сценарий | Входные данные | Ожидаемый результат | Фактический результат | Статус |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
writeFileSync(new URL("./TESTS.md", import.meta.url), md);
console.log(md);
process.exit(ok ? 0 : 1);
