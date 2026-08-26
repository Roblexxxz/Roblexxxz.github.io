const token = () => localStorage.getItem('authToken');
const apiBase = window.location.protocol === 'file:' ? 'http://localhost:8080/api' : `${window.location.origin}/api`;
export async function api(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
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
