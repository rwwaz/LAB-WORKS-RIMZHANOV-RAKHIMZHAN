const form = document.getElementById('bookingForm');
const result = document.getElementById('result');

const prices = {
  standard: 5000,
  vip: 10000
};

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const category = document.getElementById('category').value;
  const qty = document.getElementById('qty').value;
  const options = document.querySelectorAll('input[name="option"]:checked');

  result.className = '';

  if (name === '') {
    showError('Введите имя');
    return;
  }

  if (email === '' || !email.includes('@') || !email.includes('.')) {
    showError('Введите корректный e-mail');
    return;
  }

  if (category === '') {
    showError('Выберите категорию билета');
    return;
  }

  const qtyNumber = Number(qty);
  if (qty === '' || isNaN(qtyNumber) || qtyNumber <= 0) {
    showError('Введите корректное количество билетов (больше 0)');
    return;
  }

  const basePrice = prices[category] * qtyNumber;

  let optionsPrice = 0;
  const optionNames = [];
  options.forEach(opt => {
    optionsPrice += Number(opt.dataset.price);
    optionNames.push(opt.parentElement.textContent.trim());
  });

  const total = basePrice + optionsPrice;

  const optionsText = optionNames.length > 0 ? optionNames.join(', ') : 'нет';

  showSuccess(
    `Бронирование подтверждено!\n` +
    `Имя: ${name}\n` +
    `Категория: ${category === 'standard' ? 'Стандарт' : 'VIP'} x${qtyNumber}\n` +
    `Доп. опции: ${optionsText}\n` +
    `Итоговая стоимость: ${total} тг`
  );
});

function showError(text) {
  result.textContent = text;
  result.className = 'error';
}

function showSuccess(text) {
  result.textContent = text;
  result.className = 'success';
}