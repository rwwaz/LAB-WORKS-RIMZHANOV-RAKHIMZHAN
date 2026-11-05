
export const startQuiz = () => ({ index: 0, score: 0 });

export const isFinished = (state, questions) => state.index >= questions.length;

export const getProgress = (state, questions) =>
  `Вопрос ${Math.min(state.index + 1, questions.length)} из ${questions.length}`;

export function checkAnswer(state, questions, choice) {
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
