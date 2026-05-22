import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { createContent, fetchContent, fetchItem, likeItem, submitAnswer } from './api.js';

const languageOptions = ['Python', 'C++', 'C', 'C#', 'Rust', 'Assembly', 'PHP', 'JavaScript', 'Go'];
const contentTypes = ['lesson', 'test'];

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">SC</div>
          <div>
            <strong>Scripting Community</strong>
            <p>Share lessons, tests, and learning challenges.</p>
          </div>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/browse">Browse</Link>
          <Link to="/create">Create</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/create" element={<Create />} />
          <Route path="/item/:id" element={<Detail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>Built for quick lesson and test sharing. Start creating and learning.</p>
      </footer>
    </div>
  );
}

function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent().then((result) => {
      setItems(result);
      setLoading(false);
    });
  }, []);

  const featured = useMemo(() => items.slice(0, 3), [items]);

  return (
    <section className="page page-hero">
      <div className="hero-panel">
        <p className="eyebrow">Learn and create</p>
        <h1>Share interactive programming lessons and tests.</h1>
        <p className="hero-copy">
          Publish tasks with descriptions, correct answers, and language tags. Learners can attempt, like, and complete challenges instantly.
        </p>
        <div className="hero-actions">
          <Link className="button primary" to="/browse">
            Browse Challenges
          </Link>
          <Link className="button outline" to="/create">
            Create New
          </Link>
        </div>
      </div>

      <div className="hero-grid">
        {!loading ? (
          featured.map((item) => (
            <article key={item.id} className="card large-card">
              <div className="card-tag">{item.language}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="card-meta">
                <span>{item.type === 'lesson' ? 'Lesson' : 'Test'}</span>
                <span>❤️ {item.likes}</span>
              </div>
              <Link className="card-link" to={`/item/${item.id}`}>
                Try it
              </Link>
            </article>
          ))
        ) : (
          <div className="loading">Loading featured content…</div>
        )}
      </div>
    </section>
  );
}

