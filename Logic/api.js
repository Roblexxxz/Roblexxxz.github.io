const token = () => localStorage.getItem('authToken');
const apiBase = window.location.protocol === 'file:' ? 'http://localhost:8080/api' : new URL('/api', window.location.href).origin + '/api';
const localUsersKey = 'localUsers';
const localUser = () => JSON.parse(localStorage.getItem('currentUser') || 'null');
const readLocalUsers = () => JSON.parse(localStorage.getItem(localUsersKey) || '{}');
const writeLocalUsers = users => localStorage.setItem(localUsersKey, JSON.stringify(users));
const publicUser = user => ({ username: user.username, balance: user.balance });

function localApi(path, options) {
    const users = readLocalUsers();
    const body = options?.body ? JSON.parse(options.body) : {};
    const current = localUser();
    if (path === '/signup' && options?.method === 'POST') {
        if (!/^[A-Za-z0-9_]{3,20}$/.test(body.username || '') || (body.password || '').length < 6) throw new Error('Use a 3-20 character username and a password of at least 6 characters.');
        if (users[body.username]) throw new Error('Username already exists.');
        users[body.username] = { username: body.username, password: body.password, balance: 50, friends: [], incoming: [] };
        writeLocalUsers(users);
        return {};
    }
    if (path === '/login' && options?.method === 'POST') {
        const user = users[body.username];
        if (!user || user.password !== body.password) throw new Error('Invalid username or password.');
        saveSession({ token: `local-${body.username}`, user: publicUser(user) });
        return { token: `local-${body.username}`, user: publicUser(user) };
    }
    if (!current || !users[current.username]) throw new Error('Please sign up or log in on this browser first.');
    if (path === '/users') return { users: Object.values(users).map(publicUser) };
    if (path === '/friends') return { friends: users[current.username].friends || [], requests: users[current.username].incoming || [] };
    if (path === '/friends/request' && options?.method === 'POST') {
        const target = users[body.username];
        if (!target || target.username === current.username) throw new Error('User not found.');
        if ((users[current.username].friends || []).includes(target.username) || (target.incoming || []).includes(current.username)) throw new Error('Request already sent or you are already friends.');
        target.incoming ||= [];
        target.incoming.push(current.username);
        writeLocalUsers(users);
        return { message: 'Request sent.' };
    }
    if (path === '/friends/respond' && options?.method === 'POST') {
        const owner = users[current.username];
        const index = (owner.incoming || []).indexOf(body.username);
        if (index < 0 || !users[body.username]) throw new Error('Request not found.');
        owner.incoming.splice(index, 1);
        if (body.accept) {
            owner.friends ||= [];
            users[body.username].friends ||= [];
            owner.friends.push(body.username);
            users[body.username].friends.push(current.username);
        }
        writeLocalUsers(users);
        return { message: body.accept ? 'Friend added.' : 'Request declined.' };
    }
    throw new Error('Request not available in local mode.');
}

export async function api(path, options = {}) {
    if (localStorage.getItem('localMode') === 'true') return localApi(path, options);
    const endpoint = new URL(`.${path}`, `${apiBase}/`).href;
    let response;
    try {
        response = await fetch(endpoint, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(options.headers || {}) } });
    } catch {
        localStorage.setItem('localMode', 'true');
        return localApi(path, options);
    }
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!contentType.includes('application/json')) {
        localStorage.setItem('localMode', 'true');
        return localApi(path, options);
    }
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
