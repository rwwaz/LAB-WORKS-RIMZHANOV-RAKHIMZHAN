
(function () {
"use strict";

const QUESTIONS = [
  { text: "Какой атрибут нужен, чтобы подключить ES-модуль в HTML?",
    options: ["defer", 'type="module"', "async", 'rel="module"'], answer: 1 },
  { text: "Как правильно импортировать именованный экспорт sum?",
    options: ['import sum from "./m.js"', 'import { sum } from "./m.js"', 'require("./m.js")', 'include "m.js"'], answer: 1 },
  { text: "Почему модульный проект запускают через локальный HTTP-сервер?",
    options: ["Так быстрее работает CSS", "Браузер блокирует загрузку модулей с file://", "Это нужно только для картинок", "Это не нужно"], answer: 1 },
  { text: "Сколько default-экспортов может быть в одном модуле?",
    options: ["Один", "Два", "Сколько угодно", "Ни одного"], answer: 0 },
  { text: "Зачем отделять бизнес-логику от DOM?",
    options: ["Чтобы код было проще тестировать и сопровождать", "Чтобы файл стал больше", "Чтобы убрать события", "Это запрещено стандартом"], answer: 0 },
];

const startQuiz = () => ({ index: 0, score: 0 });

const isFinished = (state, questions) => state.index >= questions.length;

const getProgress = (state, questions) =>
  `Вопрос ${Math.min(state.index + 1, questions.length)} из ${questions.length}`;

function checkAnswer(state, questions, choice) {
  if (!Number.isInteger(choice) || choice < 0) throw new Error("Выберите вариант ответа");
  if (isFinished(state, questions)) throw new Error("Викторина уже завершена");
  const question = questions[state.index];
  if (choice >= question.options.length) throw new Error("Такого варианта нет");

  const correct = choice === question.answer;
  return {
    state: { index: state.index + 1, score: state.score + (correct ? 1 : 0) },
    correct,
  };
}

function renderQuestion(container, question, progress) {
  container.innerHTML =
    `<p>${progress}</p><h3>${question.text}</h3>` +
    question.options
    
      .map((option, i) => `<label><input type="radio" name="option" value="${i}"> ${option.replace(/</g, "&lt;")}</label>`)
      .join("");
}

function renderResult(container, score, total) {
  container.innerHTML = `<h3>Результат: ${score} из ${total}</h3>`;
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.className = isError ? "error" : "ok";
}


const $ = (selector) => document.querySelector(selector);
const form = $("#quiz-form"), body = $("#quiz-body"), message = $("#message");
const answerBtn = $("#answer"), restartBtn = $("#restart");

let quiz = startQuiz(); 

function showCurrent() {
  const finished = isFinished(quiz, QUESTIONS);
  if (finished) renderResult(body, quiz.score, QUESTIONS.length);
  else renderQuestion(body, QUESTIONS[quiz.index], getProgress(quiz, QUESTIONS));
  answerBtn.hidden = finished;   
  restartBtn.hidden = !finished; 
}


form.addEventListener("submit", (event) => {
  event.preventDefault(); // чтобы страница не перезагружалась
  const picked = form.querySelector('input[name="option"]:checked');
  try {
    const result = checkAnswer(quiz, QUESTIONS, picked ? Number(picked.value) : null);
    quiz = result.state;
    showMessage(message, result.correct ? "Верно!" : "Неверно", !result.correct);
    showCurrent();
  } catch (error) {
    showMessage(message, error.message, true); 
  }
});

restartBtn.addEventListener("click", () => {
  quiz = startQuiz();
  showMessage(message, "");
  showCurrent();
});

showCurrent(); 

})();
