
import { UNITS, parseTemperature, convert, round2 } from "./temperature.js";

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
