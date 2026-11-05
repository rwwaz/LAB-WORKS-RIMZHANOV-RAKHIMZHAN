
export function renderQuestion(container, question, progress) {
  container.innerHTML =
    `<p>${progress}</p><h3>${question.text}</h3>` +
    question.options
      
      .map((option, i) => `<label><input type="radio" name="option" value="${i}"> ${option.replace(/</g, "&lt;")}</label>`)
      .join("");
}


export function renderResult(container, score, total) {
  container.innerHTML = `<h3>Результат: ${score} из ${total}</h3>`;
}


export function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.className = isError ? "error" : "ok";
}
