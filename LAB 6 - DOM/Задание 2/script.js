const overlay = document.querySelector("#overlay");
const openBtn = document.querySelector("#openBtn");
const closeBtn = document.querySelector("#closeBtn");
const counter = document.querySelector("#counter");
let opened = 0;

function openModal() {
  overlay.classList.remove("hidden");
  opened++;
  counter.textContent = opened;
}

function closeModal() {
  overlay.classList.add("hidden");
}

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);


overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
