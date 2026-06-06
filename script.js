const STORAGE_KEY = 'safeplace-books-db-v1';
const SESSION_KEY = 'safeplace-books-session-v1';
const DEFAULT_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1200'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%238b5cf6'/%3E%3Cstop offset='1' stop-color='%2322d3ee'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='1200' fill='url(%23g)'/%3E%3Ccircle cx='720' cy='160' r='180' fill='rgba(255,255,255,.18)'/%3E%3Cpath d='M190 320c130-70 230-60 310 30 80-90 180-100 310-30v570c-130-60-230-50-310 40-80-90-180-100-310-40V320z' fill='rgba(255,255,255,.88)'/%3E%3Cpath d='M500 350v580' stroke='%238b5cf6' stroke-width='26'/%3E%3Ctext x='450' y='1030' text-anchor='middle' font-size='64' fill='white' font-family='Arial' font-weight='700'%3ESafePlace%3C/text%3E%3C/svg%3E";

let db = loadDb();
let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
let view = { name: 'home', roleChoice: 'user', bookId: null, chapterIndex: 0, pageIndex: 0, editingBookId: null };
let draftBook = null;

const app = document.querySelector('#app');
const roleBadge = document.querySelector('#roleBadge');
const sideMenu = document.querySelector('#sideMenu');
const menuOverlay = document.querySelector('#menuOverlay');
const nav = document.querySelector('#mainNav');
const toast = document.querySelector('#toast');

function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char])); }
function saveDb(message = 'Gespeichert') { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); showToast(message); }
function loadDb() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return JSON.parse(existing);
  const fresh = { setupDone: false, users: [], books: [sampleBook()], answers: {}, progress: {}, favorites: {}, theme: 'dark' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}
function setSession(user) { session = user ? { id: user.id, username: user.username, role: user.role } : null; localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function currentUser() { return session ? db.users.find(user => user.id === session.id) : null; }
function canWrite() { return session && ['admin', 'main'].includes(session.role); }
function isMain() { return session?.role === 'main'; }
function roleName(role) { return ({ user: 'User / Leser', admin: 'Admin / Autor', main: 'Main Admin' })[role] || role; }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2100); }

function sampleBook() {
  return {
    id: 'sample-book',
    title: 'Das Haus zwischen den Seiten',
    authorId: 'system',
    description: 'Ein interaktives Beispielbuch mit Kapiteln, Seiten und Fragen direkt im Lesetext.',
    cover: DEFAULT_COVER,
    fontFamily: 'Georgia, serif',
    fontSize: 19,
    updatedAt: new Date().toISOString(),
    chapters: [
      {
        title: 'Kapitel 1: Die Tür aus Licht',
        pages: [
          { title: 'Seite 1', blocks: [
            { type: 'paragraph', text: 'Mira fand die Tür dort, wo gestern noch eine leere Wand gewesen war. Sie leuchtete nicht hell, sondern warm — wie eine Erinnerung, die jemanden nach Hause ruft.' },
            { type: 'question', id: 'q-sample-1', prompt: 'Was würdest du tun, wenn plötzlich eine geheimnisvolle Tür in deinem Zimmer erscheint?' },
            { type: 'paragraph', text: 'Mit klopfendem Herzen legte Mira die Hand auf die Klinke. Auf der anderen Seite raschelten Seiten, obwohl kein Wind zu hören war.' }
          ] },
          { title: 'Seite 2', blocks: [
            { type: 'paragraph', text: 'Hinter der Tür lag eine Bibliothek, die größer war als die Stadt. Bücher schwebten wie Laternen über den Gängen, und jedes flüsterte seinen ersten Satz.' },
            { type: 'paragraph', text: 'Ein kleiner Fuchs mit Brille sprang von einem Regal. „Du bist spät“, sagte er, „aber Geschichten warten manchmal freiwillig.“' }
          ] }
        ]
      },
      {
        title: 'Kapitel 2: Die Frage im Buch',
        pages: [
          { title: 'Seite 1', blocks: [
            { type: 'paragraph', text: 'Der Fuchs führte Mira zu einem Buch ohne Titel. Als sie es öffnete, erschien ihr eigener Name auf der ersten Seite.' },
            { type: 'question', id: 'q-sample-2', prompt: 'Welche Eigenschaft sollte eine Heldin oder ein Held unbedingt haben? Warum?' },
            { type: 'paragraph', text: 'Mira schrieb vorsichtig ein Wort auf die leere Linie: Mut. Sofort wuchs aus dem Wort eine kleine goldene Brücke.' }
          ] },
          { title: 'Seite 2', blocks: [
            { type: 'paragraph', text: 'Die Brücke führte nicht aus der Bibliothek hinaus, sondern tiefer hinein. Dort standen Regale mit Geschichten, die erst noch geschrieben werden wollten.' },
            { type: 'paragraph', text: '„Jetzt bist du dran“, sagte der Fuchs. „Jede Antwort öffnet eine neue Seite.“' }
          ] }
        ]
      }
    ]
  };
}

