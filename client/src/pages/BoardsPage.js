import React, { useState, useEffect } from 'react';
import { getBoards, createBoard } from '../api';

const COLORS = [
  '#0079bf', '#d04444', '#519839', '#89609e',
  '#cd5a91', '#4bbf6b', '#00aecc', '#ff7a00'
];

function BoardsPage({ onSelectBoard }) {
  const [boards, setBoards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#0079bf');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoards().then(res => {
      setBoards(res.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const res = await createBoard({ title, background_color: color });
    setBoards([res.data, ...boards]);
    setTitle('');
    setColor('#0079bf');
    setShowForm(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{
        background: '#026aa7',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          background: 'white',
          color: '#026aa7',
          fontWeight: 'bold',
          fontSize: '18px',
          padding: '4px 12px',
          borderRadius: '4px'
        }}>Trello</div>
        <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
          Your Boards
        </span>
      </div>

      <div style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '20px', color: '#172b4d', fontSize: '16px', fontWeight: '700' }}>
          MY BOARDS
        </h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {loading ? (
            <p style={{ color: '#5e6c84' }}>Loading boards...</p>
          ) : (
            boards.map(board => (
              <div
                key={board.id}
                onClick={() => onSelectBoard(board.id)}
                style={{
                  width: '200px',
                  height: '100px',
                  background: board.background_color,
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              >
                {board.title}
              </div>
            ))
          )}

          {!showForm ? (
            <div
              onClick={() => setShowForm(true)}
              style={{
                width: '200px',
                height: '100px',
                background: '#dfe1e6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#5e6c84',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c1c7d0'}
              onMouseLeave={e => e.currentTarget.style.background = '#dfe1e6'}
            >
              + Create new board
            </div>
          ) : (
            <div style={{
              width: '200px',
              background: 'white',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Board title..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '2px solid #0079bf',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '20px', height: '20px',
                      background: c,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: color === c ? '2px solid #172b4d' : '2px solid transparent',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleCreate}
                  style={{
                    background: '#0079bf', color: 'white',
                    padding: '6px 12px', borderRadius: '4px',
                    fontSize: '13px', fontWeight: '600',
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: 'transparent', color: '#5e6c84',
                    padding: '6px 8px', borderRadius: '4px',
                    fontSize: '18px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BoardsPage;