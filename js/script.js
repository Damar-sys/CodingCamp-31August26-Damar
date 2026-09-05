/* ============================================================
   TO-DO LIST LIFE DASHBOARD — script.js
   Vanilla JavaScript only | No frameworks | No backend
   ============================================================ */

'use strict';

/* ============================================================
   UTILITY — LocalStorage helpers
   ============================================================ */
const LS = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable — fail silently
    }
  },
};

/* ============================================================
   UTILITY — Toast notification
   Shows a small pop-up at the bottom of the screen.
   type: 'success' | 'error' | 'info'
   ============================================================ */
function showToast(message, type = 'info') {
  // Remove any existing toast so they don't stack
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove after the CSS animation finishes (2.6s + 0.4s = 3s)
  setTimeout(() => toast.remove(), 3000);
}

/* ============================================================
   1. CLOCK, DATE & GREETING
   ============================================================ */
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date-display');
const greetingEl = document.getElementById('greeting-text');

const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function updateClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  const s   = String(now.getSeconds()).padStart(2, '0');

  // HH:MM:SS
  clockEl.textContent = `${h}:${m}:${s}`;

  // Full date string
  const dayName   = DAY_NAMES[now.getDay()];
  const dateNum   = now.getDate();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year      = now.getFullYear();
  dateEl.textContent = `${dayName}, ${dateNum} ${monthName} ${year}`;

  // Greeting based on hour
  const hour = now.getHours();
  let salutation;
  if (hour < 12) {
    salutation = 'Good Morning';
  } else if (hour < 18) {
    salutation = 'Good Afternoon';
  } else {
    salutation = 'Good Evening';
  }

  const savedName = LS.get('userName', '');
  greetingEl.textContent = savedName
    ? `${salutation}, ${savedName}! 👋`
    : `${salutation}! 👋`;
}

// Run immediately, then update every second
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   2. CUSTOM NAME — save & load from LocalStorage
   ============================================================ */
const nameInput   = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');

function loadSavedName() {
  const saved = LS.get('userName', '');
  if (saved) {
    nameInput.value = saved;
  }
  // Greeting is refreshed every second by updateClock,
  // but call once here so it shows immediately on load.
  updateClock();
}

saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Please enter your name first.', 'error');
    return;
  }
  LS.set('userName', name);
  updateClock(); // refresh greeting immediately
  showToast(`Name saved! Hello, ${name} 👋`, 'success');
});

// Allow pressing Enter to save
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
});

loadSavedName();

/* ============================================================
   3. FOCUS TIMER
   - Default 25 minutes
   - MM:SS display, updated every second
   - Start / Stop / Reset buttons
   - Guards against multiple intervals
   - Auto-stops at 00:00 with notification
   ============================================================ */
const TIMER_DEFAULT = 25 * 60; // 1500 seconds

const timerDisplayEl = document.getElementById('timer-display');
const timerStatusEl  = document.getElementById('timer-status');
const timerCard      = document.getElementById('timer-card');
const btnStart       = document.getElementById('timer-start');
const btnStop        = document.getElementById('timer-stop');
const btnReset       = document.getElementById('timer-reset');

let timerSeconds  = TIMER_DEFAULT;
let timerInterval = null; // null means not running — prevents multiple intervals

function formatTime(totalSec) {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function renderTimer() {
  timerDisplayEl.textContent = formatTime(timerSeconds);
}

function setTimerStatus(msg) {
  if (timerStatusEl) timerStatusEl.textContent = msg;
}

function timerTick() {
  timerSeconds--;
  renderTimer();

  if (timerSeconds <= 0) {
    // Stop the interval
    clearInterval(timerInterval);
    timerInterval = null;
    timerCard.classList.remove('timer-running');
    timerSeconds = 0;
    renderTimer();

    // Notify the user
    showToast('🎉 Focus session complete! Great work!', 'success');
    setTimerStatus('Session complete! Take a break 🎉');

    // Native browser notification (if permission was granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Session Complete! 🎉', {
        body: 'Your 25-minute focus session has ended. Time for a break!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⏰</text></svg>',
      });
    } else {
      // Fallback alert so the user is always informed
      setTimeout(() => {
        alert('🎉 Focus session complete! Great work! Time for a break.');
      }, 100);
    }
  }
}

