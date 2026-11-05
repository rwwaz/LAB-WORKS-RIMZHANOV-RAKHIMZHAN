
export const ABSOLUTE_ZERO_C = -273.15;

export const UNITS = {
  C: { symbol: "°C", toCelsius: (v) => v, fromCelsius: (v) => v },
  F: { symbol: "°F", toCelsius: (v) => ((v - 32) * 5) / 9, fromCelsius: (v) => (v * 9) / 5 + 32 },
  K: { symbol: "K", toCelsius: (v) => v - 273.15, fromCelsius: (v) => v + 273.15 },
};

export function parseTemperature(raw) {
  const text = String(raw).trim().replace(",", ".");
  if (text === "") throw new Error("Поле пустое: введите температуру");
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error("Неверный формат: нужно число");
  return number;
}

export function convert(value, from, to) {
  if (!UNITS[from] || !UNITS[to]) throw new Error("Неизвестная единица измерения");
  const celsius = UNITS[from].toCelsius(value);
  
  if (celsius < ABSOLUTE_ZERO_C - 1e-9) throw new Error("Температура ниже абсолютного нуля");
  return UNITS[to].fromCelsius(celsius);
}

export function round2(value) {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}
