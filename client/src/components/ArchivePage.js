/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { getArchivedCards, restoreCard, deleteCard } from '../api';

function ArchivePage({ boardId, onBack }) {
  const [archivedCards, setArchivedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    try {
      const res = await getArchivedCards(boardId);
      setArchivedCards(res.data);
    } catch (err) {
      console.error('Load archived error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (cardId) => {
    setRestoringId(cardId);
    try {
      await restoreCard(cardId);
      setArchivedCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Permanently delete this card? This cannot be undone.')) return;
    setDeletingId(cardId);
    try {
      await deleteCard(cardId);
      setArchivedCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = archivedCards.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <div style={{ background: '#0079bf', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', padding: '7px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          ← Back to Board
        </button>
        <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '700' }}>📦 Archived Cards</h2>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            placeholder="🔍 Search archived cards..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #dfe1e6', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#5e6c84', fontSize: '16px' }}>
            Loading archived cards...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#172b4d', marginBottom: '8px' }}>
              {searchTerm ? 'No matching archived cards' : 'No archived cards'}
            </div>
            <div style={{ fontSize: '14px', color: '#5e6c84' }}>
              {searchTerm ? 'Try a different search term.' : 'Cards you archive will appear here.'}
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div style={{ fontSize: '13px', color: '#5e6c84', marginBottom: '12px', fontWeight: '600' }}>
              {filtered.length} archived card{filtered.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(card => (
                <ArchivedCardRow
                  key={card.id}
                  card={card}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  isRestoring={restoringId === card.id}
                  isDeleting={deletingId === card.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ArchivedCardRow({ card, onRestore, onDelete, isRestoring, isDeleting }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'white', borderRadius: '8px', padding: '14px 16px', boxShadow: hovered ? '0 3px 10px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.08)', transition: 'box-shadow 0.15s ease', display: 'flex', alignItems: 'center', gap: '12px' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d', marginBottom: '4px' }}>{card.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {card.list_title && (
            <span style={{ fontSize: '12px', color: '#5e6c84', background: '#f4f5f7', padding: '2px 8px', borderRadius: '3px' }}>
              📋 {card.list_title}
            </span>
          )}
          {card.due_date && (
            <span style={{ fontSize: '12px', color: new Date(card.due_date) < new Date() ? '#eb5a46' : '#5e6c84' }}>
              📅 {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {card.labels && card.labels.length > 0 && (
            <div style={{ display: 'flex', gap: '3px' }}>
              {card.labels.map((l, i) => (
                <span key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: l.color, display: 'inline-block' }} title={l.text} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={() => onRestore(card.id)} disabled={isRestoring || isDeleting}
          style={{ background: '#61bd4f', color: 'white', border: 'none', borderRadius: '4px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: isRestoring ? 0.7 : 1 }}>
          {isRestoring ? '...' : '↩ Restore'}
        </button>
        <button onClick={() => onDelete(card.id)} disabled={isRestoring || isDeleting}
          style={{ background: 'transparent', color: '#eb5a46', border: '1px solid #eb5a46', borderRadius: '4px', padding: '7px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
          {isDeleting ? '...' : '🗑 Delete'}
        </button>
      </div>
    </div>
  );
}

export default ArchivePage; 
