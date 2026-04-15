import React, { useState, useEffect } from 'react';
import {
  getCard, updateCard, deleteCard,
  addLabel, removeLabel,
  addChecklist, addChecklistItem, toggleChecklistItem,
  getMembers, assignMember, removeMember
} from '../api';

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

function CardModal({ card: initialCard, onClose, onUpdate, onDelete }) {
  const [card, setCard] = useState(initialCard);
  const [title, setTitle] = useState(initialCard.title);
  const [description, setDescription] = useState(initialCard.description || '');
  const [dueDate, setDueDate] = useState(initialCard.due_date ? initialCard.due_date.split('T')[0] : '');
  const [labels, setLabels] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCard();
    loadMembers();
  }, []);

  const loadCard = async () => {
    try {
      const res = await getCard(initialCard.id);
      setCard(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description || '');
      setDueDate(res.data.due_date ? res.data.due_date.split('T')[0] : '');
      setLabels(res.data.labels || []);
      setChecklists(res.data.checklists || []);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await getMembers();
      setAllMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    await updateCard(card.id, { title });
    setEditingTitle(false);
    onUpdate && onUpdate({ ...card, title });
  };

  const handleSaveDescription = async () => {
    await updateCard(card.id, { description });
    setEditingDesc(false);
  };

  const handleSaveDueDate = async (val) => {
    setDueDate(val);
    await updateCard(card.id, { due_date: val || null });
  };

  const handleAddLabel = async (color, name) => {
    try {
      const res = await addLabel(card.id, { color, text: name });
      setLabels(prev => [...prev, res.data]);
      setShowLabelPicker(false);
    } catch (err) { console.error(err); }
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await removeLabel(labelId);
      setLabels(prev => prev.filter(l => l.id !== labelId));
    } catch (err) { console.error(err); }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      const res = await addChecklist(card.id, { title: newChecklistTitle });
      setChecklists(prev => [...prev, { ...res.data, items: [] }]);
      setNewChecklistTitle('');
    } catch (err) { console.error(err); }
  };

  const handleAddItem = async (checklistId) => {
    const text = newItemTexts[checklistId];
    if (!text?.trim()) return;
    try {
      const res = await addChecklistItem(checklistId, { text });
      setChecklists(prev => prev.map(cl =>
        cl.id === checklistId
          ? { ...cl, items: [...(cl.items || []), res.data] }
          : cl
      ));
      setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }));
    } catch (err) { console.error(err); }
  };

  const handleToggleItem = async (checklistId, itemId, is_completed) => {
    try {
      await toggleChecklistItem(itemId, { is_completed: !is_completed });
      setChecklists(prev => prev.map(cl =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map(item =>
                item.id === itemId ? { ...item, is_completed: !is_completed } : item
              )
            }
          : cl
      ));
    } catch (err) { console.error(err); }
  };

  const handleAssignMember = async (memberId) => {
    const already = members.find(m => m.id === memberId);
    try {
      if (already) {
        await removeMember(card.id, memberId);
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
        await assignMember(card.id, { member_id: memberId });
        const member = allMembers.find(m => m.id === memberId);
        setMembers(prev => [...prev, member]);
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this card?')) {
      await deleteCard(card.id);
      onDelete && onDelete(card.id);
      onClose();
    }
  };

  const completedItems = checklists.reduce((acc, cl) => acc + (cl.items || []).filter(i => i.is_completed).length, 0);
  const totalItems = checklists.reduce((acc, cl) => acc + (cl.items || []).length, 0);
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (loading) return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <p style={{ padding: '20px', color: '#5e6c84' }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ flex: 1, marginRight: '12px' }}>
            <div style={{ fontSize: '12px', color: '#5e6c84', marginBottom: '4px' }}>📋 Card</div>
            {editingTitle ? (
              <textarea
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTitle(); } }}
                style={{ width: '100%', fontSize: '18px', fontWeight: '700', padding: '6px', border: '2px solid #0079bf', borderRadius: '4px', resize: 'none', fontFamily: 'inherit' }}
              />
            ) : (
              <h2 onClick={() => setEditingTitle(true)} style={{ fontSize: '18px', fontWeight: '700', color: '#172b4d', cursor: 'pointer', margin: 0 }}>
                {title}
              </h2>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#5e6c84', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 1 }}>

            {/* LABELS */}
            {labels.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={sectionLabel}>Labels</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {labels.map(l => (
                    <span
                      key={l.id}
                      onClick={() => handleRemoveLabel(l.id)}
                      title="Click to remove"
                      style={{
                        background: l.color,
                        color: 'white',
                        borderRadius: '4px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        minWidth: '40px',
                        display: 'inline-block'
                      }}>
                      {l.text || '\u00A0'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MEMBERS */}
            {members.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={sectionLabel}>Members</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {members.map(m => (
                    <div
                      key={m.id}
                      title={m.name}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#0079bf', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '700', fontSize: '14px'
                      }}>
                      {m.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DUE DATE */}
            {dueDate && (
              <div style={{ marginBottom: '16px' }}>
                <div style={sectionLabel}>Due Date</div>
                <span style={{
                  background: new Date(dueDate) < new Date() ? '#eb5a46' : '#61bd4f',
                  color: 'white', borderRadius: '4px', padding: '4px 10px',
                  fontSize: '13px', fontWeight: '600'
                }}>
                  📅 {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* DESCRIPTION */}
            <div style={{ marginBottom: '16px' }}>
              <div style={sectionLabel}>📝 Description</div>
              {editingDesc ? (
                <div>
                  <textarea
                    autoFocus
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '8px', border: '2px solid #0079bf', borderRadius: '4px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button onClick={handleSaveDescription} style={btnPrimary}>Save</button>
                    <button onClick={() => setEditingDesc(false)} style={btnSecondary}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  style={{ minHeight: '60px', padding: '8px', background: '#f4f5f7', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: description ? '#172b4d' : '#a5adba' }}>
                  {description || 'Add a description...'}
                </div>
              )}
            </div>

            {/* CHECKLISTS */}
            {checklists.map(cl => (
              <div key={cl.id} style={{ marginBottom: '20px' }}>
                <div style={sectionLabel}>☑ {cl.title}</div>
                {totalItems > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#5e6c84', minWidth: '32px' }}>{progress}%</span>
                    <div style={{ flex: 1, height: '8px', background: '#dfe1e6', borderRadius: '4px' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#61bd4f' : '#0079bf', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
                {(cl.items || []).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      checked={!!item.is_completed}
                      onChange={() => handleToggleItem(cl.id, item.id, item.is_completed)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', textDecoration: item.is_completed ? 'line-through' : 'none', color: item.is_completed ? '#a5adba' : '#172b4d' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    value={newItemTexts[cl.id] || ''}
                    onChange={e => setNewItemTexts(prev => ({ ...prev, [cl.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem(cl.id); }}
                    placeholder="Add an item..."
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <button onClick={() => handleAddItem(cl.id)} style={btnPrimary}>Add</button>
                </div>
              </div>
            ))}

          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ width: '168px' }}>
            <div style={sectionLabel}>Add to card</div>

            {/* LABELS BUTTON */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <button
                onClick={() => { setShowLabelPicker(!showLabelPicker); setShowMemberPicker(false); }}
                style={sidebarBtn}>
                🏷 Labels
              </button>
              {showLabelPicker && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%',
                  background: 'white', border: '1px solid #dfe1e6',
                  borderRadius: '8px', padding: '12px', zIndex: 100,
                  width: '210px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '10px', color: '#5e6c84' }}>Select a color</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {LABEL_COLORS.map(l => (
                      <div
                        key={l.color}
                        onClick={() => handleAddLabel(l.color, l.name)}
                        style={{
                          background: l.color, borderRadius: '4px',
                          padding: '8px', cursor: 'pointer',
                          color: 'white', fontSize: '12px',
                          fontWeight: '700', textAlign: 'center'
                        }}>
                        {l.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MEMBERS BUTTON */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <button
                onClick={() => { setShowMemberPicker(!showMemberPicker); setShowLabelPicker(false); }}
                style={sidebarBtn}>
                👤 Members
              </button>
              {showMemberPicker && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%',
                  background: 'white', border: '1px solid #dfe1e6',
                  borderRadius: '8px', padding: '12px', zIndex: 100,
                  width: '210px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '10px', color: '#5e6c84' }}>Assign members</div>
                  {allMembers.length === 0 && <div style={{ fontSize: '13px', color: '#a5adba' }}>No members found</div>}
                  {allMembers.map(m => {
                    const assigned = members.find(am => am.id === m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleAssignMember(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '6px', borderRadius: '4px', cursor: 'pointer',
                          background: assigned ? '#e4f0f6' : 'transparent',
                          marginBottom: '4px'
                        }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: '#0079bf', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '700', fontSize: '13px', flexShrink: 0
                        }}>
                          {m.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', color: '#172b4d' }}>{m.name}</span>
                        {assigned && <span style={{ marginLeft: 'auto', color: '#0079bf', fontWeight: '700' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DUE DATE */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '4px' }}>📅 Due Date</div>
              <input
                type="date"
                value={dueDate}
                onChange={e => handleSaveDueDate(e.target.value)}
                style={{ width: '100%', padding: '6px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* CHECKLIST */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '4px' }}>☑ Checklist</div>
              <input
                value={newChecklistTitle}
                onChange={e => setNewChecklistTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddChecklist(); }}
                placeholder="Checklist title..."
                style={{ width: '100%', padding: '6px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }}
              />
              <button onClick={handleAddChecklist} style={{ ...btnPrimary, width: '100%' }}>Add Checklist</button>
            </div>

            {/* DELETE */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #dfe1e6', paddingTop: '12px' }}>
              <button onClick={handleDelete} style={{ ...sidebarBtn, background: '#eb5a46', color: 'white', border: 'none', marginBottom: 0 }}>
                🗑 Delete Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'flex-start', justifyContent: 'center',
  zIndex: 1000, overflowY: 'auto', padding: '40px 16px'
};
const modalStyle = {
  background: 'white', borderRadius: '12px',
  padding: '24px', width: '100%', maxWidth: '680px',
  minHeight: '400px', position: 'relative'
};
const sectionLabel = {
  fontSize: '12px', fontWeight: '700', color: '#5e6c84',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  marginBottom: '8px'
};
const btnPrimary = {
  background: '#0079bf', color: 'white',
  border: 'none', borderRadius: '4px',
  padding: '6px 14px', fontSize: '14px',
  fontWeight: '600', cursor: 'pointer'
};
const btnSecondary = {
  background: 'transparent', color: '#5e6c84',
  border: '1px solid #dfe1e6', borderRadius: '4px',
  padding: '6px 14px', fontSize: '14px', cursor: 'pointer'
};
const sidebarBtn = {
  width: '100%', textAlign: 'left',
  background: '#f4f5f7', color: '#172b4d',
  border: 'none', borderRadius: '4px',
  padding: '8px 10px', fontSize: '14px',
  cursor: 'pointer', fontWeight: '600'
};

export default CardModal;