btnStart.addEventListener('click', () => {
  // Guard: do not start a second interval if one is already running
  if (timerInterval !== null) return;

  // If the timer ran out, reset before starting
  if (timerSeconds <= 0) {
    timerSeconds = TIMER_DEFAULT;
    renderTimer();
  }

  timerCard.classList.add('timer-running');
  setTimerStatus('Focusing… 🔥');
  timerInterval = setInterval(timerTick, 1000);

  // Request browser notification permission lazily on first start
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

btnStop.addEventListener('click', () => {
  if (timerInterval === null) return; // nothing running
  clearInterval(timerInterval);
  timerInterval = null;
  timerCard.classList.remove('timer-running');
  setTimerStatus('Paused. Press Start to continue.');
  showToast('Timer paused.', 'info');
});

btnReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  timerCard.classList.remove('timer-running');
  timerSeconds = TIMER_DEFAULT;
  renderTimer();
  setTimerStatus('Ready to focus!');
  showToast('Timer reset to 25:00.', 'info');
});

// Render initial display
renderTimer();

/* ============================================================
   4 & 5. TO-DO LIST  +  DUPLICATE PREVENTION
   Data shape: [{ id: string, text: string, done: boolean }]
   ============================================================ */
const todoInputEl  = document.getElementById('todo-input');
const todoAddBtn   = document.getElementById('todo-add-btn');
const todoListEl   = document.getElementById('todo-list');
const todoStatsEl  = document.getElementById('todo-stats');
const statsTextEl  = document.getElementById('todo-stats-text');
const progressFill = document.getElementById('todo-progress-fill');

// Edit modal
const editModal     = document.getElementById('edit-modal');
const editInputEl   = document.getElementById('edit-input');
const editSaveBtn   = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');

let todos         = LS.get('todos', []); // loaded from LocalStorage
let editingTodoId = null;

/* ---- Helpers ---- */

function generateId() {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Normalise: trim whitespace + lowercase for comparison
function normalise(str) {
  return str.trim().toLowerCase();
}

// Check if a task text already exists (optionally excluding one id, for edits)
function isDuplicate(text, excludeId = null) {
  const norm = normalise(text);
  return todos.some(
    (t) => normalise(t.text) === norm && t.id !== excludeId,
  );
}

function saveTodos() {
  LS.set('todos', todos);
}

/* ---- Stats bar ---- */

function renderStats() {
  if (todos.length === 0) {
    todoStatsEl.hidden = true;
    return;
  }
  const done  = todos.filter((t) => t.done).length;
  const total = todos.length;
  const pct   = Math.round((done / total) * 100);

  statsTextEl.textContent    = `${done} of ${total} task${total !== 1 ? 's' : ''} completed (${pct}%)`;
  progressFill.style.width   = `${pct}%`;
  todoStatsEl.hidden         = false;
}

/* ---- Render task list ---- */

function renderTodos() {
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const li = document.createElement('li');
    li.className   = 'empty-state';
    li.textContent = 'No tasks yet. Add one above! ✨';
    todoListEl.appendChild(li);
    renderStats();
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className   = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id  = todo.id;

    // Checkbox
    const checkbox     = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.checked   = todo.done;
    checkbox.setAttribute('aria-label',
      `Mark "${todo.text}" as ${todo.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // Text label
    const span       = document.createElement('span');
    span.className   = 'todo-item-text';
    span.textContent = todo.text;

    // Edit button
    const editBtn     = document.createElement('button');
    editBtn.className = 'btn btn-warning btn-sm';
    editBtn.innerHTML = '&#9999;&#65039; Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.addEventListener('click', () => openEditModal(todo.id));

    // Delete button
    const deleteBtn     = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.innerHTML = '&#128465;&#65039; Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    // Actions wrapper
    const actions     = document.createElement('div');
    actions.className = 'todo-item-actions';
    actions.append(editBtn, deleteBtn);

    li.append(checkbox, span, actions);
    todoListEl.appendChild(li);
  });

  renderStats();
}

/* ---- Actions ---- */

function addTodo() {
  const raw  = todoInputEl.value;
  const text = raw.trim();

  if (!text) {
    showToast('Please enter a task.', 'error');
    todoInputEl.focus();
    return;
  }

  // Duplicate check (case-insensitive, trims whitespace)
  if (isDuplicate(text)) {
    showToast(`⚠️ Duplicate task: "${text}" already exists!`, 'error');
    todoInputEl.select();
    return;
  }

  todos.push({ id: generateId(), text, done: false });
  saveTodos();
  renderTodos();
  todoInputEl.value = '';
  todoInputEl.focus();
  showToast('Task added! ✅', 'success');
}

function toggleTodo(id) {
  todos = todos.map((t) =>
    t.id === id ? { ...t, done: !t.done } : t,
  );
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
  showToast('Task deleted.', 'info');
}

/* ---- Edit modal ---- */

function openEditModal(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  editingTodoId    = id;
  editInputEl.value = todo.text;
  editModal.hidden  = false;

  // Focus and select so the user can type immediately
  requestAnimationFrame(() => {
    editInputEl.focus();
    editInputEl.select();
  });
}

function closeEditModal() {
  editModal.hidden  = true;
  editingTodoId     = null;
  editInputEl.value = '';
}

function saveEdit() {
  const newText = editInputEl.value.trim();

  if (!newText) {
    showToast('Task text cannot be empty.', 'error');
    editInputEl.focus();
    return;
  }

  // Duplicate check — exclude the task being edited so it can keep its own text
  if (isDuplicate(newText, editingTodoId)) {
    showToast(`⚠️ Duplicate task: "${newText}" already exists!`, 'error');
    editInputEl.select();
    return;
  }

  todos = todos.map((t) =>
    t.id === editingTodoId ? { ...t, text: newText } : t,
  );
  saveTodos();
  renderTodos();
  closeEditModal();
  showToast('Task updated! ✏️', 'success');
}

/* ---- Event listeners ---- */

todoAddBtn.addEventListener('click', addTodo);

todoInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

editSaveBtn.addEventListener('click', saveEdit);

editCancelBtn.addEventListener('click', closeEditModal);

editInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal when clicking the dark backdrop
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

// Initial render (loads tasks from LocalStorage)
renderTodos();

/* ============================================================
   6. QUICK LINKS
   Data shape: [{ id: string, name: string, url: string }]
   ============================================================ */
const linkNameInputEl  = document.getElementById('link-name-input');
const linkUrlInputEl   = document.getElementById('link-url-input');
const linkAddBtn       = document.getElementById('link-add-btn');
const linksContainerEl = document.getElementById('links-container');

let links = LS.get('quickLinks', []); // loaded from LocalStorage

/* ---- Helpers ---- */

// Prepend https:// if no protocol is present
function ensureProtocol(url) {
  url = url.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

function saveLinks() {
  LS.set('quickLinks', links);
}

/* ---- Render links ---- */

function renderLinks() {
  linksContainerEl.innerHTML = '';

  if (links.length === 0) {
    const p = document.createElement('p');
    p.className   = 'empty-state';
    p.textContent = 'No links saved yet. Add one above! 🔗';
    linksContainerEl.appendChild(p);
    return;
  }

  links.forEach((link) => {
    // Wrapper (chip + delete button)
    const wrapper     = document.createElement('div');
    wrapper.className = 'link-chip-wrapper';
    wrapper.dataset.id = link.id;
    wrapper.setAttribute('role', 'listitem');

    // Clickable anchor chip
    const anchor   = document.createElement('a');
    anchor.href    = link.url;
    anchor.target  = '_blank';
    anchor.rel     = 'noopener noreferrer';
    anchor.className   = 'link-chip';
    anchor.textContent = link.name;
    anchor.setAttribute('aria-label', `Open ${link.name} in new tab`);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'link-delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.name}`);
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    wrapper.append(anchor, deleteBtn);
    linksContainerEl.appendChild(wrapper);
  });
}

