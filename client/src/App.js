import React, { useState } from 'react';
import BoardsPage from './pages/BoardsPage';
import BoardPage from './pages/BoardPage';
import './App.css';

function App() {
  const [currentBoard, setCurrentBoard] = useState(null);

  return (
    <div className="app">
      {currentBoard === null ? (
        <BoardsPage onSelectBoard={setCurrentBoard} />
      ) : (
        <BoardPage boardId={currentBoard} onBack={() => setCurrentBoard(null)} />
      )}
    </div>
  );
}

export default App;