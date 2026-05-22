const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchContent({ language, type, search } = {}) {
  const params = new URLSearchParams();
  if (language) params.set('language', language);
  if (type) params.set('type', type);
  if (search) params.set('search', search);
  const response = await fetch(`${baseUrl}/api/content?${params.toString()}`);
  return response.json();
}

export async function fetchItem(id) {
  const response = await fetch(`${baseUrl}/api/content/${id}`);
  return response.json();
}

export async function createContent(payload) {
  const response = await fetch(`${baseUrl}/api/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function submitAnswer(payload) {
  const response = await fetch(`${baseUrl}/api/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function likeItem(id) {
  const response = await fetch(`${baseUrl}/api/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return response.json();
}