function render() {
  document.documentElement.dataset.theme = db.theme || 'dark';
  document.querySelector('#themeToggle').textContent = db.theme === 'light' ? '☀️ Helles Design' : '🌙 Dunkles Design';
  const user = currentUser();
  roleBadge.textContent = user ? `${roleName(user.role)} · ${user.username}` : 'Nicht angemeldet';
  renderNav();
  document.querySelector('#quickSaveBtn').disabled = !session;
  if (!db.setupDone) return renderSetup();
  if (!session) return renderLogin();
  if (view.name === 'library') return renderLibrary();
  if (view.name === 'favorites') return renderLibrary(true);
  if (view.name === 'reader') return renderReader();
  if (view.name === 'editor' && canWrite()) return renderEditor();
  if (view.name === 'manage' && isMain()) return renderManage();
  return renderDashboard();
}

function renderNav() {
  if (!session) { nav.innerHTML = ''; return; }
  const items = [
    ['home', '🏠 Dashboard'], ['library', '📚 Bibliothek'], ['favorites', '⭐ Favoriten']
  ];
  if (canWrite()) items.push(['editor', '✍️ Bücher schreiben']);
  if (isMain()) items.push(['manage', '🛡️ Verwaltung']);
  nav.innerHTML = items.map(([name, label]) => `<button class="ghost-button" type="button" data-nav="${name}">${label}</button>`).join('');
}

function renderSetup() {
  app.innerHTML = `<section class="hero"><h1>Einrichtung des Main Admins</h1><p>Beim ersten Start legst du einmalig die Zugangsdaten für den Main Admin fest. Danach kannst du dich über die getrennte Main-Admin-Login-Karte anmelden.</p></section><section class="panel"><form id="setupForm" class="form"><label>Benutzername<input required name="username" autocomplete="username" placeholder="z. B. hauptadmin"></label><label>Passwort<input required name="password" type="password" minlength="4" autocomplete="new-password" placeholder="Mindestens 4 Zeichen"></label><button class="primary-button" type="submit">Main Admin erstellen</button></form></section>`;
}

function renderLogin() {
  app.innerHTML = `<section class="hero"><h1>Lesen. Schreiben. Antworten.</h1><p>Eine lokale, offlinefähige Progressive Web App für interaktive Bücher mit Kapiteln, Seiten, Fragen im Text, Favoriten und Lesefortschritt.</p></section><section class="auth-grid">${['user','admin','main'].map(role => loginCard(role)).join('')}</section>`;
}
function loginCard(role) {
  const hints = { user: 'Lies Bücher, beantworte Fragen und speichere deinen Fortschritt.', admin: 'Erstelle Bücher, Kapitel, Seiten und Fragen direkt im Text.', main: 'Verwalte Admins, User und Bücher.' };
  const disabled = role === 'admin' && !db.users.some(user => user.role === 'admin');
  const notice = disabled ? '<p class="muted">Noch kein Admin vorhanden. Der Main Admin kann Admin-Logins in der Verwaltung erstellen.</p>' : '';
  return `<article class="auth-card"><div class="role-icon">${role === 'user' ? '📖' : role === 'admin' ? '✍️' : '🛡️'}</div><h3>${roleName(role)}</h3><p class="muted">${hints[role]}</p>${notice}<form class="form login-form" data-role="${role}"><label>Benutzername<input required name="username" autocomplete="username" ${disabled ? 'disabled' : ''}></label><label>Passwort<input required name="password" type="password" autocomplete="current-password" ${disabled ? 'disabled' : ''}></label><button class="primary-button" type="submit" ${disabled ? 'disabled' : ''}>Als ${roleName(role)} anmelden</button>${role === 'user' ? '<button class="secondary-button" data-register-user type="button">Neuen Leser lokal registrieren</button>' : ''}</form></article>`;
}

