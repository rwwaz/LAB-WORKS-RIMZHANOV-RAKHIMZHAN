"use strict";

const dishes = [
  { id: 1, name: "Борщ с говядиной", category: "Горячее", price: 1800, weight: "350 г", desc: "Классический борщ со сметаной и свежей зеленью." },
  { id: 2, name: "Плов по-казахски", category: "Горячее", price: 2600, weight: "400 г", desc: "Рассыпчатый рис, баранина, морковь и чеснок." },
  { id: 3, name: "Манты", category: "Горячее", price: 2300, weight: "300 г", desc: "Пять штук на пару, подаются с катыком." },
  { id: 4, name: "Салат «Цезарь»", category: "Салаты", price: 2100, weight: "220 г", desc: "Курица, романо, пармезан и хрустящие сухарики." },
  { id: 5, name: "Тирамису", category: "Десерты", price: 1500, weight: "150 г", desc: "Маскарпоне, савоярди и какао." },
  { id: 6, name: "Чай с чабрецом", category: "Напитки", price: 700, weight: "400 мл", desc: "Листовой чёрный чай с веточкой чабреца." }
];

const promos = [
  { title: "Бизнес-ланч", text: "Суп, горячее и напиток за 2900 ₸ в будни с 12:00 до 15:00.", until: "каждый будний день" },
  { title: "Второй десерт в подарок", text: "Закажите любой десерт и получите второй бесплатно.", until: "до 31 декабря" },
  { title: "Скидка студентам", text: "10% по студенческому билету на весь заказ.", until: "постоянно" }
];

const contacts = {
  address: "г. Алматы, ул. Абая, 52",
  hours: "Ежедневно с 9:00 до 23:00",
  phone: "+7 (727) 000-00-00",
  note: "Рядом остановка «Абая — Назарбаева», парковка во дворе."
};


const STORAGE_KEY = "cafe-oblako:last-tab";
const content = document.querySelector("#content");
const tabButtons = document.querySelectorAll("[data-page]");

function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatPrice(value) {
  return value.toLocaleString("ru-RU") + " ₸";
}


function renderMenu() {
  const grid = h("div", "grid");
  dishes.forEach(dish => {
    const card = h("article", "card");
    card.append(
      h("span", "badge", dish.category),
      h("h3", "", dish.name),
      h("p", "muted", dish.desc),
      h("p", "meta", dish.weight + " · "),
    );
    card.lastChild.append(h("span", "price", formatPrice(dish.price)));
    grid.append(card);
  });
  return [h("h2", "", "Наше меню"), grid];
}

function renderPromo() {
  const list = h("div", "stack");
  promos.forEach(promo => {
    const card = h("article", "card");
    card.append(h("h3", "", promo.title), h("p", "", promo.text), h("p", "muted", "Действует: " + promo.until));
    list.append(card);
  });
  return [h("h2", "", "Акции и предложения"), list];
}

function renderAddress() {
  const card = h("article", "card");
  const rows = [
    ["Адрес", contacts.address],
    ["Часы работы", contacts.hours],
    ["Телефон", contacts.phone]
  ];
  rows.forEach(([label, value]) => {
    const p = h("p", "");
    p.append(h("strong", "", label + ": "), document.createTextNode(value));
    card.append(p);
  });
  card.append(h("p", "muted", contacts.note));
  return [h("h2", "", "Как нас найти"), card];
}

const views = { menu: renderMenu, promo: renderPromo, address: renderAddress };


function showPage(name) {
  if (!views[name]) name = "menu"; 
  content.replaceChildren(...views[name]());

  tabButtons.forEach(btn => {
    const isActive = btn.dataset.page === name;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch (e) {
    
  }
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});


let startPage = "menu";
try {
  startPage = localStorage.getItem(STORAGE_KEY) || "menu";
} catch (e) {
  startPage = "menu";
}
showPage(startPage);
