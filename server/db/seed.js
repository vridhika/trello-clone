const pool = require('./index');

async function seed() {
  try {
    console.log('Seeding database...');

    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE checklist_items');
    await pool.query('TRUNCATE TABLE checklists');
    await pool.query('TRUNCATE TABLE card_members');
    await pool.query('TRUNCATE TABLE labels');
    await pool.query('TRUNCATE TABLE cards');
    await pool.query('TRUNCATE TABLE lists');
    await pool.query('TRUNCATE TABLE members');
    await pool.query('TRUNCATE TABLE boards');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    await pool.query(`INSERT INTO members (id, name, email, avatar_color) VALUES (1,'Alice Johnson','alice@example.com','#0079bf'),(2,'Bob Smith','bob@example.com','#d29034'),(3,'Carol White','carol@example.com','#519839'),(4,'David Brown','david@example.com','#b04632')`);
    await pool.query(`INSERT INTO boards (id, title, background_color) VALUES (1,'Project Alpha','#0079bf')`);
    await pool.query(`INSERT INTO lists (id, board_id, title, position) VALUES (1,1,'To Do',0),(2,1,'In Progress',1),(3,1,'Review',2),(4,1,'Done',3)`);
    await pool.query(`INSERT INTO cards (id, list_id, title, description, position, due_date) VALUES (1,1,'Set up project repo','Initialize Git and project structure',0,'2025-05-01'),(2,1,'Design database schema','Plan all tables and relationships',1,'2025-05-03'),(3,1,'Write API docs','Document all endpoints',2,NULL),(4,2,'Build login page','React form with validation',0,'2025-05-10'),(5,2,'Implement drag and drop','Use dnd-kit for cards and lists',1,'2025-05-12'),(6,3,'Code review: auth module','Review PR #12',0,'2025-05-08'),(7,3,'Test card modal','Check labels, members, checklists',1,NULL),(8,4,'Project kickoff meeting','Done and documented',0,NULL)`);
    await pool.query(`INSERT INTO labels (card_id, color, text) VALUES (1,'#61bd4f','Backend'),(2,'#f2d600','Planning'),(4,'#0079bf','Frontend'),(5,'#0079bf','Frontend'),(5,'#ff9f1a','Priority'),(6,'#eb5a46','Urgent'),(8,'#61bd4f','Complete')`);
    await pool.query(`INSERT INTO card_members (card_id, member_id) VALUES (1,1),(2,2),(4,3),(5,1),(5,2),(6,4),(7,3)`);
    await pool.query(`INSERT INTO checklists (id, card_id, title) VALUES (1,5,'Implementation Steps'),(2,4,'Design Checklist')`);
    await pool.query(`INSERT INTO checklist_items (checklist_id, text, is_complete) VALUES (1,'Install dnd-kit',1),(1,'Drag cards within a list',1),(1,'Drag cards between lists',0),(1,'Drag to reorder lists',0),(2,'Create wireframe',1),(2,'Get design approval',0),(2,'Implement responsive layout',0)`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
