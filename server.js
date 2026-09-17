const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const app = express();
const PORT = 3000;

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set defaults
db.defaults({ highScores: [] }).write();

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/highscore', (req, res) => {
  const highScore = db.get('highScores').max('score').value() || { score: 0 };
  res.json(highScore);
});

app.post('/api/highscore', (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score' });
  }
  db.get('highScores').push({ score, date: new Date().toISOString() }).write();
  res.sendStatus(201);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
