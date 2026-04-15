import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });


export const getBoards = () => API.get('/boards');
export const createBoard = (data) => API.post('/boards', data);
export const getBoard = (id) => API.get(`/boards/${id}`);
export const updateBoard = (id, data) => API.put(`/boards/${id}`, data);
export const deleteBoard = (id) => API.delete(`/boards/${id}`);


export const getLists = (boardId) => API.get(`/boards/${boardId}/lists`);
export const createList = (boardId, data) => API.post(`/boards/${boardId}/lists`, data);
export const updateList = (id, data) => API.put(`/lists/${id}`, data);
export const deleteList = (id) => API.delete(`/lists/${id}`);
export const reorderLists = (boardId, data) => API.put(`/boards/${boardId}/lists/reorder`, { lists: data });



export const getCards = (listId) => API.get(`/cards/list/${listId}`);
export const createCard = (data) => API.post('/cards', data);

export const getCard = (id) => API.get(`/cards/${id}`);
export const updateCard = (id, data) => API.put(`/cards/${id}`, data);
export const deleteCard = (id) => API.delete(`/cards/${id}`);
export const moveCard = (id, data) => API.put(`/cards/${id}/move`, data);

// ✅ FIXED reorder route
export const reorderCards = (data) => API.put(`/cards/reorder/batch`, { cards: data });


export const addLabel = (cardId, data) => API.post(`/cards/${cardId}/labels`, data);
export const removeLabel = (id) => API.delete(`/cards/labels/${id}`);


export const addChecklist = (cardId, data) => API.post(`/cards/${cardId}/checklists`, data);
export const addChecklistItem = (checklistId, data) => API.post(`/cards/checklists/${checklistId}/items`, data);
export const toggleChecklistItem = (id, data) => API.put(`/cards/checklist-items/${id}`, data);


export const getMembers = () => API.get('/members');
export const assignMember = (cardId, data) => API.post(`/cards/${cardId}/members`, data);
export const removeMember = (cardId, memberId) => API.delete(`/cards/${cardId}/members/${memberId}`);