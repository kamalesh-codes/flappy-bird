const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, '../../db.json');

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
    fs.writeJsonSync(DB_PATH, { highScores: [] });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/highscore', (req, res) => {
  try {
    const data = fs.readJsonSync(DB_PATH);
    const scores = data.highScores || [];
    const highScore = scores.length > 0 
        ? scores.reduce((prev, current) => (prev.score > current.score) ? prev : current)
        : { score: 0 };
    res.json(highScore);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read high score' });
  }
});

app.post('/api/highscore', (req, res) => {
  const { score } = req.body;
  if (typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid score' });
  }
  try {
    const data = fs.readJsonSync(DB_PATH);
    data.highScores.push({ score, date: new Date().toISOString() });
    fs.writeJsonSync(DB_PATH, data);
    res.sendStatus(201);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save high score' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
