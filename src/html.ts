const HTML_HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>fabslap — scavenger hunt</title>
<style>
:root {
  --bg: #f6f5f2;
  --panel: #ffffff;
  --ink: #1c1b1a;
  --muted: #8a8580;
  --accent: #e2572b;
  --accent-ink: #ffffff;
  --line: #e7e3dd;
  --pending: #b8b2a8;
  --accepted: #2f8f5b;
  --refused: #c0392b;
  --radius: 14px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  background: var(--bg);
  color: var(--ink);
}
a { color: inherit; }
/* Mobile-first app chrome: a slim top strip (brand + logout) plus a fixed
   bottom tab bar for the five destinations, thumb-reachable by default.
   The desktop breakpoint below collapses both into one classic top header. */
header#topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 16px;
  padding-top: max(10px, env(safe-area-inset-top));
  background: var(--panel);
  border-bottom: 1px solid var(--line);
}
header#topbar .brand { font-weight: 800; font-size: 1.05rem; }

nav#nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  display: flex;
  background: var(--panel);
  border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
nav#nav a {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; min-height: 58px; padding: 6px 2px;
  text-decoration: none; color: var(--muted); font-size: 0.66rem; font-weight: 700;
}
nav#nav a .tab-icon { font-size: 1.3rem; line-height: 1; }
nav#nav a.active { color: var(--accent); }

@media (min-width: 720px) {
  #app-bar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; gap: 18px;
    padding: 12px 20px;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
  }
  header#topbar { display: contents; }
  header#topbar .brand { font-size: 1.15rem; order: 1; margin-right: auto; }
  #logout-btn { order: 3; }
  nav#nav {
    position: static; order: 2;
    display: flex; gap: 4px;
    background: none; border-top: none; padding-bottom: 0;
  }
  nav#nav a {
    flex: 0 0 auto; flex-direction: row; min-height: auto; gap: 6px;
    padding: 8px 12px; border-radius: 999px; font-size: 0.92rem;
  }
  nav#nav a .tab-icon { display: none; }
  nav#nav a.active, nav#nav a:hover { background: var(--bg); color: var(--ink); }
  main { padding: 24px 16px 80px; }
  .toolbar select { width: auto; }
  .modal { align-items: center; padding: 16px; }
  .modal-content { border-radius: var(--radius); max-width: 420px; padding: 22px; }
  #toast { bottom: 20px; }
}
button, .btn {
  font: inherit; cursor: pointer; border: none; border-radius: 10px;
  padding: 9px 16px; background: var(--accent); color: var(--accent-ink); font-weight: 700;
}
button.secondary { background: var(--bg); color: var(--ink); border: 1px solid var(--line); }
button:disabled { opacity: 0.55; cursor: default; }
input, textarea, select {
  font: inherit; padding: 9px 11px; border-radius: 10px; border: 1px solid var(--line);
  background: #fff; width: 100%;
}
main { max-width: 760px; margin: 0 auto; padding: 20px 16px calc(84px + env(safe-area-inset-bottom)); }
section[hidden] { display: none !important; }
.hidden { display: none !important; }

