/**
 * API & Socket client utilities for the admin portal
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiPost(path: string, body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export { API_BASE };
