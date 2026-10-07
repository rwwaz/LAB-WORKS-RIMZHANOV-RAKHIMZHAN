const form = document.getElementById('feedbackForm');
const result = document.getElementById('result');

form.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const topic = document.getElementById('topic').value;
  const message = document.getElementById('message').value.trim();

  result.className = '';

  if (name === '') {
    showError('Введите имя');
    return;
  }

  if (topic === '') {
    showError('Выберите тему сообщения');
    return;
  }
  
  if (message === '') {
    showError('Введите текст сообщения');
    return;
  }

  showSuccess(`Спасибо, ${name}! Ваше сообщение по теме "${topic}" отправлено.`);
});

function showError(text) {
  result.textContent = text;
  result.className = 'error';
}

function showSuccess(text) {
  result.textContent = text;
  result.className = 'success';
}