function renderDashboard() {
  const user = currentUser();
  const last = lastReadBooks()[0];
  app.innerHTML = `<section class="hero"><h1>Willkommen, ${escapeHtml(user.username)}.</h1><p>Dein Dashboard zeigt Bibliothek, Favoriten, zuletzt gelesene Bücher und ${canWrite() ? 'deine Schreibwerkzeuge.' : 'deine gespeicherten Antworten.'}</p><div class="grid three"><div class="stat-card"><strong>${db.books.length}</strong><span>Bücher</span></div><div class="stat-card"><strong>${Object.keys(db.favorites[user.id] || {}).length}</strong><span>Favoriten</span></div><div class="stat-card"><strong>${Object.keys(db.answers[user.id] || {}).length}</strong><span>Antworten</span></div></div></section><section class="panel"><div class="toolbar"><h2>Zuletzt gelesen</h2><button class="primary-button" data-nav="library" type="button">Zur Bibliothek</button></div>${last ? bookGrid([last]) : '<div class="empty-state">Du hast noch kein Buch begonnen.</div>'}</section>`;
}

function renderLibrary(favoritesOnly = false) {
  const query = (document.querySelector('#searchInput')?.value || '').toLowerCase();
  const favs = db.favorites[session.id] || {};
  let books = db.books.filter(book => `${book.title} ${book.description}`.toLowerCase().includes(query));
  if (favoritesOnly) books = books.filter(book => favs[book.id]);
  app.innerHTML = `<section class="panel"><div class="toolbar"><div><h2>${favoritesOnly ? 'Favoriten' : 'Bibliothek'}</h2><p class="muted">Wähle ein Buch aus, lies weiter oder filtere nach Titel und Beschreibung.</p></div><input id="searchInput" class="searchbar" placeholder="Buch suchen …" value="${escapeHtml(document.querySelector('#searchInput')?.value || '')}"></div>${books.length ? bookGrid(books) : '<div class="empty-state">Keine Bücher gefunden.</div>'}</section>`;
}

function bookGrid(books) { return `<div class="book-grid">${books.map(bookCard).join('')}</div>`; }
function bookCard(book) {
  const progress = getProgressPercent(book);
  const fav = !!(db.favorites[session.id] || {})[book.id];
  return `<article class="book-card"><div class="book-cover" style="background-image:url('${book.cover || DEFAULT_COVER}')"></div><div class="book-card-body"><div class="book-card-topline"><span class="pill">${book.chapters.length} Kapitel</span><button class="favorite-button" data-favorite="${book.id}" type="button" aria-label="Favorit umschalten">${fav ? '★' : '☆'}</button></div><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.description)}</p><div class="progress-wrap"><span>${progress}% gelesen</span><div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div></div><div class="card-actions"><button class="primary-button" data-read="${book.id}" type="button">${progress ? 'Weiterlesen' : 'Lesen'}</button>${canWrite() ? `<button class="secondary-button" data-edit="${book.id}" type="button">Bearbeiten</button>` : ''}</div></div></article>`;
}
function getProgressPercent(book) {
  const p = db.progress[session.id]?.[book.id];
  if (!p) return 0;
  const total = book.chapters.reduce((sum, ch) => sum + ch.pages.length, 0) || 1;
  const before = book.chapters.slice(0, p.chapterIndex).reduce((sum, ch) => sum + ch.pages.length, 0) + p.pageIndex + 1;
  return Math.min(100, Math.round((before / total) * 100));
}
function lastReadBooks() {
  const progress = db.progress[session.id] || {};
  return Object.entries(progress).sort((a,b) => (b[1].updatedAt || '').localeCompare(a[1].updatedAt || '')).map(([id]) => db.books.find(book => book.id === id)).filter(Boolean);
}

