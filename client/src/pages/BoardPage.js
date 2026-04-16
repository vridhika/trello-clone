import React, { useState, useEffect, useRef } from 'react';
import {
  getBoard, getMembers, createList, updateList, deleteList,
  createCard, deleteCard, reorderCards, reorderLists
} from '../api';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import List from '../components/List';
import CardModal from '../components/CardModal';
import ArchivePage from '../components/ArchivePage';

const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const in7Days = () => { const d = today(); d.setDate(d.getDate() + 7); return d; };

const LABEL_COLORS = [
  { color: '#61bd4f', name: 'Green' },
  { color: '#f2d600', name: 'Yellow' },
  { color: '#ff9f1a', name: 'Orange' },
  { color: '#eb5a46', name: 'Red' },
  { color: '#c377e0', name: 'Purple' },
  { color: '#0079bf', name: 'Blue' },
  { color: '#00c2e0', name: 'Sky' },
  { color: '#51e898', name: 'Lime' },
  { color: '#ff78cb', name: 'Pink' },
  { color: '#344563', name: 'Black' },
];

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
  const [showArchive, setShowArchive] = useState(false);

  const [dueDateFilter, setDueDateFilter] = useState(null);
  const [labelFilter, setLabelFilter] = useState(null);
  const [memberFilter, setMemberFilter] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    loadBoard();
    getMembers().then(res => setMembers(res.data)).catch(console.error);
  }, [boardId]);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadBoard = async () => {
    try {
      const res = await getBoard(boardId);
      setBoard(res.data);
      setLists(res.data.lists || []);
      // Only show non-archived cards on the board
      setCards((res.data.cards || []).filter(c => !c.is_archived));
    } catch (err) { console.log('Load Board Error:', err); }
    setLoading(false);
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await createList(boardId, { title: newListTitle, position: lists.length + 1 });
      setLists([...lists, res.data]);
      setNewListTitle(''); setAddingList(false);
    } catch (err) { console.log('Add List Error:', err); }
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

  const handleAddCard = async (listId, title) => {
    try {
      const listCards = cards.filter(c => c.list_id === listId);
      const res = await createCard(listId, { title, position: listCards.length + 1 });
      setCards([...cards, res.data]);
    } catch (err) { console.log('Add Card Error:', err.response?.data || err.message); }
  };

  const handleDeleteCard = (cardId) => {
    setCards(cards.filter(c => c.id !== cardId));
    setSelectedCard(null);
  };

  // Called when a card is archived from the modal
  const handleArchiveCard = (cardId) => {
    setCards(cards.filter(c => c.id !== cardId));
    setSelectedCard(null);
  };

  const handleCardUpdate = (updatedCard) => {
    setCards(prev =>
      prev.map(c =>
        c.id === updatedCard.id
          ? {
              ...c,
              ...updatedCard,
              labels: updatedCard.labels ?? c.labels ?? [],
              members: updatedCard.members ?? c.members ?? [],
              checklists: updatedCard.checklists ?? c.checklists ?? [],
            }
          : c
      )
    );
    setSelectedCard(prev =>
      prev && prev.id === updatedCard.id ? { ...prev, ...updatedCard } : prev
    );
  };

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

  const applyFilters = (cardList) => {
    let result = cardList;
    if (searchTerm.trim())
      result = result.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (dueDateFilter === 'overdue')
      result = result.filter(c => { if (!c.due_date) return false; const d = new Date(c.due_date); d.setHours(0,0,0,0); return d < today(); });
    else if (dueDateFilter === 'due_soon')
      result = result.filter(c => { if (!c.due_date) return false; const d = new Date(c.due_date); d.setHours(0,0,0,0); return d >= today() && d <= in7Days(); });
    if (labelFilter)
      result = result.filter(c => c.labels && c.labels.some(l => l.color === labelFilter));
    if (memberFilter)
      result = result.filter(c => c.members && c.members.some(m => m.id === memberFilter));
    return result;
  };

  const filteredCards = applyFilters(cards);
  const activeFilterCount = [dueDateFilter, labelFilter, memberFilter].filter(Boolean).length;
  const clearAllFilters = () => { setDueDateFilter(null); setLabelFilter(null); setMemberFilter(null); setShowFilterMenu(false); };

  const activeFilterLabels = [
    dueDateFilter === 'overdue' ? '🔴 Overdue' : null,
    dueDateFilter === 'due_soon' ? '🟡 Due Soon' : null,
    labelFilter ? `🏷 ${LABEL_COLORS.find(l => l.color === labelFilter)?.name}` : null,
    memberFilter ? `👤 ${members.find(m => m.id === memberFilter)?.name}` : null,
  ].filter(Boolean);

  if (loading) return <div style={{ padding: '40px', fontSize: '18px' }}>Loading board...</div>;

  // Show archive page instead of board
  if (showArchive) {
    return <ArchivePage boardId={boardId} onBack={() => setShowArchive(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: board?.background_color || '#0079bf' }}>

      {/* HEADER */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>← Back</button>
        <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '700' }}>{board?.title}</h2>

        {/* FILTER BUTTON */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterMenu(p => !p)}
            style={{
              background: activeFilterCount > 0 ? 'white' : 'rgba(255,255,255,0.25)',
              color: activeFilterCount > 0 ? '#0079bf' : 'white',
              border: 'none', padding: '6px 14px', borderRadius: '4px',
              cursor: 'pointer', fontWeight: '600', fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            🔽 Filter
            {activeFilterCount > 0 && (
              <span style={{ background: '#eb5a46', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilterMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '14px', zIndex: 500, minWidth: '240px' }}>
              <div style={filterSectionLabel}>📅 Due Date</div>
              {[{ value: 'overdue', label: '🔴 Overdue', desc: 'Past due date' }, { value: 'due_soon', label: '🟡 Due Soon', desc: 'Next 7 days' }].map(opt => (
                <FilterRow key={opt.value} label={opt.label} desc={opt.desc} active={dueDateFilter === opt.value} onClick={() => setDueDateFilter(p => p === opt.value ? null : opt.value)} />
              ))}

              <div style={{ ...filterSectionLabel, marginTop: '12px' }}>🏷 Label</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {LABEL_COLORS.map(l => (
                  <div key={l.color} onClick={() => setLabelFilter(p => p === l.color ? null : l.color)} title={l.name}
                    style={{ width: '28px', height: '28px', borderRadius: '4px', background: l.color, cursor: 'pointer', border: labelFilter === l.color ? '3px solid #172b4d' : '3px solid transparent', boxSizing: 'border-box' }}
                  />
                ))}
              </div>
              {labelFilter && <div style={{ fontSize: '12px', color: '#0079bf', fontWeight: '600', marginBottom: '4px' }}>✓ {LABEL_COLORS.find(l => l.color === labelFilter)?.name}</div>}

              <div style={{ ...filterSectionLabel, marginTop: '12px' }}>👤 Member</div>
              {members.length === 0 && <div style={{ fontSize: '13px', color: '#a5adba' }}>No members found</div>}
              {members.map(m => (
                <FilterRow key={m.id}
                  label={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0079bf', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' }}>{m.name[0].toUpperCase()}</span>{m.name}</span>}
                  active={memberFilter === m.id}
                  onClick={() => setMemberFilter(p => p === m.id ? null : m.id)}
                />
              ))}

              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ width: '100%', marginTop: '12px', padding: '7px', background: 'transparent', border: '1px solid #dfe1e6', borderRadius: '4px', color: '#eb5a46', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>
                  ✕ Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ARCHIVE BUTTON in header */}
        <button
          onClick={() => setShowArchive(true)}
          style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
        >
          📦 Archive
        </button>

        {/* SEARCH */}
        <input
          placeholder="🔍 Search cards..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: '4px', border: 'none', fontSize: '14px', width: '200px' }}
        />
      </div>

      {/* ACTIVE FILTER BANNER */}
      {activeFilterLabels.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Filtering by:</span>
          {activeFilterLabels.map((label, i) => (
            <span key={i} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{label}</span>
          ))}
          <button onClick={clearAllFilters} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', padding: '2px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>✕ Clear</button>
        </div>
      )}

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

        <div style={{ minWidth: '272px' }}>
          {addingList ? (
            <div style={{ background: '#ebecf0', borderRadius: '8px', padding: '8px' }}>
              <input
                autoFocus value={newListTitle}
                onChange={e => setNewListTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setAddingList(false); }}
                placeholder="Enter list title..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '2px solid #0079bf', fontSize: '14px', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddList} style={{ background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600' }}>Add List</button>
                <button onClick={() => setAddingList(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#5e6c84' }}>✕</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingList(true)} style={{ background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%', textAlign: 'left' }}>
              + Add a list
            </button>
          )}
        </div>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDelete={handleDeleteCard}
          onUpdate={handleCardUpdate}
          onArchive={handleArchiveCard}
        />
      )}
    </div>
  );
}

function FilterRow({ label, desc, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', background: active ? '#e4f0f6' : hovered ? '#f4f5f7' : 'transparent', marginBottom: '4px' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>{label}</div>
        {desc && <div style={{ fontSize: '12px', color: '#5e6c84' }}>{desc}</div>}
      </div>
      {active && <span style={{ color: '#0079bf', fontWeight: '700', fontSize: '16px' }}>✓</span>}
    </div>
  );
}

const filterSectionLabel = { fontSize: '11px', fontWeight: '700', color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };

export default BoardPage;