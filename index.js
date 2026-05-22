import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = process.env.PORT || 4000;
const dataPath = path.join(process.cwd(), 'server', 'data.json');

app.use(cors());
app.use(express.json());
// Serve the static site (index.html, app.js, styles.css) from project root
app.use(express.static(path.join(process.cwd())));

let db = { items: [] };

async function loadData() {
  try {
    const json = await fs.readFile(dataPath, 'utf8');
    db = JSON.parse(json);
  } catch (error) {
    db = { items: [] };
    await saveData();
  }
}

async function saveData() {
  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), 'utf8');
}

function createId(type) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return (value || '').trim().toLowerCase();
}

app.get('/api/content', (req, res) => {
  const { language, type, search } = req.query;
  let items = [...db.items];

  if (language) {
    items = items.filter((item) => item.language === language);
  }
  if (type) {
    items = items.filter((item) => item.type === type);
  }
  if (search) {
    const term = search.toLowerCase();
    items = items.filter((item) => item.title.toLowerCase().includes(term) || item.description.toLowerCase().includes(term));
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

app.get('/api/content/:id', (req, res) => {
  const item = db.items.find((entry) => entry.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Content not found' });
  }
  return res.json(item);
});

app.post('/api/content', async (req, res) => {
  const { type, title, description, language, answer, questions } = req.body;
  if (!type || !title || !description || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (type === 'lesson' && !answer) {
    return res.status(400).json({ error: 'Lesson must include an answer' });
  }

  if (type === 'test' && (!Array.isArray(questions) || questions.length === 0)) {
    return res.status(400).json({ error: 'Test must include at least one question' });
  }

  const newItem = {
    id: createId(type),
    type,
    title,
    description,
    language,
    answer: type === 'lesson' ? answer : undefined,
    questions: type === 'test' ? questions : undefined,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  db.items.unshift(newItem);
  await saveData();
  res.status(201).json(newItem);
});

app.post('/api/submit', (req, res) => {
  const { id, answer, selectedOptions } = req.body;
  const item = db.items.find((entry) => entry.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Content not found' });
  }

  if (item.type === 'lesson') {
    const correct = normalizeText(answer) === normalizeText(item.answer);
    return res.json({ type: 'lesson', correct, message: correct ? 'Completed! ✅' : 'Try again.' });
  }

  if (item.type === 'test') {
    const selected = Array.isArray(selectedOptions) ? selectedOptions : [];
    const total = item.questions.length;
    const correctCount = item.questions.reduce((count, question, index) => {
      const choice = selected[index];
      return count + (choice === question.correctIndex ? 1 : 0);
    }, 0);
    return res.json({ type: 'test', score: correctCount, total, correctCount, message: `You scored ${correctCount} of ${total}` });
  }

  return res.status(400).json({ error: 'Unsupported content type' });
});

app.post('/api/like', async (req, res) => {
  const { id } = req.body;
  const item = db.items.find((entry) => entry.id === id);

  if (!item) {
    return res.status(404).json({ error: 'Content not found' });
  }

  item.likes += 1;
  await saveData();
  res.json({ likes: item.likes });
});

app.get('/api/languages', (req, res) => {
  const languages = Array.from(new Set(db.items.map((item) => item.language))).sort();
  res.json(languages);
});

app.listen(port, async () => {
  await loadData();
  console.log(`API server running at http://localhost:${port}`);
});

// SPA fallback: serve index.html for any non-API routes so the static site works when navigating
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(process.cwd(), 'index.html'));
});