function renderReader() {
  const book = db.books.find(item => item.id === view.bookId) || db.books[0];
  const saved = db.progress[session.id]?.[book.id];
  if (saved && view.bookId !== book.id) { view.chapterIndex = saved.chapterIndex; view.pageIndex = saved.pageIndex; }
  const chapter = book.chapters[view.chapterIndex] || book.chapters[0];
  const page = chapter.pages[view.pageIndex] || chapter.pages[0];
  const atStart = view.chapterIndex === 0 && view.pageIndex === 0;
  const atEnd = view.chapterIndex === book.chapters.length - 1 && view.pageIndex === chapter.pages.length - 1;
  db.progress[session.id] ||= {}; db.progress[session.id][book.id] = { chapterIndex: view.chapterIndex, pageIndex: view.pageIndex, updatedAt: new Date().toISOString() }; localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  app.innerHTML = `<section class="reader-page" style="--reader-font:${book.fontFamily};--reader-size:${book.fontSize}px"><div class="reader-header"><span class="pill">${escapeHtml(chapter.title)} · ${escapeHtml(page.title)}</span><h1>${escapeHtml(book.title)}</h1><p class="muted">Deine Antworten werden lokal direkt an dieser Textstelle gespeichert.</p></div><article class="reader-content">${page.blocks.map(block => renderReadBlock(book, block)).join('')}</article><div class="reader-controls"><button class="secondary-button" data-prev-page ${atStart ? 'disabled' : ''} type="button">← Zurück</button><button class="primary-button" data-save-answers type="button">Antworten speichern</button><button class="secondary-button" data-next-page ${atEnd ? 'disabled' : ''} type="button">Weiter →</button></div></section>`;
}
function renderReadBlock(book, block) {
  if (block.type === 'question') {
    const value = db.answers[session.id]?.[block.id] || '';
    return `<div class="question-block"><strong>Frage: ${escapeHtml(block.prompt)}</strong><textarea data-answer="${block.id}" placeholder="Deine Antwort …">${escapeHtml(value)}</textarea></div>`;
  }
  return `<p>${escapeHtml(block.text)}</p>`;
}

