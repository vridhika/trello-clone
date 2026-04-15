const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all boards
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM boards ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single board with lists and cards
router.get('/:id', async (req, res) => {
  try {
    const [board] = await pool.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    const [lists] = await pool.query('SELECT * FROM lists WHERE board_id = ? ORDER BY position', [req.params.id]);
    const listIds = lists.map(l => l.id);
    let cards = [];
    if (listIds.length > 0) {
      const [cardRows] = await pool.query(
        'SELECT c.* FROM cards c WHERE c.list_id IN (?) AND c.is_archived = FALSE ORDER BY c.position',
        [listIds]
      );
      cards = cardRows;
    }
    res.json({ ...board[0], lists, cards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create board
router.post('/', async (req, res) => {
  try {
    const { title, background_color } = req.body;
    const [result] = await pool.query(
      'INSERT INTO boards (title, background_color) VALUES (?, ?)',
      [title, background_color || '#0079bf']
    );
    const [newBoard] = await pool.query('SELECT * FROM boards WHERE id = ?', [result.insertId]);
    res.json(newBoard[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update board
router.put('/:id', async (req, res) => {
  try {
    const { title, background_color } = req.body;
    await pool.query(
      'UPDATE boards SET title = COALESCE(?, title), background_color = COALESCE(?, background_color) WHERE id = ?',
      [title, background_color, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM boards WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete board
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM boards WHERE id = ?', [req.params.id]);
    res.json({ message: 'Board deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get lists for a board
router.get('/:id/lists', async (req, res) => {
  try {
    const [lists] = await pool.query('SELECT * FROM lists WHERE board_id = ? ORDER BY position', [req.params.id]);
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create list under a board
router.post('/:id/lists', async (req, res) => {
  try {
    const { title } = req.body;
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM lists WHERE board_id = ?', [req.params.id]);
    const position = existing[0].count;
    const [result] = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [req.params.id, title, position]
    );
    const [newList] = await pool.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
    res.json(newList[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder lists
router.put('/:id/lists/reorder', async (req, res) => {
  try {
    const { lists } = req.body;
    for (const list of lists) {
      await pool.query('UPDATE lists SET position = ? WHERE id = ?', [list.position, list.id]);
    }
    res.json({ message: 'Lists reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;