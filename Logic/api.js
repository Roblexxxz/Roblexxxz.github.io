const token = () => localStorage.getItem('authToken');
const apiBase = window.location.protocol === 'file:' ? 'http://localhost:8080/api' : new URL('/api', window.location.href).origin + '/api';
export async function api(path, options = {}) {
    const endpoint = new URL(path, `${apiBase}/`).href;
    const response = await fetch(endpoint, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
}
export function saveSession(data) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
}
export function getSession() {
    try { return JSON.parse(localStorage.getItem('currentUser')); } catch { return null; }
}
