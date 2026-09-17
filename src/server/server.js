const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, '../../db.json');

// Simple helper to read/write JSON
const readDb = () => {
    if (!fs.existsSync(DB_PATH)) return { highScores: [] };
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
        return { highScores: [] };
    }
};

const writeDb = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/highscore', (req, res) => {
  const data = readDb();
  const scores = data.highScores || [];
  const highScore = scores.length > 0 
      ? scores.reduce((prev, current) => (prev.score > current.score) ? prev : current)
      : { score: 0 };
  res.json(highScore);
});

app.post('/api/highscore', (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') return res.status(400).send('Invalid score');
  
  const data = readDb();
  data.highScores.push({ score, date: new Date().toISOString() });
  writeDb(data);
  res.sendStatus(201);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