function renderEditor() {
  if (!draftBook) draftBook = structuredClone(db.books.find(book => book.id === view.editingBookId) || createEmptyBook());
  const chapter = draftBook.chapters[view.chapterIndex] || draftBook.chapters[0];
  const page = chapter.pages[view.pageIndex] || chapter.pages[0];
  app.innerHTML = `<section class="panel"><div class="toolbar"><div><h2>Bücher schreiben</h2><p class="muted">Schreibe Bücher aus Kapiteln und Seiten. Fragen werden als Blöcke direkt zwischen Absätzen eingefügt.</p></div><button class="secondary-button" data-new-book type="button">Neues Buch</button></div><div class="editor-layout"><aside class="editor-sidebar"><label>Buch<select id="bookSelect">${db.books.map(book => `<option value="${book.id}" ${book.id === draftBook.id ? 'selected' : ''}>${escapeHtml(book.title)}</option>`).join('')}</select></label><label>Titel<input id="bookTitle" value="${escapeHtml(draftBook.title)}"></label><label>Beschreibung<textarea id="bookDescription">${escapeHtml(draftBook.description)}</textarea></label><label>Cover URL oder Data-URL<textarea id="bookCover">${escapeHtml(draftBook.cover || '')}</textarea></label><div class="grid two"><label>Schriftart<select id="bookFont"><option ${draftBook.fontFamily.includes('Georgia') ? 'selected' : ''} value="Georgia, serif">Georgia</option><option ${draftBook.fontFamily.includes('Arial') ? 'selected' : ''} value="Arial, sans-serif">Arial</option><option ${draftBook.fontFamily.includes('Verdana') ? 'selected' : ''} value="Verdana, sans-serif">Verdana</option></select></label><label>Größe<input id="bookSize" type="number" min="14" max="32" value="${draftBook.fontSize}"></label></div><button class="primary-button" data-save-book type="button">Buch zwischenspeichern</button><button class="secondary-button" data-add-chapter type="button">Kapitel hinzufügen</button><div class="chapter-list">${draftBook.chapters.map((ch, i) => `<button class="ghost-button" data-chapter="${i}" type="button">${i + 1}. ${escapeHtml(ch.title)}</button>`).join('')}</div></aside><div><label>Kapiteltitel<input id="chapterTitle" value="${escapeHtml(chapter.title)}"></label><div class="toolbar"><div class="page-list">${chapter.pages.map((pg, i) => `<button class="ghost-button" data-page="${i}" type="button">${escapeHtml(pg.title)}</button>`).join('')}</div><button class="secondary-button" data-add-page type="button">Seite hinzufügen</button></div><label>Seitentitel<input id="pageTitle" value="${escapeHtml(page.title)}"></label><div class="editor-actions"><button class="secondary-button" data-add-paragraph type="button">Absatz einfügen</button><button class="secondary-button" data-add-question type="button">Frage im Text einfügen</button></div><div class="block-list">${page.blocks.map((block, i) => renderEditBlock(block, i)).join('')}</div></div></div></section>`;
}
function renderEditBlock(block, index) {
  if (block.type === 'question') return `<div class="block-editor question"><label>Frage im Buchtext<textarea data-block="${index}" data-field="prompt">${escapeHtml(block.prompt)}</textarea></label><button class="danger-button" data-delete-block="${index}" type="button">Block löschen</button></div>`;
  return `<div class="block-editor"><label>Absatz<textarea data-block="${index}" data-field="text">${escapeHtml(block.text)}</textarea></label><button class="danger-button" data-delete-block="${index}" type="button">Block löschen</button></div>`;
}
function createEmptyBook() { return { id: uid('book'), title: 'Neues Buch', authorId: session.id, description: 'Kurzbeschreibung deines Buches', cover: DEFAULT_COVER, fontFamily: 'Georgia, serif', fontSize: 19, updatedAt: new Date().toISOString(), chapters: [{ title: 'Kapitel 1', pages: [{ title: 'Seite 1', blocks: [{ type: 'paragraph', text: 'Beginne hier mit deinem Text.' }] }] }] }; }

function renderManage() {
  app.innerHTML = `<section class="panel"><h2>Verwaltung</h2><p class="muted">Main Admins können lokale Admin-Logins und Leser verwalten sowie Bücher entfernen.</p><div class="grid two"><form id="createUserForm" class="form"><h3>Login erstellen</h3><label>Rolle<select name="role"><option value="admin">Admin / Autor</option><option value="user">User / Leser</option></select></label><label>Benutzername<input required name="username"></label><label>Passwort<input required type="password" minlength="4" name="password"></label><button class="primary-button" type="submit">Benutzer erstellen</button></form><div><h3>Benutzer</h3><div class="user-list">${db.users.map(user => `<div class="list-item"><span>${escapeHtml(user.username)} · ${roleName(user.role)}</span>${user.id !== session.id ? `<button class="danger-button" data-delete-user="${user.id}" type="button">Löschen</button>` : '<span class="pill">Du</span>'}</div>`).join('')}</div></div></div><h3>Bücher verwalten</h3><div class="user-list">${db.books.map(book => `<div class="list-item"><span>${escapeHtml(book.title)}</span><button class="danger-button" data-delete-book="${book.id}" type="button">Löschen</button></div>`).join('')}</div></section>`;
}

