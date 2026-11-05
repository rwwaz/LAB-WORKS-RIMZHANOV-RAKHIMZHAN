
import { QUESTIONS } from "./questions.js";
import { startQuiz, checkAnswer, isFinished, getProgress } from "./quiz.js";
import { renderQuestion, renderResult, showMessage } from "./ui.js";

window.__esModulesLoaded = true; 

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
  event.preventDefault();
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
