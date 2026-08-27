import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = join(root, 'data');
const usersFile = join(dataDir, 'users.json');
mkdirSync(dataDir, { recursive: true });
if (!existsSync(usersFile)) writeFileSync(usersFile, '{}');
const users = JSON.parse(readFileSync(usersFile, 'utf8'));
const sessions = new Map();
const sockets = new Map();
const save = () => writeFileSync(usersFile, JSON.stringify(users, null, 2));
const hash = password => createHash('sha256').update(password).digest('hex');
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); res.end(JSON.stringify(body)); };
const publicUser = user => ({ username: user.username, balance: user.balance });
function authenticated(req) { const token = (req.headers.authorization || '').replace('Bearer ', ''); const username = sessions.get(token); return username && users[username] ? users[username] : null; }
function readBody(req) { return new Promise(resolve => { let raw = ''; req.on('data', chunk => raw += chunk); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve(null); } }); }); }
function validName(name) { return typeof name === 'string' && /^[A-Za-z0-9_]{3,20}$/.test(name); }

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (requestUrl.pathname.startsWith('/api/')) {
    const body = req.method === 'POST' ? await readBody(req) : {};
    if (requestUrl.pathname === '/api/signup' && req.method === 'POST') {
      if (!validName(body.username) || typeof body.password !== 'string' || body.password.length < 6) return json(res, 400, { error: 'Use a 3-20 character username and a password of at least 6 characters.' });
      if (users[body.username]) return json(res, 409, { error: 'Username already exists.' });
      users[body.username] = { username: body.username, password: hash(body.password), balance: 50, friends: [], incoming: [] }; save();
      return json(res, 201, { user: publicUser(users[body.username]) });
    }
    if (requestUrl.pathname === '/api/login' && req.method === 'POST') {
      const user = users[body.username];
      if (!user || user.password !== hash(body.password || '')) return json(res, 401, { error: 'Invalid username or password.' });
      const token = randomBytes(24).toString('hex'); sessions.set(token, user.username);
      return json(res, 200, { token, user: publicUser(user) });
    }
    const user = authenticated(req);
    if (!user) return json(res, 401, { error: 'Please log in again.' });
    user.friends ||= [];
    user.incoming ||= [];
    if (requestUrl.pathname === '/api/users' && req.method === 'GET') {
      return json(res, 200, { users: Object.values(users).map(publicUser) });
    }
    if (requestUrl.pathname === '/api/users/search') {
      const query = (requestUrl.searchParams.get('q') || '').toLowerCase();
      return json(res, 200, { users: Object.values(users).filter(item => item.username.toLowerCase().includes(query) && item.username !== user.username).slice(0, 20).map(publicUser) });
    }
    if (requestUrl.pathname === '/api/friends' && req.method === 'GET') return json(res, 200, { friends: user.friends, requests: user.incoming });
    if (requestUrl.pathname === '/api/friends/request' && req.method === 'POST') {
      const target = users[body.username];
      if (!target || target.username === user.username) return json(res, 404, { error: 'User not found.' });
      if (user.friends.includes(target.username) || target.incoming.includes(user.username)) return json(res, 409, { error: 'Request already sent or you are already friends.' });
      target.incoming.push(user.username); save(); return json(res, 201, { message: 'Request sent.' });
    }
    if (requestUrl.pathname === '/api/friends/respond' && req.method === 'POST') {
      const index = user.incoming.indexOf(body.username);
      if (index < 0 || !users[body.username]) return json(res, 404, { error: 'Request not found.' });
      user.incoming.splice(index, 1);
      if (body.accept) { user.friends.push(body.username); users[body.username].friends.push(user.username); }
      save(); return json(res, 200, { message: body.accept ? 'Friend added.' : 'Request declined.' });
    }
    return json(res, 404, { error: 'Not found.' });
  }
  const requested = normalize(join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]));
  if (!requested.startsWith(root)) return json(res, 403, { error: 'Forbidden' });
  const file = existsSync(requested) ? requested : join(root, 'index.html');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); res.end(readFileSync(file));
});

const wss = new WebSocketServer({ server });
wss.on('connection', (socket, req) => {
  const params = new URL(req.url, 'http://localhost').searchParams;
  const username = sessions.get(params.get('token'));
  const game = params.get('game') || 'baseplate';
  if (!username || !users[username]) return socket.close(1008, 'Login required');
  if (!sockets.has(game)) sockets.set(game, new Map());
  const room = sockets.get(game); room.set(socket, { username, state: null });
  for (const [other, info] of room) if (other !== socket && info.state) socket.send(JSON.stringify({ type: 'player_join', player: { username: info.username, ...info.state } }));
  const broadcast = message => { for (const [other] of room) if (other !== socket && other.readyState === 1) other.send(JSON.stringify(message)); };
  socket.on('message', raw => { try { const message = JSON.parse(raw); if (message.type === 'state') { room.get(socket).state = message.state; broadcast({ type: 'player_state', player: { username, ...message.state } }); } } catch {} });
  socket.on('close', () => { room.delete(socket); broadcast({ type: 'player_leave', username }); });
});

server.listen(process.env.PORT || 8080, () => console.log(`Roblex server running at http://localhost:${process.env.PORT || 8080}`));
