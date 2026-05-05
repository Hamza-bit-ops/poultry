import axios from 'axios';

/** Base URL for REST API — Vite env or same-origin proxy */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normalizes API JSON envelope `{ success, data, message }`.
 */
export function unwrap(res) {
  const body = res.data;
  if (body && body.success === false) {
    const err = new Error(body.message || 'Request failed');
    err.details = body;
    throw err;
  }
  return body?.data ?? body;
}
