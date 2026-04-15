const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get cards for a list
router.get('/list/:listId', async (req, res) => {
  try {
    const [cards] = await pool.query(
      'SELECT * FROM cards WHERE list_id = ? AND is_archived = FALSE ORDER BY position',
      [req.params.listId]
    );
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single card with all details
router.get('/:id', async (req, res) => {
  try {
    const [card] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    const [labels] = await pool.query('SELECT * FROM labels WHERE card_id = ?', [req.params.id]);
    const [checklists] = await pool.query('SELECT * FROM checklists WHERE card_id = ?', [req.params.id]);
    let items = [];
    if (checklists.length > 0) {
      const checklistIds = checklists.map(c => c.id);
      const [itemRows] = await pool.query('SELECT * FROM checklist_items WHERE checklist_id IN (?)', [checklistIds]);
      items = itemRows;
    }
    const [members] = await pool.query(
      'SELECT m.* FROM members m JOIN card_members cm ON cm.member_id = m.id WHERE cm.card_id = ?',
      [req.params.id]
    );
    res.json({
      ...card[0],
      labels,
      checklists: checklists.map(cl => ({
        ...cl,
        items: items.filter(i => i.checklist_id === cl.id)
      })),
      members
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update card
router.put('/:id', async (req, res) => {
  try {
    const { title, description, due_date, is_archived, list_id, position } = req.body;
    await pool.query(
      `UPDATE cards SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        is_archived = COALESCE(?, is_archived),
        list_id = COALESCE(?, list_id),
        position = COALESCE(?, position)
      WHERE id = ?`,
      [title, description, due_date, is_archived, list_id, position, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete card
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cards WHERE id = ?', [req.params.id]);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder cards
router.put('/reorder/batch', async (req, res) => {
  try {
    const { cards } = req.body;
    for (const card of cards) {
      await pool.query(
        'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
        [card.list_id, card.position, card.id]
      );
    }
    res.json({ message: 'Cards reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add label to card
router.post('/:id/labels', async (req, res) => {
  try {
    const { color, text } = req.body;
    const [result] = await pool.query(
      'INSERT INTO labels (card_id, color, text) VALUES (?, ?, ?)',
      [req.params.id, color, text]
    );
    const [newLabel] = await pool.query('SELECT * FROM labels WHERE id = ?', [result.insertId]);
    res.json(newLabel[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove label
router.delete('/labels/:labelId', async (req, res) => {
  try {
    await pool.query('DELETE FROM labels WHERE id = ?', [req.params.labelId]);
    res.json({ message: 'Label removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add checklist
router.post('/:id/checklists', async (req, res) => {
  try {
    const { title } = req.body;
    const [result] = await pool.query(
      'INSERT INTO checklists (card_id, title) VALUES (?, ?)',
      [req.params.id, title]
    );
    const [newChecklist] = await pool.query('SELECT * FROM checklists WHERE id = ?', [result.insertId]);
    res.json(newChecklist[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add checklist item
router.post('/checklists/:checklistId/items', async (req, res) => {
  try {
    const { text } = req.body;
    const [result] = await pool.query(
      'INSERT INTO checklist_items (checklist_id, text) VALUES (?, ?)',
      [req.params.checklistId, text]
    );
    const [newItem] = await pool.query('SELECT * FROM checklist_items WHERE id = ?', [result.insertId]);
    res.json(newItem[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle checklist item
router.put('/checklist-items/:itemId', async (req, res) => {
  try {
    const { is_completed } = req.body;
    await pool.query(
      'UPDATE checklist_items SET is_completed = ? WHERE id = ?',
      [is_completed, req.params.itemId]
    );
    const [updated] = await pool.query('SELECT * FROM checklist_items WHERE id = ?', [req.params.itemId]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign member to card
router.post('/:id/members', async (req, res) => {
  try {
    const { member_id } = req.body;
    await pool.query(
      'INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)',
      [req.params.id, member_id]
    );
    res.json({ message: 'Member assigned' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from card
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM card_members WHERE card_id = ? AND member_id = ?',
      [req.params.id, req.params.memberId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move card
router.put('/:id/move', async (req, res) => {
  try {
    const { list_id, position } = req.body;
    await pool.query(
      'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
      [list_id, position, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM cards WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;