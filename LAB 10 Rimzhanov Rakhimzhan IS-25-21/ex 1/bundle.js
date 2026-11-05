
(function () {
"use strict";


const ABSOLUTE_ZERO_C = -273.15;


const UNITS = {
  C: { symbol: "°C", toCelsius: (v) => v, fromCelsius: (v) => v },
  F: { symbol: "°F", toCelsius: (v) => ((v - 32) * 5) / 9, fromCelsius: (v) => (v * 9) / 5 + 32 },
  K: { symbol: "K", toCelsius: (v) => v - 273.15, fromCelsius: (v) => v + 273.15 },
};


function parseTemperature(raw) {
  const text = String(raw).trim().replace(",", "."); 
  if (text === "") throw new Error("Поле пустое: введите температуру");
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error("Неверный формат: нужно число");
  return number;
}


function convert(value, from, to) {
  if (!UNITS[from] || !UNITS[to]) throw new Error("Неизвестная единица измерения");
  const celsius = UNITS[from].toCelsius(value);
  
  if (celsius < ABSOLUTE_ZERO_C - 1e-9) throw new Error("Температура ниже абсолютного нуля");
  return UNITS[to].fromCelsius(celsius);
}


function round2(value) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}



window.__esModulesLoaded = true; 


const $ = (selector) => document.querySelector(selector);
const valueEl = $("#value"), fromEl = $("#from"), toEl = $("#to"), output = $("#result");


for (const [code, unit] of Object.entries(UNITS)) {
  for (const select of [fromEl, toEl]) select.add(new Option(unit.symbol, code));
}
toEl.value = "F"; 

function showResult() {
  try {
    const value = parseTemperature(valueEl.value);
    const result = convert(value, fromEl.value, toEl.value);
    output.textContent = `${round2(value)} ${UNITS[fromEl.value].symbol} = ${round2(result)} ${UNITS[toEl.value].symbol}`;
    output.className = "ok";
  } catch (error) {
    output.textContent = error.message;
    output.className = "error";
  }
}

$("#convert").addEventListener("click", showResult);

$("#swap").addEventListener("click", () => {
  [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  if (valueEl.value.trim() !== "") showResult(); 
});

})();
