import { useState } from 'react';
import './App.css';

const CATEGORIES = ['Еда', 'Транспорт', 'Учеба'];

// Дочерний компонент 1: форма.
// props: onAdd — функция родителя, которую форма вызывает при добавлении.
function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Еда');
  const [error, setError] = useState('');

  function submit() {
    if (title.trim() === '') {
      setError('Введите название');
      return;
    }
    if (Number(amount) <= 0 || isNaN(Number(amount))) {
      setError('Сумма должна быть больше нуля');
      return;
    }
    onAdd({ id: Date.now(), title, amount: Number(amount), category });
    setTitle('');
    setAmount('');
    setError('');
  }

  return (
    <div>
      <input id="title" value={title} placeholder="Название"
        onChange={(e) => setTitle(e.target.value)} />
      <input id="amount" value={amount} placeholder="Сумма"
        onChange={(e) => setAmount(e.target.value)} />
      <select id="category" value={category}
        onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <button onClick={submit}>Добавить</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

// Дочерний компонент 2: список.
// props: expenses — массив для показа.
function ExpenseList({ expenses }) {
  if (expenses.length === 0) {
    return <p className="hint">Расходов нет</p>;
  }
  return (
    <ul>
      {expenses.map((e) => (
        <li key={e.id}>{e.title} ({e.category}) — {e.amount} ₸</li>
      ))}
    </ul>
  );
}

// Родитель хранит расходы и фильтр, считает сумму
export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('Все');

  function addExpense(item) {
    setExpenses([...expenses, item]);
  }

  const shown = filter === 'Все'
    ? expenses
    : expenses.filter((e) => e.category === filter);

  const total = shown.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <h1>Планировщик расходов</h1>
      <ExpenseForm onAdd={addExpense} />

      <p>
        Фильтр:{' '}
        <select id="filter" value={filter}
          onChange={(e) => setFilter(e.target.value)}>
          <option>Все</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </p>

      <ExpenseList expenses={shown} />
      <p id="total">Итого: {total} ₸</p>
    </div>
  );
}
