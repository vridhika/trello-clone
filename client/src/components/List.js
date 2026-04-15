import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Card from './Card';

function List({ list, cards, onAddCard, onDeleteList, onUpdateList, onCardClick }) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // ✅ ADD CARD (FINAL FIXED)
  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      console.log("Adding card:", {
        listId: list.id,
        title: newCardTitle
      });

      await onAddCard(list.id, newCardTitle);

      setNewCardTitle('');
      setAddingCard(false);
    } catch (err) {
      console.log("Add Card Error:", err);
    }
  };

  // ✅ UPDATE LIST TITLE
  const handleTitleSave = () => {
    if (title.trim() && title !== list.title) {
      onUpdateList(list.id, title);
    }
    setEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        minWidth: '272px',
        maxWidth: '272px',
        background: '#ebecf0',
        borderRadius: '8px',
        padding: '8px',
        alignSelf: 'flex-start',
      }}
    >
      {/* ===== LIST HEADER ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        padding: '4px 4px 0'
      }}>
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            style={{
              flex: 1,
              fontWeight: '700',
              fontSize: '14px',
              padding: '4px 6px',
              border: '2px solid #0079bf',
              borderRadius: '4px',
              background: 'white',
            }}
          />
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            style={{
              flex: 1,
              fontWeight: '700',
              fontSize: '14px',
              color: '#172b4d',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
            }}
            {...attributes}
            {...listeners}
          >
            {list.title}
          </h3>
        )}

        <button
          onClick={() => {
            if (window.confirm('Delete this list?')) {
              onDeleteList(list.id);
            }
          }}
          style={{
            background: 'transparent',
            color: '#6b778c',
            fontSize: '16px',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* ===== CARDS ===== */}
      <SortableContext
        items={cards.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ minHeight: '4px' }}>
          {cards
            .sort((a, b) => a.position - b.position)
            .map(card => (
              <Card
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
              />
            ))}
        </div>
      </SortableContext>

      {/* ===== ADD CARD ===== */}
      {addingCard ? (
        <div style={{ marginTop: '8px' }}>
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCard();
              }
            }}
            placeholder="Enter a title for this card..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              border: '2px solid #0079bf',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleAddCard}
              style={{
                background: '#0079bf',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Add Card
            </button>

            <button
              onClick={() => {
                setAddingCard(false);
                setNewCardTitle('');
              }}
              style={{
                background: 'transparent',
                color: '#5e6c84',
                fontSize: '20px',
                padding: '2px 8px',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '8px',
            background: 'transparent',
            color: '#5e6c84',
            fontSize: '14px',
            borderRadius: '4px',
            marginTop: '4px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#dfe1e6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + Add a card
        </button>
      )}
    </div>
  );
}

export default List;