import { useState } from 'react';
import './App.css';

// Дочерний компонент. label и icon приходят через props.
function LikeButton({ label, icon }) {
  // state: число лайков
  const [likes, setLikes] = useState(0);

  return (
    <div className="card">
      <h3>{label}</h3>
      <p>{icon} Лайков: <b id="count">{likes}</b></p>
      {likes === 0 && <p className="hint">Лайков пока нет</p>}
      <button onClick={() => setLikes(likes + 1)}>Нравится</button>
      <button onClick={() => setLikes(0)}>Сброс</button>
    </div>
  );
}

// Родительский компонент: два независимых LikeButton
export default function App() {
  return (
    <div>
      <h1>Счетчик лайков</h1>
      <LikeButton label="Фото" icon="👍" />
      <LikeButton label="Видео" icon="❤️" />
    </div>
  );
}
