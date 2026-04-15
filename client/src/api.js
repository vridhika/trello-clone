import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// ── BOARDS ──
export const getBoards = () => API.get('/boards');
export const getBoard = (boardId) => API.get(`/boards/${boardId}`);
export const createBoard = (data) => API.post('/boards', data);
export const deleteBoard = (id) => API.delete(`/boards/${id}`);

// ── LISTS ──
export const getLists = (boardId) => API.get(`/boards/${boardId}/lists`);
export const createList = (boardId, data) => API.post('/lists', { ...data, board_id: boardId });
export const updateList = (id, data) => API.put(`/lists/${id}`, data);
export const deleteList = (id) => API.delete(`/lists/${id}`);
export const reorderLists = (lists) => API.put('/lists/reorder/batch', { lists });

// ── CARDS ──
export const getCard = (id) => API.get(`/cards/${id}`);
export const createCard = (listId, data) => API.post(`/lists/${listId}/cards`, data);
export const updateCard = (id, data) => API.put(`/cards/${id}`, data);
export const deleteCard = (id) => API.delete(`/cards/${id}`);
export const reorderCards = (cards) => API.put('/cards/reorder/batch', { cards });
export const moveCard = (id, data) => API.put(`/cards/${id}/move`, data);

// ── LABELS ──
export const addLabel = (cardId, data) => API.post(`/cards/${cardId}/labels`, data);
export const removeLabel = (labelId) => API.delete(`/labels/${labelId}`);

// ── CHECKLISTS ──
export const addChecklist = (cardId, data) => API.post(`/cards/${cardId}/checklists`, data);
export const addChecklistItem = (checklistId, data) => API.post(`/checklists/${checklistId}/items`, data);
export const toggleChecklistItem = (itemId, data) => API.put(`/checklist-items/${itemId}`, data);

// ── MEMBERS ──
export const getMembers = () => API.get('/members');
export const assignMember = (cardId, data) => API.post(`/cards/${cardId}/members`, data);
export const removeMember = (cardId, memberId) => API.delete(`/cards/${cardId}/members/${memberId}`);