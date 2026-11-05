
import { writeFileSync } from "node:fs";
import { QUESTIONS as Q } from "./questions.js";
import { startQuiz, checkAnswer, isFinished } from "./quiz.js";

const attempt = (fn) => { try { return String(fn()); } catch (e) { return "Ошибка: " + e.message; } };
const s0 = startQuiz();

const finishAll = () => { let s = s0; for (const q of Q) s = checkAnswer(s, Q, q.answer).state; return s; };

const tests = [
  ["Корректные данные", "верный ответ на 1-й вопрос", "true, счёт 1", () => { const r = checkAnswer(s0, Q, Q[0].answer); return `${r.correct}, счёт ${r.state.score}`; }],
  ["Пустое поле", "ответ не выбран", "Ошибка: Выберите вариант ответа", () => checkAnswer(s0, Q, null)],
  ["Неверный формат", "вариант №99", "Ошибка: Такого варианта нет", () => checkAnswer(s0, Q, 99)],
  ["Неверный ответ", "заведомо неверный вариант", "false, счёт 0", () => { const r = checkAnswer(s0, Q, (Q[0].answer + 1) % 4); return `${r.correct}, счёт ${r.state.score}`; }],
  ["Граничное значение", "верные ответы на все 5 вопросов", "завершена: true, счёт 5", () => { const s = finishAll(); return `завершена: ${isFinished(s, Q)}, счёт ${s.score}`; }],
  ["Повторное действие", "ответ после завершения", "Ошибка: Викторина уже завершена", () => checkAnswer(finishAll(), Q, 0)],
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
