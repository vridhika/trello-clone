import React, { useState, useEffect } from 'react';
import {
  getBoard, getMembers, createList, updateList, deleteList,
  createCard, deleteCard, reorderCards, reorderLists
} from '../api';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import List from '../components/List';
import CardModal from '../components/CardModal';

function BoardPage({ boardId, onBack }) {
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 }
  }));

  useEffect(() => {
    loadBoard();
    getMembers().then(res => setMembers(res.data)).catch(console.error);
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const res = await getBoard(boardId);
      setBoard(res.data);
      setLists(res.data.lists || []);
      setCards(res.data.cards || []);
    } catch (err) {
      console.log('Load Board Error:', err);
    }
    setLoading(false);
  };

  // ── LISTS ──
  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await createList(boardId, { title: newListTitle, position: lists.length + 1 });
      setLists([...lists, res.data]);
      setNewListTitle('');
      setAddingList(false);
    } catch (err) {
      console.log('Add List Error:', err);
    }
  };

  const handleDeleteList = async (listId) => {
    await deleteList(listId);
    setLists(lists.filter(l => l.id !== listId));
    setCards(cards.filter(c => c.list_id !== listId));
  };

  const handleUpdateList = async (listId, title) => {
    await updateList(listId, { title });
    setLists(lists.map(l => l.id === listId ? { ...l, title } : l));
  };

  // ── CARDS ──
  const handleAddCard = async (listId, title) => {
    try {
      const listCards = cards.filter(c => c.list_id === listId);
      const res = await createCard(listId, { title, position: listCards.length + 1 });
      setCards([...cards, res.data]);
    } catch (err) {
      console.log('Add Card Error:', err.response?.data || err.message);
    }
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter(c => c.id !== cardId));
    setSelectedCard(null);
  };

  const handleCardUpdate = (updatedCard) => {
    setCards(cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c));
  };

  // ── DRAG ──
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isListDrag = lists.some(l => l.id === active.id);

    if (isListDrag) {
      const oldIndex = lists.findIndex(l => l.id === active.id);
      const newIndex = lists.findIndex(l => l.id === over.id);
      const newLists = arrayMove(lists, oldIndex, newIndex).map((l, i) => ({ ...l, position: i + 1 }));
      setLists(newLists);
      await reorderLists(newLists.map(l => ({ id: l.id, position: l.position })));
      return;
    }

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;
    const targetListId = lists.find(l => l.id === over.id)?.id || activeCard.list_id;
    const updatedCards = cards.map(c => c.id === active.id ? { ...c, list_id: targetListId } : c);
    setCards(updatedCards);
    await reorderCards(updatedCards.map((c, i) => ({ id: c.id, list_id: c.list_id, position: i + 1 })));
  };

  const filteredCards = cards.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '40px', fontSize: '18px' }}>Loading board...</div>;

  return (
    <div style={{ minHeight: '100vh', background: board?.background_color || '#0079bf' }}>

      {/* HEADER */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '700' }}>{board?.title}</h2>
        <input
          placeholder="🔍 Search cards..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '14px', width: '200px' }}
        />
      </div>

      {/* LISTS */}
      <div style={{ display: 'flex', padding: '16px', gap: '12px', overflowX: 'auto', alignItems: 'flex-start' }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
            {lists.map(list => (
              <List
                key={list.id}
                list={list}
                cards={filteredCards.filter(c => c.list_id === list.id)}
                onAddCard={handleAddCard}
                onDeleteList={handleDeleteList}
                onUpdateList={handleUpdateList}
                onCardClick={setSelectedCard}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* ADD LIST */}
        <div style={{ minWidth: '272px' }}>
          {addingList ? (
            <div style={{ background: '#ebecf0', borderRadius: '8px', padding: '8px' }}>
              <input
                autoFocus
                value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setAddingList(false); }}
                placeholder="Enter list title..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '2px solid #0079bf', fontSize: '14px', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddList} style={{ background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600' }}>
                  Add List
                </button>
                <button onClick={() => setAddingList(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#5e6c84' }}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingList(true)} style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%', textAlign: 'left' }}>
              + Add a list
            </button>
          )}
        </div>
      </div>

      {/* CARD MODAL */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDelete={handleDeleteCard}
          onUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}

export default BoardPage;