function syncDraftFromForm() {
  if (!draftBook) return;
  const chapter = draftBook.chapters[view.chapterIndex];
  const page = chapter.pages[view.pageIndex];
  draftBook.title = document.querySelector('#bookTitle')?.value || draftBook.title;
  draftBook.description = document.querySelector('#bookDescription')?.value || '';
  draftBook.cover = document.querySelector('#bookCover')?.value || DEFAULT_COVER;
  draftBook.fontFamily = document.querySelector('#bookFont')?.value || 'Georgia, serif';
  draftBook.fontSize = Number(document.querySelector('#bookSize')?.value || 19);
  chapter.title = document.querySelector('#chapterTitle')?.value || chapter.title;
  page.title = document.querySelector('#pageTitle')?.value || page.title;
  document.querySelectorAll('[data-block]').forEach(input => { const block = page.blocks[Number(input.dataset.block)]; block[input.dataset.field] = input.value; });
}
function persistDraft() { syncDraftFromForm(); draftBook.updatedAt = new Date().toISOString(); const i = db.books.findIndex(book => book.id === draftBook.id); if (i >= 0) db.books[i] = structuredClone(draftBook); else db.books.push(structuredClone(draftBook)); view.editingBookId = draftBook.id; saveDb('Buch zwischengespeichert'); render(); }

app.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'setupForm') {
    const data = new FormData(event.target);
    const user = { id: uid('user'), username: data.get('username').trim(), password: data.get('password'), role: 'main' };
    db.users.push(user); db.setupDone = true; saveDb('Main Admin wurde erstellt'); setSession(user); view.name = 'home'; render();
  }
  if (event.target.classList.contains('login-form')) {
    const data = new FormData(event.target); const role = event.target.dataset.role;
    const user = db.users.find(item => item.role === role && item.username === data.get('username').trim() && item.password === data.get('password'));
    if (!user) return showToast('Login nicht gefunden oder falsche Rolle gewählt.');
    setSession(user); view.name = 'home'; render();
  }
  if (event.target.id === 'createUserForm') {
    const data = new FormData(event.target); const username = data.get('username').trim();
    if (db.users.some(user => user.username === username)) return showToast('Benutzername existiert bereits.');
    db.users.push({ id: uid('user'), username, password: data.get('password'), role: data.get('role') }); saveDb('Benutzer erstellt'); render();
  }
});

app.addEventListener('input', event => {
  if (event.target.id === 'searchInput') renderLibrary(view.name === 'favorites');
});

