const field = document.querySelector("#field");
const target = document.querySelector("#target");
const scoreEl = document.querySelector("#score");
const goalEl = document.querySelector("#goal");
const missesEl = document.querySelector("#misses");
const resultEl = document.querySelector("#result");
const restartBtn = document.querySelector("#restartBtn");

const GOAL = 10; 
goalEl.textContent = GOAL;

let score = 0;
let misses = 0;
let startTime = null;
let gameOver = false;

function moveTarget() {
  const maxX = field.clientWidth - target.offsetWidth;
  const maxY = field.clientHeight - target.offsetHeight;
  target.style.left = Math.floor(Math.random() * maxX) + "px";
  target.style.top = Math.floor(Math.random() * maxY) + "px";
}

function startGame() {
  score = 0;
  misses = 0;
  gameOver = false;
  startTime = null;
  scoreEl.textContent = 0;
  missesEl.textContent = 0;
  resultEl.textContent = "";
  target.classList.remove("hidden");
  moveTarget();
}

function endGame() {
  gameOver = true;
  target.classList.add("hidden");
  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  resultEl.textContent = "Победа! Время: " + seconds + " с, промахов: " + misses;
}


target.addEventListener("click", (e) => {
  e.stopPropagation(); 
  if (gameOver) return;
  if (startTime === null) startTime = Date.now();
  score++;
  scoreEl.textContent = score;
  if (score >= GOAL) {
    endGame();
  } else {
    moveTarget();
  }
});

field.addEventListener("click", () => {
  if (gameOver) return;
  misses++;
  missesEl.textContent = misses;
});

restartBtn.addEventListener("click", startGame);

startGame();