#view-auth { max-width: 380px; margin: 60px auto; }
#view-auth h1 { text-align: center; font-size: 1.8rem; margin-bottom: 4px; }
#view-auth p.tag { text-align: center; color: var(--muted); margin-top: 0; margin-bottom: 24px; }
.auth-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.auth-tabs button { flex: 1; background: var(--panel); color: var(--muted); border: 1px solid var(--line); }
.auth-tabs button.active { background: var(--ink); color: #fff; border-color: var(--ink); }
.field { margin-bottom: 12px; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 5px; }
.error-text { color: var(--refused); font-size: 0.88rem; margin: 6px 0 0; min-height: 1.1em; }
form.auth-form button[type=submit] { width: 100%; margin-top: 6px; }

.toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.toolbar select { width: 100%; }
.card {
  background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius);
  margin-bottom: 14px; overflow: hidden;
}
.card img.challenge-img { width: 100%; max-height: 240px; object-fit: cover; display: block; }
.card-body { padding: 16px; }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.card-top h3 { margin: 0; font-size: 1.05rem; }
.points-badge {
  background: var(--ink); color: #fff; border-radius: 999px; padding: 4px 11px;
  font-size: 0.8rem; font-weight: 800; white-space: nowrap;
}
.card p.desc { color: #444; font-size: 0.92rem; margin: 8px 0 14px; }
.card-actions { display: flex; justify-content: flex-end; }
.badge { padding: 6px 13px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; }
.badge.pending { background: #f1efe9; color: var(--muted); }
.badge.accepted { background: #e5f4ea; color: var(--accepted); }
.badge.refused { background: #fbe9e7; color: var(--refused); }
#load-sentinel, #submissions-sentinel { height: 1px; }
.empty-note { color: var(--muted); text-align: center; padding: 40px 0; }

.modal { position: fixed; inset: 0; background: rgba(20,18,16,0.5); display: flex; align-items: flex-end; justify-content: center; padding: 0; z-index: 50; }
.modal-content {
  background: #fff; border-radius: var(--radius) var(--radius) 0 0;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
}
.modal-content h3 { margin-top: 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }

.lb-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 8px;
}
.lb-rank { width: 22px; text-align: center; font-weight: 800; color: var(--muted); flex-shrink: 0; }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; background: var(--bg); border: 1px solid var(--line); flex-shrink: 0; }
.lb-name { flex: 1; min-width: 0; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lb-points { text-align: right; flex-shrink: 0; }
.lb-points .verified { font-weight: 800; }
.lb-points .pending { color: var(--pending); font-size: 0.82rem; display: block; }

.sub-row { display: flex; gap: 12px; padding: 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 10px; }
.sub-row img.sub-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.sub-main { flex: 1; min-width: 0; }
.sub-main .who { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub-main .what { color: #444; font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub-meta { display: flex; gap: 8px; align-items: center; margin-top: 6px; flex-wrap: wrap; }
.sub-meta time { color: var(--muted); font-size: 0.8rem; }
button.delete { background: var(--refused); }
button.small { padding: 5px 10px; font-size: 0.78rem; border-radius: 8px; }

#view-profile .profile-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; text-align: center; }
#view-profile .avatar-big { width: 110px; height: 110px; border-radius: 50%; object-fit: cover; background: var(--bg); border: 1px solid var(--line); margin-bottom: 14px; }
#view-profile h2 { margin: 0 0 18px; }
.section-heading { font-size: 1rem; margin: 28px 0 12px; }

.admin-tabs { display: flex; gap: 8px; margin-bottom: 18px; }
.admin-tabs button { background: var(--panel); color: var(--muted); border: 1px solid var(--line); }
.admin-tabs button.active { background: var(--ink); color: #fff; border-color: var(--ink); }
.review-item { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
.review-item .review-top { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.review-item img.review-img { max-width: 100%; border-radius: 8px; margin: 10px 0; display: block; }
.review-actions { display: flex; gap: 8px; margin-top: 10px; }
.review-actions button.accept { background: var(--accepted); }
.review-actions button.refuse { background: var(--refused); }

.manage-item { display: flex; gap: 12px; align-items: center; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.manage-item img.manage-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: var(--bg); }
.manage-info { flex: 1; min-width: 0; }
.manage-info .title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.manage-info .points { color: var(--muted); font-size: 0.85rem; }
.manage-info .meta-row { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.manage-actions { display: flex; gap: 8px; flex-shrink: 0; }
.manage-actions button.delete { background: var(--refused); }
.field.checkbox-field label { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 500; }
.field.checkbox-field input[type=checkbox] { width: auto; }

#toast {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(72px + env(safe-area-inset-bottom));
  background: var(--ink); color: #fff; padding: 11px 18px; border-radius: 10px;
  font-size: 0.9rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 100;
  max-width: calc(100vw - 32px); text-align: center;
}
#toast.show { opacity: 1; }
</style>
</head>
<body>

<div id="app-bar" class="hidden">
  <header id="topbar">
    <div class="brand">🏆 fabslap</div>
    <button class="secondary" id="logout-btn">Log out</button>
  </header>
  <nav id="nav">
    <a href="/challenges" data-link data-path="/challenges"><span class="tab-icon" aria-hidden="true">🎯</span><span class="tab-label">Challenges</span></a>
    <a href="/leaderboard" data-link data-path="/leaderboard"><span class="tab-icon" aria-hidden="true">🏆</span><span class="tab-label">Leaderboard</span></a>
    <a href="/submissions" data-link data-path="/submissions"><span class="tab-icon" aria-hidden="true">🕒</span><span class="tab-label">Recent</span></a>
    <a href="/profile" data-link data-path="/profile"><span class="tab-icon" aria-hidden="true">👤</span><span class="tab-label">Profile</span></a>
    <a href="/admin" data-link data-path="/admin"><span class="tab-icon" aria-hidden="true">🛠️</span><span class="tab-label">Admin</span></a>
  </nav>
</div>

<main id="views">

  <section id="view-auth">
    <h1>🏆 fabslap</h1>
    <p class="tag">the scavenger hunt</p>
    <div class="auth-tabs">
      <button id="tab-login" class="active" type="button">Log in</button>
      <button id="tab-signup" type="button">Sign up</button>
    </div>
    <form class="auth-form" id="auth-form">
      <div class="field"><label>Username</label><input type="text" id="auth-username" autocomplete="username" required></div>
      <div class="field"><label>Password</label><input type="password" id="auth-password" autocomplete="current-password" required></div>
      <p class="error-text" id="auth-error"></p>
      <button type="submit" id="auth-submit">Log in</button>
    </form>
  </section>

  <section id="view-challenges" hidden>
    <div class="toolbar">
      <select id="challenge-sort">
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
        <option value="points-desc">Most points</option>
        <option value="points-asc">Fewest points</option>
      </select>
    </div>
    <div id="challenge-list"></div>
    <div id="load-sentinel"></div>
  </section>

  <section id="view-leaderboard" hidden>
    <div id="leaderboard-list"></div>
  </section>

  <section id="view-submissions" hidden>
    <div id="submissions-list"></div>
    <div id="submissions-sentinel"></div>
  </section>

  <section id="view-profile" hidden>
    <div class="profile-card">
      <img id="profile-avatar" class="avatar-big" src="" alt="">
      <h2 id="profile-username"></h2>
      <input type="file" id="profile-file" accept="image/*" class="hidden">
      <button type="button" id="profile-change-btn">Change photo</button>
    </div>

    <h3 class="section-heading">My submissions</h3>
    <div id="my-submissions-list"></div>
  </section>

  <section id="view-admin" hidden>
    <div id="admin-login-box">
      <div class="field"><label>Admin password</label><input type="password" id="admin-password"></div>
      <p class="error-text" id="admin-error"></p>
      <button type="button" id="admin-login-btn">Enter admin</button>
    </div>
    <div id="admin-panel" class="hidden">
      <div class="admin-tabs">
        <button id="admin-tab-review" class="active" type="button">Review queue</button>
        <button id="admin-tab-manage" type="button">Manage challenges</button>
        <button id="admin-tab-create" type="button">Create challenge</button>
      </div>
      <div id="admin-review"></div>
      <div id="admin-manage" class="hidden"></div>
      <div id="admin-create" class="hidden">
        <form id="create-challenge-form">
          <div class="field"><label>Title</label><input type="text" id="cc-title" required></div>
          <div class="field"><label>Description</label><textarea id="cc-description" rows="3"></textarea></div>
          <div class="field"><label>Points</label><input type="number" id="cc-points" min="0" required></div>
          <div class="field"><label>Image (optional)</label><input type="file" id="cc-image" accept="image/*"></div>
          <button type="submit">Create challenge</button>
        </form>
      </div>
    </div>
  </section>

</main>

<div class="modal hidden" id="submit-modal">
  <div class="modal-content">
    <h3 id="submit-modal-title"></h3>
    <form id="submit-form">
      <div class="field"><label>Photo / proof (optional)</label><input type="file" id="submit-image" accept="image/*"></div>
      <div class="field"><label>Note (optional)</label><textarea id="submit-note" rows="3"></textarea></div>
      <p class="error-text" id="submit-error"></p>
      <div class="modal-actions">
        <button type="button" class="secondary" id="submit-cancel">Cancel</button>
        <button type="submit" id="submit-confirm">Submit</button>
      </div>
    </form>
  </div>
</div>

<div class="modal hidden" id="edit-challenge-modal">
  <div class="modal-content">
    <h3>Edit challenge</h3>
    <form id="edit-challenge-form">
      <div class="field"><label>Title</label><input type="text" id="ec-title" required></div>
      <div class="field"><label>Description</label><textarea id="ec-description" rows="3"></textarea></div>
      <div class="field"><label>Points</label><input type="number" id="ec-points" min="0" required></div>
      <div class="field"><label>Replace image (optional)</label><input type="file" id="ec-image" accept="image/*"></div>
      <div class="field checkbox-field hidden" id="ec-remove-image-field">
        <label><input type="checkbox" id="ec-remove-image"> Remove current image</label>
      </div>
      <p class="error-text" id="edit-challenge-error"></p>
      <div class="modal-actions">
        <button type="button" class="secondary" id="edit-challenge-cancel">Cancel</button>
        <button type="submit" id="edit-challenge-confirm">Save changes</button>
      </div>
    </form>
  </div>
</div>

<div class="modal hidden" id="edit-submission-modal">
  <div class="modal-content">
    <h3 id="edit-submission-title"></h3>
    <form id="edit-submission-form">
      <div class="field"><label>Replace photo / proof (optional)</label><input type="file" id="es-image" accept="image/*"></div>
      <div class="field checkbox-field hidden" id="es-remove-image-field">
        <label><input type="checkbox" id="es-remove-image"> Remove current photo</label>
      </div>
      <div class="field"><label>Note (optional)</label><textarea id="es-note" rows="3"></textarea></div>
      <p class="error-text" id="edit-submission-error"></p>
      <div class="modal-actions">
        <button type="button" class="secondary" id="edit-submission-cancel">Cancel</button>
        <button type="submit" id="edit-submission-confirm">Save changes</button>
      </div>
    </form>
  </div>
</div>

<div id="toast"></div>

<script>
`;

const HTML_TAIL = `
</script>
</body>
</html>`;

// No backticks or template-literal syntax appear anywhere below: it is
// wrapped in one, and DOM nodes are built with the h() helper (never
// innerHTML on user-supplied text) to avoid XSS from usernames/notes.
const CLIENT_JS = `
var state = { me: null, isAdmin: false };

function h(tag, attrs, children) {
  var el = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (k === 'class') el.className = v;
    else if (k.slice(0, 2) === 'on') el[k] = v;
    else el.setAttribute(k, v);
  });
  (children || []).forEach(function (c) {
    if (c === null || c === undefined) return;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  });
  return el;
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
}

function avatarPlaceholder(name) {
  var letter = (name || '?').charAt(0).toUpperCase();
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
    '<rect width="64" height="64" rx="32" fill="#e2572b"/>' +
    '<text x="32" y="41" font-size="28" text-anchor="middle" fill="#fff" font-family="sans-serif">' + letter + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function formatDate(iso) {
  try {
    var d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
}

function compressImage(file) {
  return new Promise(function (resolve, reject) {
    if (!file) { resolve(null); return; }
    var maxDim = 1280, targetBytes = 500000;
    createImageBitmap(file).then(function (bitmap) {
      var scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      var w = Math.max(1, Math.round(bitmap.width * scale));
      var hgt = Math.max(1, Math.round(bitmap.height * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = hgt;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, w, hgt);
      function attempt(quality) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Could not process image')); return; }
          if (blob.size > targetBytes && quality > 0.35) attempt(quality - 0.15);
          else resolve(blob);
        }, 'image/jpeg', quality);
      }
      attempt(0.85);
    }).catch(function (err) { reject(err); });
  });
}

/* ---------- routing ---------- */

var ROUTES = ['/challenges', '/leaderboard', '/submissions', '/profile', '/admin'];
var SECTION_BY_PATH = {
  '/challenges': 'view-challenges',
  '/leaderboard': 'view-leaderboard',
  '/submissions': 'view-submissions',
  '/profile': 'view-profile',
  '/admin': 'view-admin'
};

function currentPath() {
  var p = location.pathname;
  return ROUTES.indexOf(p) === -1 ? '/challenges' : p;
}

function navigate(path) {
  history.pushState(null, '', path);
  render();
}

function render() {
  var appBar = document.getElementById('app-bar');
  if (!state.me) {
    appBar.classList.add('hidden');
    Object.keys(SECTION_BY_PATH).forEach(function (p) { document.getElementById(SECTION_BY_PATH[p]).hidden = true; });
    document.getElementById('view-auth').hidden = false;
    return;
  }
  document.getElementById('view-auth').hidden = true;
  appBar.classList.remove('hidden');
  var path = currentPath();
  Object.keys(SECTION_BY_PATH).forEach(function (p) {
    document.getElementById(SECTION_BY_PATH[p]).hidden = p !== path;
  });
  document.querySelectorAll('#nav a[data-link]').forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('data-path') === path);
  });
  if (path === '/challenges') loadChallenges(true);
  if (path === '/leaderboard') loadLeaderboard();
  if (path === '/submissions') loadSubmissions(true);
  if (path === '/profile') renderProfile();
  if (path === '/admin') initAdmin();
}

window.addEventListener('popstate', render);

document.querySelectorAll('#nav a[data-link]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    e.preventDefault();
    navigate(a.getAttribute('data-path'));
  });
});

