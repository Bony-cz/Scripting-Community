const STORAGE_KEY = 'scripting-community-content';
const languageOptions = ['Python', 'C++', 'C', 'C#', 'Rust', 'Assembly', 'PHP', 'JavaScript', 'Go'];
const contentTypes = [{ value: 'lesson', label: 'Lesson' }, { value: 'test', label: 'Test' }];

const defaultItems = [
  {
    id: 'lesson-1',
    type: 'lesson',
    title: 'Reverse a String in Python',
    description: "Write the result of reversing the word 'python'. Enter the reversed string exactly.",
    language: 'Python',
    answer: 'nohtyp',
    likes: 12,
    createdAt: '2026-05-22T12:00:00Z',
  },
  {
    id: 'test-1',
    type: 'test',
    title: 'C++ Basic Quiz',
    description: 'Select the correct answer for each question.',
    language: 'C++',
    questions: [
      {
        question: 'Which keyword defines a constant?',
        options: ['const', 'let', 'static', 'final'],
        correctIndex: 0,
      },
      {
        question: 'What header is needed for std::cout?',
        options: ['<iostream>', '<vector>', '<string>', '<map>'],
        correctIndex: 0,
      },
    ],
    likes: 8,
    createdAt: '2026-05-22T12:20:00Z',
  },
];

const state = {
  items: [],
  view: 'home',
  filter: { language: '', type: '', search: '' },
  currentId: null,
  message: '',
  form: {
    type: 'lesson',
    title: '',
    language: languageOptions[0],
    description: '',
    answer: '',
    questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }],
  },
  attempt: {
    answer: '',
    selected: [],
    submitResult: null,
  },
  serverAvailable: false,
};

function loadItemsLocal() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
    return [...defaultItems];
  }
  try {
    return JSON.parse(saved);
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultItems));
    return [...defaultItems];
  }
}

function saveItemsLocal() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('Network response not ok');
  return res.json();
}

async function loadItemsRemote() {
  return fetchJson('/api/content');
}

