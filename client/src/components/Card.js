import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Card({ card, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: '#fff',
        padding: '10px 12px',
        marginBottom: '8px',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      }}
      onClick={() => onClick && onClick(card)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)'}
      {...attributes}
      {...listeners}
    >
      {/* LABELS */}
      {card.labels && card.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {card.labels.map((label, index) => (
            <span
              key={index}
              style={{
                background: label.color,
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              {label.text}
            </span>
          ))}
        </div>
      )}

      {/* TITLE */}
      <div style={{ fontSize: '14px', color: '#172b4d', fontWeight: '500', lineHeight: '1.4' }}>
        {card.title}
      </div>

      {/* BOTTOM ROW: due date + members */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: card.due_date || (card.members && card.members.length > 0) ? '8px' : '0' }}>
        {/* DUE DATE */}
        {card.due_date && (
          <span style={{
            fontSize: '12px',
            color: isOverdue ? '#eb5a46' : '#5e6c84',
            fontWeight: isOverdue ? '700' : '400',
            display: 'flex', alignItems: 'center', gap: '3px',
          }}>
            📅 {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}

        {/* MEMBERS */}
        {card.members && card.members.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            {card.members.map((member, index) => (
              <div
                key={index}
                title={member.name}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: '#0079bf', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '11px',
                }}
              >
                {member.name[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHECKLIST INDICATOR */}
      {card.checklists && card.checklists.length > 0 && (() => {
        const total = card.checklists.reduce((a, cl) => a + (cl.items?.length || 0), 0);
        const done = card.checklists.reduce((a, cl) => a + (cl.items?.filter(i => i.is_completed).length || 0), 0);
        if (total === 0) return null;
        return (
          <div style={{ fontSize: '12px', color: done === total ? '#61bd4f' : '#5e6c84', marginTop: '6px', fontWeight: done === total ? '700' : '400' }}>
            ☑ {done}/{total}
          </div>
        );
      })()}
    </div>
  );
}

export default Card;