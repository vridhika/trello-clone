const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const { board_id, title, position } = req.body;
    const [result] = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?, ?, ?)',
      [board_id, title, position]
    );
    const [newList] = await pool.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);
    res.json(newList[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, position } = req.body;
    await pool.query(
      'UPDATE lists SET title = COALESCE(?, title), position = COALESCE(?, position) WHERE id = ?',
      [title, position, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM lists WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM lists WHERE id = ?', [req.params.id]);
    res.json({ message: 'List deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/reorder/batch', async (req, res) => {
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
router.post('/:id/cards', async (req, res) => {
  try {
    const { title } = req.body;
    const [existing] = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE list_id = ?',
      [req.params.id]
    );
    const position = existing[0].count;
    const [result] = await pool.query(
      'INSERT INTO cards (list_id, title, position) VALUES (?, ?, ?)',
      [req.params.id, title, position]
    );
    const [newCard] = await pool.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
    res.json(newCard[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/cards', async (req, res) => {
  try {
    const [cards] = await pool.query(
      'SELECT * FROM cards WHERE list_id = ? AND is_archived = FALSE ORDER BY position',
      [req.params.id]
    );
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;