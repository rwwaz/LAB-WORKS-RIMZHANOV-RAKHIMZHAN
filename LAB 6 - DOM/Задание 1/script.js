const valueEl = document.querySelector("#value");
const clicksEl = document.querySelector("#clicks");
const historyEl = document.querySelector("#history");
const plusBtn = document.querySelector("#plus");
const minusBtn = document.querySelector("#minus");
const resetBtn = document.querySelector("#reset");

let count = 0;
let clicks = 0;

function render(action) {
  valueEl.textContent = count;
  valueEl.classList.toggle("positive", count > 0);
  valueEl.classList.toggle("negative", count < 0);
  clicks++;
  clicksEl.textContent = clicks;

 
  const li = document.createElement("li");
  li.textContent = action + " → " + count;
  historyEl.prepend(li);
  while (historyEl.children.length > 5) {
    historyEl.lastElementChild.remove();
  }
}

plusBtn.addEventListener("click", () => { count++; render("+1"); });
minusBtn.addEventListener("click", () => { count--; render("-1"); });
resetBtn.addEventListener("click", () => { count = 0; render("Сброс"); });


document.addEventListener("keydown", (e) => {
  if (e.key === "+" || e.key === "=") plusBtn.click();
  if (e.key === "-") minusBtn.click();
  if (e.key === "0") resetBtn.click();
});
