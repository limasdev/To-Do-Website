const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = 3001;
const SECRET_KEY = 'supersecretkey'; // Em produção, usar variável de ambiente

app.use(cors());
app.use(express.json());

// Middleware de Autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rotas de Autenticação
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hashedPassword], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, email });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'Email inexistente no banco de dados' });

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      // Unificar a resposta para evitar diferenciação entre usuário inexistente e senha incorreta
      return res.status(404).json({ error: 'Email inexistente no banco de dados' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
    res.json({ auth: true, token });
  });
});

// Rotas de Todos (Protegidas)
app.get('/todos', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM todos WHERE user_id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Converter 0/1 para boolean
    const todos = rows.map(row => ({
      ...row,
      completed: !!row.completed
    }));
    res.json(todos);
  });
});

app.post('/todos', authenticateToken, (req, res) => {
  const { id, text, completed, createdAt } = req.body;
  const completedInt = completed ? 1 : 0;
  
  db.run(`INSERT INTO todos (id, user_id, text, completed, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, text, completedInt, createdAt],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Todo created' });
    }
  );
});

app.put('/todos/:id', authenticateToken, (req, res) => {
  const { completed } = req.body;
  const completedInt = completed ? 1 : 0;
  
  db.run(`UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?`,
    [completedInt, req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Todo updated' });
    }
  );
});

app.delete('/todos/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM todos WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Todo deleted' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
