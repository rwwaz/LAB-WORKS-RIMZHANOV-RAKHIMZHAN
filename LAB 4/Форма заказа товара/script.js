const form = document.getElementById('orderForm');
const result = document.getElementById('result');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const product = document.getElementById('product').value;
  const qty = document.getElementById('qty').value;
  const delivery = document.querySelector('input[name="delivery"]:checked');
  const extras = document.querySelectorAll('input[name="extra"]:checked');

  result.className = '';

  if (product === '') {
    showError('Выберите товар');
    return;
  }

  const qtyNumber = Number(qty);
  if (qty === '' || isNaN(qtyNumber) || qtyNumber <= 0) {
    showError('Введите корректное количество (больше 0)');
    return;
  }

  if (!delivery) {
    showError('Выберите способ доставки');
    return;
  }

  const extraList = Array.from(extras).map(el => el.value);
  const extraText = extraList.length > 0 ? extraList.join(', ') : 'нет';

  showSuccess(
    `Заказ оформлен: ${product} x${qtyNumber}, доставка: ${delivery.value}, доп. услуги: ${extraText}`
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