document.getElementById('logout-btn').addEventListener('click', async function () {
  await fetch('/api/logout', { method: 'POST' });
  state.me = null;
  history.replaceState(null, '', '/');
  render();
});

/* ---------- auth ---------- */

var authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('auth-submit').textContent = mode === 'login' ? 'Log in' : 'Sign up';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
}

document.getElementById('tab-login').addEventListener('click', function () { setAuthMode('login'); });
document.getElementById('tab-signup').addEventListener('click', function () { setAuthMode('signup'); });

document.getElementById('auth-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var username = document.getElementById('auth-username').value.trim();
  var password = document.getElementById('auth-password').value;
  var errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';
  var btn = document.getElementById('auth-submit');
  btn.disabled = true;
  try {
    var res = await fetch(authMode === 'login' ? '/api/login' : '/api/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    state.me = data;
    history.replaceState(null, '', '/challenges');
    render();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

/* ---------- challenges ---------- */

state.challengeSort = 'date';
state.challengeDir = 'desc';
state.challengeCursor = null;
state.challengeLoading = false;
state.challengeDone = false;

function renderChallengeCard(c) {
  var children = [];
  if (c.has_image) children.push(h('img', { class: 'challenge-img', src: '/images/challenges/' + c.id, alt: c.title }));
  var top = h('div', { class: 'card-top' }, [h('h3', {}, [c.title]), h('span', { class: 'points-badge' }, [c.points + ' pts'])]);
  var body = [top];
  if (c.description) body.push(h('p', { class: 'desc' }, [c.description]));
  var actionEl;
  if (c.my_status === 'pending') actionEl = h('span', { class: 'badge pending' }, ['Waiting for review']);
  else if (c.my_status === 'accepted') actionEl = h('span', { class: 'badge accepted' }, ['Completed']);
  else {
    var label = c.my_status === 'refused' ? 'Retry' : 'Submit';
    actionEl = h('button', { type: 'button', onclick: function () { openSubmitModal(c); } }, [label]);
  }
  body.push(h('div', { class: 'card-actions' }, [actionEl]));
  children.push(h('div', { class: 'card-body' }, body));
  return h('div', { class: 'card' }, children);
}

async function loadChallenges(reset) {
  if (reset) {
    state.challengeCursor = null;
    state.challengeDone = false;
    document.getElementById('challenge-list').innerHTML = '';
  }
  if (state.challengeLoading || state.challengeDone) return;
  state.challengeLoading = true;
  var params = new URLSearchParams();
  params.set('sort', state.challengeSort);
  params.set('dir', state.challengeDir);
  if (state.challengeCursor) params.set('cursor', state.challengeCursor);
  try {
    var res = await fetch('/api/challenges?' + params.toString());
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load challenges');
    var list = document.getElementById('challenge-list');
    if (reset && data.challenges.length === 0) list.appendChild(h('p', { class: 'empty-note' }, ['No challenges yet, check back soon!']));
    data.challenges.forEach(function (c) { list.appendChild(renderChallengeCard(c)); });
    state.challengeCursor = data.nextCursor;
    state.challengeDone = !data.nextCursor;
  } catch (err) {
    toast(err.message);
  } finally {
    state.challengeLoading = false;
  }
}

document.getElementById('challenge-sort').addEventListener('change', function (e) {
  var parts = e.target.value.split('-');
  state.challengeSort = parts[0];
  state.challengeDir = parts[1];
  loadChallenges(true);
});

new IntersectionObserver(function (entries) {
  if (entries[0].isIntersecting) loadChallenges(false);
}, { rootMargin: '250px' }).observe(document.getElementById('load-sentinel'));

/* ---------- submit modal ---------- */

var activeChallenge = null;

function openSubmitModal(c) {
  activeChallenge = c;
  document.getElementById('submit-modal-title').textContent = 'Submit: ' + c.title;
  document.getElementById('submit-image').value = '';
  document.getElementById('submit-note').value = '';
  document.getElementById('submit-error').textContent = '';
  document.getElementById('submit-modal').classList.remove('hidden');
}

function closeSubmitModal() {
  document.getElementById('submit-modal').classList.add('hidden');
  activeChallenge = null;
}

document.getElementById('submit-cancel').addEventListener('click', closeSubmitModal);

document.getElementById('submit-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!activeChallenge) return;
  var btn = document.getElementById('submit-confirm');
  btn.disabled = true;
  try {
    var file = document.getElementById('submit-image').files[0] || null;
    var blob = file ? await compressImage(file) : null;
    var form = new FormData();
    if (blob) form.append('image', blob, 'submission.jpg');
    var note = document.getElementById('submit-note').value.trim();
    if (note) form.append('note', note);
    var res = await fetch('/api/challenges/' + activeChallenge.id + '/submissions', { method: 'POST', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not submit');
    closeSubmitModal();
    toast('Submitted! Waiting for review.');
    loadChallenges(true);
  } catch (err) {
    document.getElementById('submit-error').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

/* ---------- leaderboard ---------- */

async function loadLeaderboard() {
  var list = document.getElementById('leaderboard-list');
  list.innerHTML = '';
  try {
    var res = await fetch('/api/leaderboard');
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
    if (data.leaderboard.length === 0) { list.appendChild(h('p', { class: 'empty-note' }, ['No players yet.'])); return; }
    data.leaderboard.forEach(function (u, i) {
      var avatar = h('img', { class: 'avatar', src: u.has_avatar ? '/images/users/' + u.id : avatarPlaceholder(u.username), alt: '' });
      var pointsChildren = [h('span', { class: 'verified' }, [u.verified_points + ' pts'])];
      if (u.pending_points > 0) pointsChildren.push(h('span', { class: 'pending' }, ['+' + u.pending_points + ' pending']));
      list.appendChild(h('div', { class: 'lb-row' }, [
        h('div', { class: 'lb-rank' }, [String(i + 1)]),
        avatar,
        h('div', { class: 'lb-name' }, [u.username]),
        h('div', { class: 'lb-points' }, pointsChildren)
      ]));
    });
  } catch (err) {
    toast(err.message);
  }
}

/* ---------- recent submissions ---------- */

state.submissionsCursor = null;
state.submissionsLoading = false;
state.submissionsDone = false;

function statusBadge(status) {
  var label = status === 'pending' ? 'Waiting' : status === 'accepted' ? 'Accepted' : 'Refused';
  return h('span', { class: 'badge ' + status }, [label]);
}

function renderSubmissionRow(s) {
  var children = [];
  if (s.has_image) children.push(h('img', { class: 'sub-thumb', src: '/images/submissions/' + s.id, alt: '' }));
  var metaChildren = [statusBadge(s.status), h('time', {}, [formatDate(s.submitted_at)])];
  if (state.isAdmin) {
    metaChildren.push(h('button', { type: 'button', class: 'delete small', onclick: function () { adminDeleteSubmission(s); } }, ['Delete']));
  }
  children.push(h('div', { class: 'sub-main' }, [
    h('div', { class: 'who' }, [s.username]),
    h('div', { class: 'what' }, [s.challenge_title + ' \\u2022 ' + s.points + ' pts']),
    h('div', { class: 'sub-meta' }, metaChildren)
  ]));
  return h('div', { class: 'sub-row' }, children);
}

async function refreshAdminStatus() {
  try {
    var res = await fetch('/admin/api/me');
    var data = await res.json();
    state.isAdmin = !!data.isAdmin;
  } catch (err) {
    state.isAdmin = false;
  }
}

async function loadSubmissions(reset) {
  if (reset) {
    state.submissionsCursor = null;
    state.submissionsDone = false;
    document.getElementById('submissions-list').innerHTML = '';
    await refreshAdminStatus();
  }
  if (state.submissionsLoading || state.submissionsDone) return;
  state.submissionsLoading = true;
  var params = new URLSearchParams();
  if (state.submissionsCursor) params.set('cursor', state.submissionsCursor);
  try {
    var res = await fetch('/api/submissions/recent?' + params.toString());
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    var list = document.getElementById('submissions-list');
    if (reset && data.submissions.length === 0) list.appendChild(h('p', { class: 'empty-note' }, ['No submissions yet.']));
    data.submissions.forEach(function (s) { list.appendChild(renderSubmissionRow(s)); });
    state.submissionsCursor = data.nextCursor;
    state.submissionsDone = !data.nextCursor;
  } catch (err) {
    toast(err.message);
  } finally {
    state.submissionsLoading = false;
  }
}

async function adminDeleteSubmission(s) {
  if (!confirm('Delete this submission by ' + s.username + ' for "' + s.challenge_title + '"? This cannot be undone.')) return;
  try {
    var res = await fetch('/admin/api/submissions/' + s.id, { method: 'DELETE' });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not delete submission');
    toast('Submission deleted');
    loadSubmissions(true);
  } catch (err) {
    toast(err.message);
  }
}

new IntersectionObserver(function (entries) {
  if (entries[0].isIntersecting) loadSubmissions(false);
}, { rootMargin: '250px' }).observe(document.getElementById('submissions-sentinel'));

/* ---------- profile ---------- */

function renderProfile() {
  document.getElementById('profile-username').textContent = state.me.username;
  document.getElementById('profile-avatar').src = state.me.has_avatar
    ? '/images/users/' + state.me.id + '?t=' + Date.now()
    : avatarPlaceholder(state.me.username);
  loadMySubmissions();
}

document.getElementById('profile-change-btn').addEventListener('click', function () {
  document.getElementById('profile-file').click();
});

document.getElementById('profile-file').addEventListener('change', async function (e) {
  var file = e.target.files[0];
  if (!file) return;
  try {
    var blob = await compressImage(file);
    var form = new FormData();
    form.append('picture', blob, 'avatar.jpg');
    var res = await fetch('/api/profile', { method: 'PATCH', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not update photo');
    state.me.has_avatar = true;
    document.getElementById('profile-avatar').src = '/images/users/' + state.me.id + '?t=' + Date.now();
    toast('Profile photo updated');
  } catch (err) {
    toast(err.message);
  }
});

/* ---------- my submissions ---------- */

function renderMySubmissionItem(s) {
  var children = [];
  if (s.has_image) children.push(h('img', { class: 'manage-thumb', src: '/images/submissions/' + s.id, alt: '' }));
  children.push(h('div', { class: 'manage-info' }, [
    h('div', { class: 'title' }, [s.challenge_title]),
    h('div', { class: 'meta-row' }, [h('span', { class: 'points' }, [s.points + ' pts']), statusBadge(s.status)])
  ]));
  children.push(h('div', { class: 'manage-actions' }, [
    h('button', { type: 'button', class: 'secondary small', onclick: function () { openEditSubmissionModal(s); } }, ['Edit']),
    h('button', { type: 'button', class: 'delete small', onclick: function () { deleteMySubmission(s); } }, ['Delete'])
  ]));
  return h('div', { class: 'manage-item' }, children);
}

async function loadMySubmissions() {
  var container = document.getElementById('my-submissions-list');
  container.innerHTML = '';
  try {
    var res = await fetch('/api/submissions/mine');
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load your submissions');
    var submissions = data.submissions;
    if (submissions.length === 0) { container.appendChild(h('p', { class: 'empty-note' }, ["You haven't submitted anything yet."])); return; }
    submissions.forEach(function (s) { container.appendChild(renderMySubmissionItem(s)); });
  } catch (err) {
    toast(err.message);
  }
}

async function deleteMySubmission(s) {
  var warning = s.status === 'accepted'
    ? 'Delete your submission for "' + s.challenge_title + '"? You will lose the ' + s.points + ' points it earned. This cannot be undone.'
    : 'Delete your submission for "' + s.challenge_title + '"? This cannot be undone.';
  if (!confirm(warning)) return;
  try {
    var res = await fetch('/api/submissions/' + s.id, { method: 'DELETE' });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not delete submission');
    toast('Submission deleted');
    loadMySubmissions();
  } catch (err) {
    toast(err.message);
  }
}

/* ---------- edit submission modal ---------- */

var editingSubmission = null;

function openEditSubmissionModal(s) {
  editingSubmission = s;
  document.getElementById('edit-submission-title').textContent = 'Edit submission: ' + s.challenge_title;
  document.getElementById('es-image').value = '';
  document.getElementById('es-remove-image').checked = false;
  document.getElementById('es-remove-image-field').classList.toggle('hidden', !s.has_image);
  document.getElementById('es-note').value = s.note || '';
  document.getElementById('edit-submission-error').textContent = '';
  document.getElementById('edit-submission-modal').classList.remove('hidden');
}

function closeEditSubmissionModal() {
  document.getElementById('edit-submission-modal').classList.add('hidden');
  editingSubmission = null;
}

document.getElementById('edit-submission-cancel').addEventListener('click', closeEditSubmissionModal);

document.getElementById('edit-submission-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!editingSubmission) return;
  var btn = document.getElementById('edit-submission-confirm');
  btn.disabled = true;
  try {
    var file = document.getElementById('es-image').files[0];
    var removeImage = document.getElementById('es-remove-image').checked;
    var note = document.getElementById('es-note').value.trim();
    var form = new FormData();
    if (note) form.append('note', note);
    if (file) {
      var blob = await compressImage(file);
      form.append('image', blob, 'submission.jpg');
    } else if (removeImage) {
      form.append('removeImage', 'true');
    }
    var res = await fetch('/api/submissions/' + editingSubmission.id, { method: 'PATCH', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save changes');
    closeEditSubmissionModal();
    toast('Submission updated');
    loadMySubmissions();
  } catch (err) {
    document.getElementById('edit-submission-error').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

/* ---------- admin ---------- */

async function initAdmin() {
  await refreshAdminStatus();
  document.getElementById('admin-login-box').classList.toggle('hidden', state.isAdmin);
  document.getElementById('admin-panel').classList.toggle('hidden', !state.isAdmin);
  if (state.isAdmin) loadAdminReview();
}

var adminChallenges = [];

document.getElementById('admin-login-btn').addEventListener('click', async function () {
  var password = document.getElementById('admin-password').value;
  var errorEl = document.getElementById('admin-error');
  errorEl.textContent = '';
  try {
    var res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Wrong password');
    state.isAdmin = true;
    document.getElementById('admin-login-box').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminReview();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('admin-tab-review').addEventListener('click', function () { setAdminTab('review'); });
document.getElementById('admin-tab-manage').addEventListener('click', function () { setAdminTab('manage'); });
document.getElementById('admin-tab-create').addEventListener('click', function () { setAdminTab('create'); });

function setAdminTab(tab) {
  document.getElementById('admin-tab-review').classList.toggle('active', tab === 'review');
  document.getElementById('admin-tab-manage').classList.toggle('active', tab === 'manage');
  document.getElementById('admin-tab-create').classList.toggle('active', tab === 'create');
  document.getElementById('admin-review').classList.toggle('hidden', tab !== 'review');
  document.getElementById('admin-manage').classList.toggle('hidden', tab !== 'manage');
  document.getElementById('admin-create').classList.toggle('hidden', tab !== 'create');
  if (tab === 'review') loadAdminReview();
  if (tab === 'manage') loadAdminManage();
}

function renderReviewItem(s) {
  var children = [];
  children.push(h('div', { class: 'review-top' }, [
    h('div', {}, [h('strong', {}, [s.username]), ' \\u2014 ' + s.challenge_title + ' (' + s.points + ' pts)']),
    h('time', {}, [formatDate(s.submitted_at)])
  ]));
  if (s.has_image) children.push(h('img', { class: 'review-img', src: '/images/submissions/' + s.id, alt: '' }));
  if (s.note) children.push(h('p', {}, [s.note]));
  children.push(h('div', { class: 'review-actions' }, [
    h('button', { type: 'button', class: 'accept', onclick: function () { reviewSubmission(s.id, 'accept'); } }, ['Accept']),
    h('button', { type: 'button', class: 'refuse', onclick: function () { reviewSubmission(s.id, 'refuse'); } }, ['Refuse'])
  ]));
  return h('div', { class: 'review-item' }, children);
}

async function loadAdminReview() {
  var container = document.getElementById('admin-review');
  container.innerHTML = '';
  try {
    var res = await fetch('/admin/api/submissions');
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load queue');
    if (data.submissions.length === 0) { container.appendChild(h('p', { class: 'empty-note' }, ['Nothing waiting for review.'])); return; }
    data.submissions.forEach(function (s) { container.appendChild(renderReviewItem(s)); });
  } catch (err) {
    toast(err.message);
  }
}

async function reviewSubmission(id, action) {
  try {
    var res = await fetch('/admin/api/submissions/' + id + '/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: action })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not review');
    toast(action === 'accept' ? 'Accepted' : 'Refused');
    loadAdminReview();
  } catch (err) {
    toast(err.message);
  }
}

function renderManageItem(c) {
  var children = [];
  if (c.has_image) children.push(h('img', { class: 'manage-thumb', src: '/images/challenges/' + c.id, alt: '' }));
  children.push(h('div', { class: 'manage-info' }, [
    h('div', { class: 'title' }, [c.title]),
    h('div', { class: 'points' }, [c.points + ' pts'])
  ]));
  children.push(h('div', { class: 'manage-actions' }, [
    h('button', { type: 'button', class: 'secondary', onclick: function () { openEditChallengeModal(c); } }, ['Edit']),
    h('button', { type: 'button', class: 'delete', onclick: function () { deleteChallenge(c); } }, ['Delete'])
  ]));
  return h('div', { class: 'manage-item' }, children);
}

async function loadAdminManage() {
  var container = document.getElementById('admin-manage');
  container.innerHTML = '';
  try {
    var res = await fetch('/admin/api/challenges');
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load challenges');
    adminChallenges = data.challenges;
    if (adminChallenges.length === 0) { container.appendChild(h('p', { class: 'empty-note' }, ['No challenges yet.'])); return; }
    adminChallenges.forEach(function (c) { container.appendChild(renderManageItem(c)); });
  } catch (err) {
    toast(err.message);
  }
}

async function deleteChallenge(c) {
  if (!confirm('Delete "' + c.title + '"? This also removes its submissions. This cannot be undone.')) return;
  try {
    var res = await fetch('/admin/api/challenges/' + c.id, { method: 'DELETE' });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not delete challenge');
    toast('Challenge deleted');
    loadAdminManage();
  } catch (err) {
    toast(err.message);
  }
}

/* ---------- edit challenge modal ---------- */

var editingChallenge = null;

function openEditChallengeModal(c) {
  editingChallenge = c;
  document.getElementById('ec-title').value = c.title;
  document.getElementById('ec-description').value = c.description || '';
  document.getElementById('ec-points').value = c.points;
  document.getElementById('ec-image').value = '';
  document.getElementById('ec-remove-image').checked = false;
  document.getElementById('ec-remove-image-field').classList.toggle('hidden', !c.has_image);
  document.getElementById('edit-challenge-error').textContent = '';
  document.getElementById('edit-challenge-modal').classList.remove('hidden');
}

function closeEditChallengeModal() {
  document.getElementById('edit-challenge-modal').classList.add('hidden');
  editingChallenge = null;
}

document.getElementById('edit-challenge-cancel').addEventListener('click', closeEditChallengeModal);

document.getElementById('edit-challenge-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!editingChallenge) return;
  var btn = document.getElementById('edit-challenge-confirm');
  btn.disabled = true;
  try {
    var title = document.getElementById('ec-title').value.trim();
    var description = document.getElementById('ec-description').value.trim();
    var points = document.getElementById('ec-points').value;
    var file = document.getElementById('ec-image').files[0];
    var removeImage = document.getElementById('ec-remove-image').checked;
    var form = new FormData();
    form.append('title', title);
    if (description) form.append('description', description);
    form.append('points', points);
    if (file) {
      var blob = await compressImage(file);
      form.append('image', blob, 'challenge.jpg');
    } else if (removeImage) {
      form.append('removeImage', 'true');
    }
    var res = await fetch('/admin/api/challenges/' + editingChallenge.id, { method: 'PATCH', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not save changes');
    closeEditChallengeModal();
    toast('Challenge updated');
    loadAdminManage();
  } catch (err) {
    document.getElementById('edit-challenge-error').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('create-challenge-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  var title = document.getElementById('cc-title').value.trim();
  var description = document.getElementById('cc-description').value.trim();
  var points = document.getElementById('cc-points').value;
  var fileInput = document.getElementById('cc-image');
  try {
    var form = new FormData();
    form.append('title', title);
    if (description) form.append('description', description);
    form.append('points', points);
    var file = fileInput.files[0];
    if (file) {
      var blob = await compressImage(file);
      form.append('image', blob, 'challenge.jpg');
    }
    var res = await fetch('/admin/api/challenges', { method: 'POST', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not create challenge');
    toast('Challenge created');
    e.target.reset();
  } catch (err) {
    toast(err.message);
  }
});

/* ---------- boot ---------- */

async function init() {
  try {
    var res = await fetch('/api/me');
    if (res.ok) state.me = await res.json();
  } catch (err) {
    // not logged in
  }
  render();
}

init();
`;

export const SHELL_HTML = HTML_HEAD + CLIENT_JS + HTML_TAIL;
