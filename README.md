# Scripting Community

A modern lesson and test sharing website for programming languages.

## Features

- Create lessons and tests with language tagging
- Browse by language and type
- Submit answers and get instant completion/score feedback
- Like lessons and tests
- Fully static website that runs without a server

## Run locally

1. Open `index.html` in your browser.
2. The site stores created content and likes in your browser's local storage.

## Structure

- `index.html` — static website shell
- `styles.css` — layout and animations
- `app.js` — website logic, content creation, browsing, answer checking

## Notes

This version is a website prototype that works immediately without any package manager or backend server.

## Run with server (multi-user sharing)

To have content shared between multiple users (so tasks are visible to everyone), run the included Express server. The server serves the static site and exposes a simple API that persists content to `server/data.json`.

1. Install Node.js (if not already installed).
2. From the project root, install dependencies and start the server:

```bash
npm install
node server/index.js
```

3. Open `http://localhost:4000` in your browser. New content and likes will be stored in `server/data.json` and visible to anyone using the same server.

If `npm`/Node is not available, the site still works as a single-user prototype by opening `index.html` directly.