app.addEventListener('click', event => {
  const target = event.target.closest('button'); if (!target) return;
  if (target.dataset.nav) { view.name = target.dataset.nav; closeMenu(); render(); }
  if (target.dataset.registerUser !== undefined) { const username = prompt('Benutzername für neuen Leser:'); const password = prompt('Passwort für neuen Leser:'); if (username && password) { const user = { id: uid('user'), username: username.trim(), password, role: 'user' }; db.users.push(user); saveDb('Leser wurde registriert'); setSession(user); view.name = 'home'; render(); } }
  if (target.dataset.favorite) { db.favorites[session.id] ||= {}; db.favorites[session.id][target.dataset.favorite] ? delete db.favorites[session.id][target.dataset.favorite] : db.favorites[session.id][target.dataset.favorite] = true; saveDb('Favoriten aktualisiert'); render(); }
  if (target.dataset.read) { const book = db.books.find(b => b.id === target.dataset.read); const p = db.progress[session.id]?.[book.id]; view = { ...view, name: 'reader', bookId: book.id, chapterIndex: p?.chapterIndex || 0, pageIndex: p?.pageIndex || 0 }; render(); }
  if (target.dataset.edit) { view.name = 'editor'; view.editingBookId = target.dataset.edit; view.chapterIndex = 0; view.pageIndex = 0; draftBook = null; render(); }
  if (target.dataset.saveAnswers !== undefined) { db.answers[session.id] ||= {}; document.querySelectorAll('[data-answer]').forEach(input => db.answers[session.id][input.dataset.answer] = input.value); saveDb('Antworten gespeichert'); }
  if (target.dataset.nextPage !== undefined) movePage(1);
  if (target.dataset.prevPage !== undefined) movePage(-1);
  if (target.dataset.saveBook !== undefined) persistDraft();
  if (target.dataset.newBook !== undefined) { syncDraftFromForm(); draftBook = createEmptyBook(); view.editingBookId = draftBook.id; view.chapterIndex = 0; view.pageIndex = 0; render(); }
  if (target.dataset.addChapter !== undefined) { syncDraftFromForm(); draftBook.chapters.push({ title: `Kapitel ${draftBook.chapters.length + 1}`, pages: [{ title: 'Seite 1', blocks: [] }] }); view.chapterIndex = draftBook.chapters.length - 1; view.pageIndex = 0; render(); }
  if (target.dataset.addPage !== undefined) { syncDraftFromForm(); const ch = draftBook.chapters[view.chapterIndex]; ch.pages.push({ title: `Seite ${ch.pages.length + 1}`, blocks: [] }); view.pageIndex = ch.pages.length - 1; render(); }
  if (target.dataset.addParagraph !== undefined) { syncDraftFromForm(); draftBook.chapters[view.chapterIndex].pages[view.pageIndex].blocks.push({ type: 'paragraph', text: 'Neuer Absatz …' }); render(); }
  if (target.dataset.addQuestion !== undefined) { syncDraftFromForm(); draftBook.chapters[view.chapterIndex].pages[view.pageIndex].blocks.push({ type: 'question', id: uid('question'), prompt: 'Deine Frage …' }); render(); }
  if (target.dataset.deleteBlock !== undefined) { syncDraftFromForm(); draftBook.chapters[view.chapterIndex].pages[view.pageIndex].blocks.splice(Number(target.dataset.deleteBlock), 1); render(); }
  if (target.dataset.chapter !== undefined) { syncDraftFromForm(); view.chapterIndex = Number(target.dataset.chapter); view.pageIndex = 0; render(); }
  if (target.dataset.page !== undefined) { syncDraftFromForm(); view.pageIndex = Number(target.dataset.page); render(); }
  if (target.dataset.deleteUser) { db.users = db.users.filter(user => user.id !== target.dataset.deleteUser); saveDb('Benutzer gelöscht'); render(); }
  if (target.dataset.deleteBook) { db.books = db.books.filter(book => book.id !== target.dataset.deleteBook); saveDb('Buch gelöscht'); render(); }
});

app.addEventListener('change', event => {
  if (event.target.id === 'bookSelect') { view.editingBookId = event.target.value; view.chapterIndex = 0; view.pageIndex = 0; draftBook = null; render(); }
});

function movePage(direction) {
  const book = db.books.find(b => b.id === view.bookId); const chapter = book.chapters[view.chapterIndex];
  if (direction > 0 && view.pageIndex < chapter.pages.length - 1) view.pageIndex++;
  else if (direction > 0 && view.chapterIndex < book.chapters.length - 1) { view.chapterIndex++; view.pageIndex = 0; }
  else if (direction < 0 && view.pageIndex > 0) view.pageIndex--;
  else if (direction < 0 && view.chapterIndex > 0) { view.chapterIndex--; view.pageIndex = book.chapters[view.chapterIndex].pages.length - 1; }
  render();
}
function closeMenu() { sideMenu.classList.remove('open'); menuOverlay.classList.remove('open'); }

document.querySelector('#menuBtn').addEventListener('click', () => { sideMenu.classList.add('open'); menuOverlay.classList.add('open'); });
menuOverlay.addEventListener('click', closeMenu);
document.querySelector('#logoutBtn').addEventListener('click', () => { setSession(null); view.name = 'home'; draftBook = null; closeMenu(); render(); });
document.querySelector('#themeToggle').addEventListener('click', () => { db.theme = db.theme === 'light' ? 'dark' : 'light'; saveDb('Design geändert'); render(); });
document.querySelector('#quickSaveBtn').addEventListener('click', () => { if (view.name === 'editor' && draftBook) persistDraft(); else saveDb('Daten lokal gespeichert'); });

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => showToast('Service Worker konnte nicht registriert werden.')));
render();
