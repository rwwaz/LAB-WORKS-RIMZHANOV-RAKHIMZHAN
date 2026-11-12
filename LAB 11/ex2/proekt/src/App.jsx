import { useState } from 'react';
import './App.css';

// Дочерний компонент одной задачи.
// Всё приходит через props: текст, выполнена ли, и функция при клике.
function TodoItem({ text, done, onToggle }) {
  return (
    <li
      className={done ? 'done' : ''}
      onClick={onToggle}
    >
      {done ? '✅' : '⬜'} {text}
    </li>
  );
}

// Родитель хранит все данные (state)
export default function App() {
  const [tasks, setTasks] = useState([]);   // список задач
  const [text, setText] = useState('');     // что набрано в поле
  const [error, setError] = useState('');   // сообщение об ошибке

  function addTask() {
    if (text.trim() === '') {
      setError('Введите текст задачи!');
      return;
    }
    setTasks([...tasks, { id: Date.now(), text: text, done: false }]);
    setText('');
    setError('');
  }

  function toggleTask(id) {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div>
      <h1>Список задач</h1>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Новая задача"
      />
      <button onClick={addTask}>Добавить</button>
      {error && <p className="error">{error}</p>}

      <ul>
        {tasks.map((t) => (
          <TodoItem
            key={t.id}
            text={t.text}
            done={t.done}
            onToggle={() => toggleTask(t.id)}
          />
        ))}
      </ul>
      {tasks.length === 0 && <p className="hint">Задач пока нет</p>}
      <p id="summary">Выполнено: {doneCount} из {tasks.length}</p>
    </div>
  );
}
