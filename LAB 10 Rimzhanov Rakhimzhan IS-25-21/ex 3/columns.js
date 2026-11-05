
export const COLUMNS = [
  { id: "todo", title: "К выполнению" },
  { id: "doing", title: "В работе" },
  { id: "done", title: "Готово" },
];

export const isValidColumn = (id) => COLUMNS.some((column) => column.id === id);

export function shiftColumn(id, step) {
  const index = COLUMNS.findIndex((column) => column.id === id);
  return COLUMNS[index + step]?.id ?? null;
}
