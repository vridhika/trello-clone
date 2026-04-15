 Trello Clone

This is a full-stack Trello-like project management application that I built using React, Node.js, Express, and MySQL. The app allows users to manage tasks using boards, lists, and cards, similar to how Trello works.

 Tech Stack

* Frontend: React.js, @dnd-kit (for drag and drop), Axios
* Backend: Node.js, Express.js
* Database: MySQL


 Setup Instructions

 1. Install dependencies

```bash
cd trello-clone
npm install
cd client
npm install
cd ../server
npm install
```
 2. Database Setup

Open MySQL and run the schema file located in:

```
server/db/schema.sql
```
 3. Environment Variables

Create a `.env` file inside the `server` folder and add:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=trello_clone
PORT=5000
```
 4. Seed the Database

```bash
cd server
node db/seed.js
```
5. Run the Application

Open two terminals:

**Terminal 1 (Backend):**

```bash
cd server
node index.js
```

**Terminal 2 (Frontend):**

```bash
cd client
npm start
```

The app will run on:

```
http://localhost:3000
```
 Features

* Create and manage boards, lists, and cards
* Drag and drop cards between lists
* Add labels, members, due dates, and checklists to cards
* Search cards by title
* Filter cards by label, member, and due date
* Archive cards
* Responsive UI

Assumptions

* No authentication is implemented; a default user is assumed
* Sample users (Alice, Bob, Carol, David) are added using the seed file
* A default board ("Project Alpha") is created when seeding the database

 Notes

This project was built as part of learning full-stack development. It helped me understand how frontend and backend work together, along with database integration and handling real-world features like drag-and-drop and filtering.