function Browse() {
  const [items, setItems] = useState([]);
  const [language, setLanguage] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchContent({ language, type, search }).then((result) => {
      setItems(result);
      setLoading(false);
    });
  }, [language, type, search]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Browse</p>
          <h2>Find lessons and tests by language</h2>
          <p>Filter by language, lesson type, or search keywords.</p>
        </div>
      </div>

      <div className="filters">
        <div className="filter-field">
          <label>Language</label>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="">All languages</option>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>Type</label>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All content</option>
            {contentTypes.map((value) => (
              <option key={value} value={value}>
                {value === 'lesson' ? 'Lesson' : 'Test'}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field search-field">
          <label>Search</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles or descriptions" />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading content…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No content found. Create the first challenge!</div>
      ) : (
        <div className="grid-list">
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="card-tag">{item.language}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="card-meta">
                <span>{item.type === 'lesson' ? 'Lesson' : 'Test'}</span>
                <span>❤️ {item.likes}</span>
              </div>
              <Link className="card-link" to={`/item/${item.id}`}>
                View
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Create() {
  const navigate = useNavigate();
  const [type, setType] = useState('lesson');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(languageOptions[0]);
  const [answer, setAnswer] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctIndex: 0 },
  ]);
  const [message, setMessage] = useState('');

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const handleQuestionChange = (index, key, value) => {
    setQuestions((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((question, idx) => {
        if (idx !== questionIndex) return question;
        const nextOptions = [...question.options];
        nextOptions[optionIndex] = value;
        return { ...question, options: nextOptions };
      })
    );
  };

  const canSubmit = () => {
    if (!title || !description || !language) return false;
    if (type === 'lesson') return answer.trim().length > 0;
    return questions.every((question) => question.question.trim().length > 0 && question.options.every((option) => option.trim().length > 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit()) {
      setMessage('Please fill all required fields.');
      return;
    }

    const payload = {
      type,
      title,
      description,
      language,
      ...(type === 'lesson' ? { answer } : { questions }),
    };

    const result = await createContent(payload);
    if (result.id) {
      navigate('/browse');
    } else {
      setMessage(result.error || 'Could not create content');
    }
  };

  return (
    <section className="page page-form">
      <div className="page-header">
        <div>
          <p className="eyebrow">Create</p>
          <h2>Publish a lesson or test</h2>
          <p>Set up a challenge with a language tag, instructions, and expected answer or questions.</p>
        </div>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label>Type</label>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="lesson">Lesson</option>
            <option value="test">Test</option>
          </select>
        </div>

        <div className="field-row">
          <label>Language</label>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languageOptions.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="field-row">
          <label>Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Python palindrome task" />
        </div>

        <div className="field-row">
          <label>Description</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Write the lesson instructions or test introduction." />
        </div>

        {type === 'lesson' ? (
          <div className="field-row">
            <label>Correct answer</label>
            <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Expected answer text" />
          </div>
        ) : (
          <div className="questions-panel">
            <p className="section-title">Questions</p>
            {questions.map((question, qi) => (
              <div key={qi} className="question-block">
                <div className="field-row">
                  <label>{`Question ${qi + 1}`}</label>
                  <input value={question.question} onChange={(event) => handleQuestionChange(qi, 'question', event.target.value)} placeholder="Enter the question text" />
                </div>
                <div className="field-row subfield">
                  <label>Options</label>
                  <div className="option-grid">
                    {question.options.map((option, oi) => (
                      <input
                        key={oi}
                        value={option}
                        onChange={(event) => handleOptionChange(qi, oi, event.target.value)}
                        placeholder={`Option ${oi + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="field-row">
                  <label>Correct option</label>
                  <select value={question.correctIndex} onChange={(event) => handleQuestionChange(qi, 'correctIndex', Number(event.target.value))}>
                    {question.options.map((_, oi) => (
                      <option key={oi} value={oi}>{`Option ${oi + 1}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button type="button" className="button outline" onClick={handleAddQuestion}>
              Add another question
            </button>
          </div>
        )}

        {message && <div className="form-message">{message}</div>}
        <button type="submit" className="button primary wide">
          Publish Content
        </button>
      </form>
    </section>
  );
}

function Detail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    fetchItem(id).then((result) => {
      setItem(result);
      setLikes(result.likes || 0);
      setLoading(false);
    });
  }, [id]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setSelectedOptions((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!item) return;
    const payload = { id: item.id };
    if (item.type === 'lesson') {
      payload.answer = answer;
    } else {
      payload.selectedOptions = selectedOptions;
    }
    const response = await submitAnswer(payload);
    setResult(response);
  };

  const handleLike = async () => {
    const response = await likeItem(id);
    setLikes(response.likes);
  };

  if (loading) {
    return <section className="page"><div className="loading">Loading content…</div></section>;
  }

  if (!item || item.error) {
    return (
      <section className="page">
        <div className="empty-state">Could not find this challenge.</div>
      </section>
    );
  }

  return (
    <section className="page page-detail">
      <div className="detail-header">
        <div>
          <p className="eyebrow">{item.type === 'lesson' ? 'Lesson' : 'Test'}</p>
          <h2>{item.title}</h2>
          <p className="detail-meta">{item.language} • {item.likes} likes</p>
        </div>
        <button className="button outline" onClick={handleLike}>
          ❤️ Like
        </button>
      </div>

      <div className="detail-card">
        <p>{item.description}</p>
        <form className="attempt-form" onSubmit={handleSubmit}>
          {item.type === 'lesson' ? (
            <div className="field-row">
              <label>Your answer</label>
              <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />
            </div>
          ) : (
            <div className="questions-list">
              {item.questions.map((question, qi) => (
                <fieldset key={qi} className="question-block">
                  <legend>{question.question}</legend>
                  {question.options.map((option, oi) => (
                    <label key={oi} className="radio-option">
                      <input
                        type="radio"
                        name={`question-${qi}`}
                        checked={selectedOptions[qi] === oi}
                        onChange={() => handleOptionSelect(qi, oi)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          )}

          <button type="submit" className="button primary wide">
            Submit
          </button>

          {result && (
            <div className={`result-banner ${result.correct ? 'success' : 'fail'}`}>
              <p>{result.message}</p>
              {result.type === 'test' && <p>Score: {result.score} / {result.total}</p>}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function NotFound() {
  return (
    <section className="page">
      <div className="empty-state">Page not found. Return to <Link to="/">home</Link>.</div>
    </section>
  );
}

export default App;