/* ---- Actions ---- */

function addLink() {
  const name   = linkNameInputEl.value.trim();
  const rawUrl = linkUrlInputEl.value.trim();

  if (!name) {
    showToast('Please enter a website name.', 'error');
    linkNameInputEl.focus();
    return;
  }

  if (!rawUrl) {
    showToast('Please enter a website URL.', 'error');
    linkUrlInputEl.focus();
    return;
  }

  // Auto-add https:// if missing
  const url = ensureProtocol(rawUrl);

  // Basic URL validity check
  try {
    new URL(url);
  } catch {
    showToast('Please enter a valid URL (e.g. google.com).', 'error');
    linkUrlInputEl.focus();
    return;
  }

  links.push({ id: `link-${Date.now()}`, name, url });
  saveLinks();
  renderLinks();

  linkNameInputEl.value = '';
  linkUrlInputEl.value  = '';
  linkNameInputEl.focus();
  showToast(`Link "${name}" saved! 🔗`, 'success');
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
  showToast('Link removed.', 'info');
}

/* ---- Event listeners ---- */

linkAddBtn.addEventListener('click', addLink);

// Enter on URL field submits the form
linkUrlInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

// Enter on name field jumps to URL field
linkNameInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkUrlInputEl.focus();
});

// Initial render (loads links from LocalStorage)
renderLinks();

/* ============================================================
   7. LIGHT / DARK MODE TOGGLE
   Saves preference to LocalStorage, loads it on page load.
   ============================================================ */
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconEl    = document.getElementById('theme-icon');
const htmlEl         = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);

  // Update icon and accessible label
  if (theme === 'dark') {
    themeIconEl.textContent = '☀️';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  } else {
    themeIconEl.textContent = '🌙';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  }
}

function loadTheme() {
  const saved = LS.get('theme', 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  LS.set('theme', next);
  showToast(
    next === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled',
    'info',
  );
});

// Load saved theme immediately (before first paint flicker)
loadTheme();
