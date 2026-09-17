const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Mocking the server setup for testing
const app = express();
app.use(express.json());

const DB_PATH = path.join(__dirname, '../db.test.json');

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

describe('High Score API', () => {
    beforeEach(() => {
        fs.writeFileSync(DB_PATH, JSON.stringify({ highScores: [] }));
    });

    afterAll(() => {
        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
        }
    });

    test('GET /api/highscore returns 0 initially', async () => {
        const res = await request(app).get('/api/highscore');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ score: 0 });
    });

    test('POST /api/highscore saves a score', async () => {
        const res = await request(app).post('/api/highscore').send({ score: 10 });
        expect(res.statusCode).toEqual(201);
        
        const getRes = await request(app).get('/api/highscore');
        expect(getRes.body.score).toEqual(10);
    });

    test('GET /api/highscore returns the maximum score', async () => {
        await request(app).post('/api/highscore').send({ score: 10 });
        await request(app).post('/api/highscore').send({ score: 25 });
        await request(app).post('/api/highscore').send({ score: 15 });
        
        const res = await request(app).get('/api/highscore');
        expect(res.body.score).toEqual(25);
    });

    test('POST /api/highscore returns 400 for invalid score', async () => {
        const res = await request(app).post('/api/highscore').send({ score: 'invalid' });
        expect(res.statusCode).toEqual(400);
    });
});
