
import { writeFileSync } from "node:fs";
import { convert, parseTemperature, round2 } from "./temperature.js";

const attempt = (fn) => { try { return String(fn()); } catch (e) { return "Ошибка: " + e.message; } };
const go = (raw, from, to) => round2(convert(parseTemperature(raw), from, to));

const tests = [
  ["Корректные данные", "100, °C → °F", "212", () => go("100", "C", "F")],
  ["Пустое поле", "(пусто)", "Ошибка: Поле пустое: введите температуру", () => parseTemperature("")],
  ["Неверный формат", "abc", "Ошибка: Неверный формат: нужно число", () => parseTemperature("abc")],
  ["Граничное значение", "-273,15, °C → K", "0", () => go("-273,15", "C", "K")],
  ["Ниже границы", "-300, °C → K", "Ошибка: Температура ниже абсолютного нуля", () => go("-300", "C", "K")],
  ["Повторное действие", "100, °C → °F дважды", "одинаково: 212", () => { const a = go("100", "C", "F"), b = go("100", "C", "F"); return a === b ? "одинаково: " + a : "разные"; }],
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
