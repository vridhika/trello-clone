# Trello Clone

A full-stack Trello-like project management application built with React, Node.js, Express, and MySQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (SPA) |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| HTTP Client | Axios |

---

## Features

### Core
- **Multiple Boards** — Create and manage multiple project boards
- **Lists** — Create, rename, delete, and drag-and-drop to reorder lists
- **Cards** — Create, edit, delete, and archive cards; drag and drop between lists and within lists
- **Card Details Modal** — Full card editor with:
  - Edit title and description
  - Set due date
  - Add/remove color labels
  - Assign/unassign members
  - Checklists with items (mark complete/incomplete with progress bar)
  - Delete card
- **Search** — Real-time search across all card titles on the board
- **Filters** — Filter cards by due date (overdue / due soon), label color, or assigned member; multiple filters stack

### Bonus
- Responsive layout (horizontal scroll for lists on smaller screens)
- Archive cards (hides from board without deleting)
- Sample data seeded on setup

---

## Database Schema

```
boards
  id, title, background_color, created_at

lists
  id, board_id (FK), title, position, created_at

cards
  id, list_id (FK), title, description, due_date, position, is_archived, created_at

labels
  id, card_id (FK), color, text

checklists
  id, card_id (FK), title, created_at

checklist_items
  id, checklist_id (FK), text, is_completed, created_at

members
  id, name, email, created_at

card_members
  card_id (FK), member_id (FK)  [composite PK]
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8+

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd trello-clone
```

### 2. Database setup
```bash
# Create the database
mysql -u root -p
CREATE DATABASE trello_clone;
exit;

# Run the schema
mysql -u root -p trello_clone < server/schema.sql

# Seed sample data
mysql -u root -p trello_clone < server/seed.sql
```

### 3. Backend setup
```bash
cd server
npm install
```

Create a `.env` file in `/server`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=trello_clone
PORT=5000
```

Start the server:
```bash
npm start
```

Server runs at `http://localhost:5000`

### 4. Frontend setup
```bash
cd client
npm install
npm start
```

Frontend runs at `http://localhost:3000`

---

## Sample Data

The seed file creates:
- **1 sample board** — "Project Alpha" with a blue background
- **4 lists** — To Do, In Progress, Review, Done
- **8 cards** spread across lists with due dates
- **4 members** — Alice, Bob, Carol, Dave (pre-seeded for assignment)

---

## Assumptions

- No authentication is required. A default user context is assumed to be logged in.
- Members are pre-seeded in the database and cannot be created through the UI.
- Archived cards are soft-deleted (hidden from the board, not removed from DB).
- Card labels are per-card (not global board labels).
- Drag and drop persists positions to the database after each drop.
- The filter for labels matches cards that have **at least one** label of the selected color.
- The filter for members matches cards that have **at least one** assigned member matching the selection.
- Multiple filters applied simultaneously use AND logic (a card must match all active filters).

---

## Project Structure

```
trello-clone/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/index.js     # Axios API calls
│   │   ├── pages/
│   │   │   ├── BoardsPage.js
│   │   │   └── BoardPage.js
│   │   └── components/
│   │       ├── List.js
│   │       ├── Card.js
│   │       └── CardModal.js
│   └── package.json
└── server/                  # Express backend
    ├── routes/
    │   ├── boards.js
    │   ├── lists.js
    │   └── cards.js
    ├── db.js
    ├── schema.sql
    ├── seed.sql
    ├── index.js
    └── package.json
```