async function createItemRemote(payload) {
  return fetchJson('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

async function likeItemRemote(id) {
  return fetchJson('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
}

async function submitRemote(payload) {
  return fetchJson('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalize(value) {
  return (value || '').trim().toLowerCase();
}

function getCurrentItem() {
  return state.items.find((item) => item.id === state.currentId) || null;
}

function updateRoute() {
  const hash = window.location.hash.replace('#', '') || 'home';
  const [route, target] = hash.split('/');
  if (route === 'item' && target) {
    state.view = 'item';
    state.currentId = target;
  } else if (route === 'browse' || route === 'create' || route === 'home') {
    state.view = route;
    state.currentId = null;
  } else {
    state.view = 'home';
    state.currentId = null;
  }
  state.message = '';
  state.attempt.submitResult = null;
  render();
}

function navigate(route) {
  window.location.hash = route;
}

function render() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">SC</div>
        <div>
          <strong>Scripting Community</strong>
          <p>Share lessons, tests, and interactive coding challenges.</p>
        </div>
      </div>
      <nav class="nav-links">
        <a href="#home" class="nav-link ${state.view === 'home' ? 'active' : ''}">Home</a>
        <a href="#browse" class="nav-link ${state.view === 'browse' ? 'active' : ''}">Browse</a>
        <a href="#create" class="nav-link ${state.view === 'create' ? 'active' : ''}">Create</a>
      </nav>
    </header>
    <main>${renderPage()}</main>
    <footer class="footer">
      <p>Open this file in your browser to run the website locally.</p>
    </footer>
  `;
  attachListeners();
}

function renderPage() {
  if (state.view === 'browse') return renderBrowse();
  if (state.view === 'create') return renderCreate();
  if (state.view === 'item') return renderDetail();
  return renderHome();
}

function renderHome() {
  const items = [...state.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const featured = items.slice(0, 3);
  return `
    <section class="page page-hero">
      <div class="hero-panel">
        <p class="eyebrow">Learn and create</p>
        <h1>Share interactive lessons and programming tests.</h1>
        <p class="hero-copy">Publish tasks with instructions, expected answers, and language tags. Learners can attempt challenges, see instant feedback, and like what they enjoyed.</p>
        <div class="hero-actions">
          <a href="#browse" class="button primary">Browse Challenges</a>
          <a href="#create" class="button outline">Create New</a>
        </div>
      </div>
      <div class="hero-grid">
        ${featured
          .map(
            (item) => `
              <article class="card large-card animate-card">
                <div class="card-tag">${item.language}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-meta"><span>${item.type === 'lesson' ? 'Lesson' : 'Test'}</span><span>❤️ ${item.likes}</span></div>
                <a class="card-link" href="#item/${item.id}">Try it</a>
              </article>`
          )
          .join('')}
      </div>
    </section>`;
}

function renderBrowse() {
  const filtered = state.items.filter((item) => {
    const matchesLanguage = state.filter.language ? item.language === state.filter.language : true;
    const matchesType = state.filter.type ? item.type === state.filter.type : true;
    const query = normalize(state.filter.search);
    const matchesSearch = query
      ? item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
      : true;
    return matchesLanguage && matchesType && matchesSearch;
  });

  return `
    <section class="page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Browse</p>
          <h2>Find lessons and tests by language</h2>
          <p>Filter by language, type, or keywords and jump into a challenge.</p>
        </div>
      </div>
      <div class="filters">
        <div class="field-row">
          <label>Language</label>
          <select id="filter-language">${['', ...languageOptions]
            .map((language) => `<option value="${language}">${language || 'All languages'}</option>`)
            .join('')}</select>
        </div>
        <div class="field-row">
          <label>Type</label>
          <select id="filter-type">${['', ...contentTypes]
            .map((option) => `<option value="${option.value}">${option.label}</option>`)
            .join('')}</select>
        </div>
        <div class="field-row search-field">
          <label>Search</label>
          <input id="filter-search" value="${state.filter.search}" placeholder="Search titles or descriptions" />
        </div>
      </div>
      ${filtered.length === 0 ? '<div class="empty-state">No content found. Create the first challenge!</div>' : ''}
      <div class="grid-list">${filtered
        .map(
          (item) => `
            <article class="card animate-card">
              <div class="card-tag">${item.language}</div>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="card-meta"><span>${item.type === 'lesson' ? 'Lesson' : 'Test'}</span><span>❤️ ${item.likes}</span></div>
              <a class="card-link" href="#item/${item.id}">View</a>
            </article>`
        )
        .join('')}</div>
    </section>`;
}

function renderCreate() {
  const questionBlocks = state.form.questions
    .map(
      (question, index) => `
        <div class="question-block">
          <div class="field-row">
            <label>Question ${index + 1}</label>
            <input data-question-index="${index}" data-question-field="question" value="${question.question}" placeholder="Enter the question text" />
          </div>
          <div class="field-row subfield">
            <label>Options</label>
            <div class="option-grid">
              ${question.options
                .map(
                  (option, optionIndex) => `
                    <input data-question-index="${index}" data-option-index="${optionIndex}" data-option-field="option" value="${option}" placeholder="Option ${optionIndex + 1}" />`
                )
                .join('')}
            </div>
          </div>
          <div class="field-row">
            <label>Correct option</label>
            <select data-question-index="${index}" data-question-field="correctIndex">
              ${question.options
                .map(
                  (_, optionIndex) => `<option value="${optionIndex}" ${question.correctIndex === optionIndex ? 'selected' : ''}>Option ${optionIndex + 1}</option>`
                )
                .join('')}
            </select>
          </div>
        </div>`
    )
    .join('');

  return `
    <section class="page page-form">
      <div class="page-header">
        <div>
          <p class="eyebrow">Create</p>
          <h2>Publish a lesson or test</h2>
          <p>Create a task with a language tag, instructions, and the expected answer or test questions.</p>
        </div>
      </div>
      <form id="create-form" class="create-form">
        <div class="field-row">
          <label>Type</label>
          <select id="form-type">${contentTypes
            .map((option) => `<option value="${option.value}" ${state.form.type === option.value ? 'selected' : ''}>${option.label}</option>`)
            .join('')}</select>
        </div>
        <div class="field-row">
          <label>Language</label>
          <select id="form-language">${languageOptions
            .map((language) => `<option value="${language}" ${state.form.language === language ? 'selected' : ''}>${language}</option>`)
            .join('')}</select>
        </div>
        <div class="field-row">
          <label>Title</label>
          <input id="form-title" value="${state.form.title}" placeholder="Example: Python palindrome task" />
        </div>
        <div class="field-row">
          <label>Description</label>
          <textarea id="form-description" placeholder="Write the lesson instructions or test introduction." rows="5">${state.form.description}</textarea>
        </div>
        ${state.form.type === 'lesson'
          ? `<div class="field-row">
              <label>Correct answer</label>
              <input id="form-answer" value="${state.form.answer}" placeholder="Expected answer text" />
            </div>`
          : `<div class="questions-panel">
              <p class="section-title">Questions</p>
              ${questionBlocks}
              <button type="button" id="add-question" class="button outline">Add another question</button>
            </div>`}
        <div class="form-message">${state.message || ''}</div>
        <button type="submit" class="button primary wide">Publish Content</button>
      </form>
    </section>`;
}

function renderDetail() {
  const item = getCurrentItem();
  if (!item) {
    return `
      <section class="page">
        <div class="empty-state">Could not find this challenge. <a href="#browse" class="link">Browse challenges</a>.</div>
      </section>`;
  }

  const questionRows = item.type === 'test'
    ? item.questions
        .map(
          (question, qi) => `
            <fieldset class="question-block">
              <legend>${question.question}</legend>
              ${question.options
                .map(
                  (option, oi) => `
                    <label class="radio-option">
                      <input type="radio" name="question-${qi}" value="${oi}" data-question-index="${qi}" ${state.attempt.selected[qi] === oi ? 'checked' : ''} />
                      <span>${option}</span>
                    </label>`
                )
                .join('')}
            </fieldset>`
        )
        .join('')
    : '';

  return `
    <section class="page page-detail">
      <div class="detail-header">
        <div>
          <p class="eyebrow">${item.type === 'lesson' ? 'Lesson' : 'Test'}</p>
          <h2>${item.title}</h2>
          <p class="detail-meta">${item.language} • ${formatDate(item.createdAt)} • ❤️ ${item.likes}</p>
        </div>
        <button id="like-button" class="button outline">❤️ Like</button>
      </div>
      <div class="detail-card animate-card">
        <p>${item.description}</p>
        <form id="attempt-form" class="attempt-form">
          ${item.type === 'lesson'
            ? `<div class="field-row">
                 <label>Your answer</label>
                 <input id="attempt-answer" value="${state.attempt.answer}" placeholder="Type your answer" />
               </div>`
            : questionRows}
          <button type="submit" class="button primary wide">Submit</button>
          ${state.attempt.submitResult ? `<div class="result-banner ${state.attempt.submitResult.success ? 'success' : 'fail'}"><p>${state.attempt.submitResult.message}</p>${item.type === 'test' ? `<p>Score: ${state.attempt.submitResult.score}/${state.attempt.submitResult.total}</p>` : ''}</div>` : ''}
        </form>
      </div>
    </section>`;
}

function attachListeners() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      state.attempt.submitResult = null;
    });
  });

  if (state.view === 'browse') {
    const languageSelect = document.getElementById('filter-language');
    const typeSelect = document.getElementById('filter-type');
    const searchInput = document.getElementById('filter-search');

    if (languageSelect) languageSelect.value = state.filter.language;
    if (typeSelect) typeSelect.value = state.filter.type;
    if (searchInput) searchInput.value = state.filter.search;

    languageSelect?.addEventListener('change', (event) => {
      state.filter.language = event.target.value;
      render();
    });
    typeSelect?.addEventListener('change', (event) => {
      state.filter.type = event.target.value;
      render();
    });
    searchInput?.addEventListener('input', (event) => {
      state.filter.search = event.target.value;
      render();
    });
  }

  if (state.view === 'create') {
    const formType = document.getElementById('form-type');
    const formLanguage = document.getElementById('form-language');
    const formTitle = document.getElementById('form-title');
    const formDescription = document.getElementById('form-description');
    const formAnswer = document.getElementById('form-answer');
    const addQuestionButton = document.getElementById('add-question');
    const createForm = document.getElementById('create-form');

    formType?.addEventListener('change', (event) => {
      state.form.type = event.target.value;
      state.message = '';
      render();
    });

    formLanguage?.addEventListener('change', (event) => {
      state.form.language = event.target.value;
    });
    formTitle?.addEventListener('input', (event) => {
      state.form.title = event.target.value;
    });
    formDescription?.addEventListener('input', (event) => {
      state.form.description = event.target.value;
    });
    formAnswer?.addEventListener('input', (event) => {
      state.form.answer = event.target.value;
    });

    document.querySelectorAll('[data-question-field="question"]').forEach((input) => {
      input.addEventListener('input', (event) => {
        const index = Number(event.target.dataset.questionIndex);
        state.form.questions[index].question = event.target.value;
      });
    });

    document.querySelectorAll('[data-option-field="option"]').forEach((input) => {
      input.addEventListener('input', (event) => {
        const index = Number(event.target.dataset.questionIndex);
        const optionIndex = Number(event.target.dataset.optionIndex);
        state.form.questions[index].options[optionIndex] = event.target.value;
      });
    });

    document.querySelectorAll('[data-question-field="correctIndex"]').forEach((select) => {
      select.addEventListener('change', (event) => {
        const index = Number(event.target.dataset.questionIndex);
        state.form.questions[index].correctIndex = Number(event.target.value);
      });
    });

    addQuestionButton?.addEventListener('click', () => {
      state.form.questions.push({ question: '', options: ['', '', '', ''], correctIndex: 0 });
      render();
    });

    createForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.form.title.trim() || !state.form.description.trim() || !state.form.language) {
        state.message = 'Please complete the title, description, and language.';
        render();
        return;
      }
      if (state.form.type === 'lesson') {
        if (!state.form.answer.trim()) {
          state.message = 'Please enter the correct answer for this lesson.';
          render();
          return;
        }
      }
      if (state.form.type === 'test') {
        const valid = state.form.questions.every((question) => question.question.trim() && question.options.every((option) => option.trim()));
        if (!valid) {
          state.message = 'Please complete every question and option.';
          render();
          return;
        }
      }

      const newItem = {
        id: createId(state.form.type),
        type: state.form.type,
        title: state.form.title.trim(),
        description: state.form.description.trim(),
        language: state.form.language,
        likes: 0,
        createdAt: new Date().toISOString(),
      };

      if (state.form.type === 'lesson') {
        newItem.answer = state.form.answer.trim();
      } else {
        newItem.questions = state.form.questions.map((question) => ({
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correctIndex: Number(question.correctIndex),
        }));
      }

      if (state.serverAvailable) {
        try {
          await createItemRemote(newItem);
          const remote = await loadItemsRemote();
          state.items = Array.isArray(remote) ? remote : remote.items || [];
        } catch (err) {
          // fallback to local if server fails
          state.items.unshift(newItem);
          saveItemsLocal();
        }
      } else {
        state.items.unshift(newItem);
        saveItemsLocal();
      }
      state.form = {
        type: 'lesson',
        title: '',
        language: languageOptions[0],
        description: '',
        answer: '',
        questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }],
      };
      state.message = 'Your content is published!';
      render();
    });
  }

  if (state.view === 'item') {
    const likeButton = document.getElementById('like-button');
    const attemptForm = document.getElementById('attempt-form');
    const attemptAnswer = document.getElementById('attempt-answer');
    const radioInputs = document.querySelectorAll('input[type="radio"]');

    likeButton?.addEventListener('click', async () => {
      const item = getCurrentItem();
      if (!item) return;
      if (state.serverAvailable) {
        try {
          await likeItemRemote(item.id);
          const remote = await loadItemsRemote();
          state.items = Array.isArray(remote) ? remote : remote.items || [];
        } catch (err) {
          item.likes += 1;
          saveItemsLocal();
        }
      } else {
        item.likes += 1;
        saveItemsLocal();
      }
      render();
    });

    radioInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        const questionIndex = Number(event.target.dataset.questionIndex);
        state.attempt.selected[questionIndex] = Number(event.target.value);
      });
    });

    attemptAnswer?.addEventListener('input', (event) => {
      state.attempt.answer = event.target.value;
    });

    attemptForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const item = getCurrentItem();
      if (!item) return;
      if (state.serverAvailable) {
        try {
          if (item.type === 'lesson') {
            const response = await submitRemote({ id: item.id, answer: state.attempt.answer });
            state.attempt.submitResult = { success: !!response.correct, message: response.message || '' };
          } else {
            const response = await submitRemote({ id: item.id, selectedOptions: state.attempt.selected });
            state.attempt.submitResult = { success: response.score === response.total, score: response.score, total: response.total, message: response.message || '' };
          }
        } catch (err) {
          state.attempt.submitResult = { success: false, message: 'Submission failed (server). Try again.' };
        }
      } else {
        if (item.type === 'lesson') {
          const success = normalize(state.attempt.answer) === normalize(item.answer);
          state.attempt.submitResult = {
            success,
            message: success ? 'Correct! Lesson completed. 🎉' : 'That answer is not correct yet. Try again.',
          };
        } else {
          const total = item.questions.length;
          const correctCount = item.questions.reduce((count, question, index) => {
            const selected = state.attempt.selected[index];
            return count + (selected === question.correctIndex ? 1 : 0);
          }, 0);
          state.attempt.submitResult = {
            success: correctCount === total,
            score: correctCount,
            total,
            message: `You scored ${correctCount} out of ${total}.`,
          };
        }
      }
      render();
    });
  }
}

window.addEventListener('hashchange', updateRoute);
window.addEventListener('DOMContentLoaded', async () => {
  // Try loading data from the server API first. If unavailable, fall back to localStorage.
  try {
    const remote = await loadItemsRemote();
    if (Array.isArray(remote)) {
      state.items = remote;
    } else if (Array.isArray(remote.items)) {
      state.items = remote.items;
    } else {
      state.items = loadItemsLocal();
    }
    state.serverAvailable = true;
  } catch (err) {
    state.serverAvailable = false;
    state.items = loadItemsLocal();
  }
  updateRoute();
});
