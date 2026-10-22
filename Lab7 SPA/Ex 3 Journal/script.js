"use strict";


const students = [
  { id: 1, name: "Ахметов Данияр", grades: [85, 90, 78] },
  { id: 2, name: "Беков Алихан", grades: [70, 65, 80] },
  { id: 3, name: "Серикова Аружан", grades: [95, 92, 98] },
  { id: 4, name: "Ким Диана", grades: [] }
];
let nextId = 5;
let currentTab = "students";
let searchQuery = "";
let selectedStudentId = students[0].id;

const content = document.querySelector("#content");
const tabButtons = Array.from(document.querySelectorAll("[data-page]"));


function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function average(list) {
  if (list.length === 0) return null;
  return list.reduce((sum, x) => sum + x, 0) / list.length;
}

function formatAverage(value) {
  return value === null ? "—" : value.toFixed(1);
}

function makeButton(text, className, onClick) {
  const btn = h("button", className, text);
  btn.type = "button";
  btn.addEventListener("click", onClick);
  return btn;
}

function wrapTable(table) {
  const wrap = h("div", "table-wrap");
  wrap.append(table);
  return wrap;
}

function buildTable(headers, rows) {
  const table = h("table");
  const thead = h("thead");
  const head = h("tr");
  headers.forEach(text => head.append(h("th", "", text)));
  thead.append(head);
  table.append(thead);
  const body = h("tbody");
  rows.forEach(cells => {
    const tr = h("tr");
    cells.forEach(cell => {
      const td = h("td");
      td.append(cell);
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  return wrapTable(table);
}


function renderStudents() {
  const root = h("div");
  root.append(h("h2", "", "Список студентов"));


  const search = h("input");
  search.type = "search";
  search.id = "search";
  search.placeholder = "Поиск по фамилии…";
  search.value = searchQuery;
  search.setAttribute("aria-label", "Поиск студента");

  const listBox = h("div", "", "");
  listBox.id = "student-list";
  search.addEventListener("input", () => {
    searchQuery = search.value;
    fillStudentList(listBox);
  });


  const form = h("form", "row");
  form.noValidate = true;
  const nameInput = h("input");
  nameInput.type = "text";
  nameInput.id = "new-student";
  nameInput.maxLength = 50;
  nameInput.placeholder = "Фамилия Имя нового студента";
  nameInput.setAttribute("aria-label", "ФИО студента");
  const addBtn = h("button", "btn", "Добавить студента");
  addBtn.type = "submit";
  const error = h("p", "error");
  error.id = "student-error";
  error.setAttribute("role", "alert");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    if (name.length < 3) {
      error.textContent = "Введите фамилию и имя (не короче 3 символов).";
      return;
    }
    if (students.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      error.textContent = "Такой студент уже есть в журнале.";
      return;
    }
    students.push({ id: nextId++, name, grades: [] });
    nameInput.value = "";
    error.textContent = "";
    fillStudentList(listBox);
  });
  form.append(nameInput, addBtn);

  fillStudentList(listBox);
  root.append(search, h("div", "gap"), listBox, h("div", "gap"), form, error);
  return root;
}

function fillStudentList(box) {
  const q = searchQuery.trim().toLowerCase();
  const found = students.filter(s => s.name.toLowerCase().includes(q));
  box.replaceChildren();

  if (found.length === 0) {
    box.append(h("p", "empty", "Никого не найдено."));
    return;
  }
  const rows = found.map((s, i) => [
    document.createTextNode(String(i + 1)),
    document.createTextNode(s.name),
    document.createTextNode(String(s.grades.length)),
    document.createTextNode(formatAverage(average(s.grades)))
  ]);
  box.append(buildTable(["№", "Студент", "Оценок", "Средний балл"], rows));
}


function renderGrades() {
  const root = h("div");
  root.append(h("h2", "", "Выставление оценок"));

  const form = h("form", "row");
  form.noValidate = true;

  const select = h("select");
  select.id = "student-select";
  select.setAttribute("aria-label", "Студент");
  students.forEach(s => {
    const option = h("option", "", s.name);
    option.value = String(s.id);
    option.selected = s.id === selectedStudentId;
    select.append(option);
  });
  select.addEventListener("change", () => {
    selectedStudentId = Number(select.value);
  });

  const gradeInput = h("input");
  gradeInput.type = "text";
  gradeInput.inputMode = "numeric";
  gradeInput.id = "grade-input";
  gradeInput.placeholder = "Балл 0–100";
  gradeInput.setAttribute("aria-label", "Балл");

  const addBtn = h("button", "btn", "Поставить оценку");
  addBtn.type = "submit";
  const error = h("p", "error");
  error.id = "grade-error";
  error.setAttribute("role", "alert");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const raw = gradeInput.value.trim();
    const value = Number(raw);
    if (raw === "" || !Number.isInteger(value) || value < 0 || value > 100) {
      error.textContent = "Введите целый балл от 0 до 100.";
      return;
    }
    const student = students.find(s => s.id === selectedStudentId);
    student.grades.push(value);
    error.textContent = "";
    gradeInput.value = "";
    showPage("grades"); 
  });
  form.append(select, gradeInput, addBtn);

  const rows = students.map(s => {
    const gradesCell = h("span", "", s.grades.length ? s.grades.join(", ") : "нет оценок");
    return [document.createTextNode(s.name), gradesCell];
  });

  root.append(form, error, buildTable(["Студент", "Оценки"], rows));
  return root;
}


function renderStats() {
  const root = h("div");
  root.append(h("h2", "", "Статистика группы"));

  const all = students.flatMap(s => s.grades);
  const withGrades = students.filter(s => s.grades.length > 0);
  const best = withGrades.slice().sort((a, b) => average(b.grades) - average(a.grades))[0];

  const cards = h("div", "grid");
  [
    ["Студентов", String(students.length)],
    ["Всего оценок", String(all.length)],
    ["Средний балл группы", formatAverage(average(all))],
    ["Лучший студент", best ? best.name : "—"]
  ].forEach(([label, value]) => {
    const card = h("article", "card");
    card.append(h("p", "muted", label), h("p", "big", value));
    cards.append(card);
  });

  const rows = students.map(s => {
    const grades = s.grades;
    return [
      document.createTextNode(s.name),
      document.createTextNode(formatAverage(average(grades))),
      document.createTextNode(grades.length ? String(Math.max(...grades)) : "—"),
      document.createTextNode(grades.length ? String(Math.min(...grades)) : "—")
    ];
  });

  root.append(cards, h("div", "gap"), buildTable(["Студент", "Средний", "Максимум", "Минимум"], rows));
  return root;
}

const views = { students: renderStudents, grades: renderGrades, stats: renderStats };


function showPage(name) {
  currentTab = views[name] ? name : "students";
  content.replaceChildren(views[currentTab]());
  tabButtons.forEach(btn => {
    const isActive = btn.dataset.page === currentTab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
}

tabButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));

  
  btn.addEventListener("keydown", event => {
    let target = null;
    if (event.key === "ArrowRight") target = tabButtons[(index + 1) % tabButtons.length];
    if (event.key === "ArrowLeft") target = tabButtons[(index - 1 + tabButtons.length) % tabButtons.length];
    if (target) {
      event.preventDefault();
      target.focus();
      showPage(target.dataset.page);
    }
  });
});

showPage("students");
