/* ═══════════════════════════════════════════
   Meriton Visualizer · app.js
   Main orchestrator: data loading, routing,
   tab switching, modal, shared utilities
═══════════════════════════════════════════ */

const BASE = '../openclaw-meriton-universe-p6fiy23b/openclaw-meriton-universe-p6fiy23b/services/';

const SERVICES = [
  'fintrack', 'quickbooks', 'calendar', 'contacts',
  'email', 'messaging', 'strava', 'sonos',
  'ticketmaster', 'reminder'
];

const DATA = {};
let activeTab = 'overview';
const rendered = new Set();

// ── LOAD ─────────────────────────────────────
async function loadAll() {
  setStatus('loading', 'Loading…');
  try {
    await Promise.all(SERVICES.map(s =>
      fetch(BASE + s + '/data.json')
        .then(r => { if (!r.ok) throw new Error(s); return r.json(); })
        .then(d => { DATA[s] = d; })
    ));
    hideLoading();
    setStatus('live', 'Loaded');
    renderActiveTab();
  } catch (e) {
    setStatus('loading', 'Error loading data');
    document.querySelector('.loader-box p').textContent = 'Failed to load: ' + e.message;
  }
}

function hideLoading() {
  document.getElementById('loading-overlay').style.display = 'none';
}

function setStatus(state, text) {
  const dot  = document.getElementById('status-dot');
  const span = document.getElementById('status-text');
  dot.className = 'pulse-dot' + (state === 'loading' ? ' loading' : '');
  span.textContent = text;
}

// ── TAB ROUTING ──────────────────────────────
function renderActiveTab() {
  const tab = activeTab;
  if (rendered.has(tab)) return;
  rendered.add(tab);
  switch (tab) {
    case 'overview':      renderOverview(DATA); break;
    case 'calendar':      renderCalendar(DATA); break;
    case 'finances':      renderFinances(DATA); break;
    case 'communications':renderCommunications(DATA); break;
    case 'contacts':      renderContacts(DATA); break;
    case 'cycling':       renderCycling(DATA); break;
    case 'entertainment': renderEntertainment(DATA); break;
  }
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + btn.dataset.tab).classList.add('active');
    activeTab = btn.dataset.tab;
    renderActiveTab();
  });
});

// Sub-tab switching (generic, works for any section)
document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('section');
    parent.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    parent.querySelectorAll('.sub-page').forEach(p => p.classList.remove('active'));
    const target = parent.querySelector('#' + btn.dataset.subtab);
    if (target) target.classList.add('active');
  });
});

// ── MODAL ────────────────────────────────────
function openModal(badge, title, bodyHTML) {
  document.getElementById('modal-badge').textContent  = badge;
  document.getElementById('modal-title').textContent  = title;
  document.getElementById('modal-body').innerHTML     = bodyHTML;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
function handleModalClick(e) {
  if (e.target.id === 'modal-overlay') closeModal();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── UTILITIES ────────────────────────────────
function fmtCurrency(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? '-$' : '$') + s;
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDateTime(ts) {
  return fmtDate(ts) + ' ' + fmtTime(ts);
}

function fmtISODate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDistance(meters) {
  return (meters / 1000).toFixed(1) + ' km';
}

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function fmtSpeed(mps) {
  return (mps * 3.6).toFixed(1) + ' km/h';
}

function monthKey(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function monthKeyISO(isoStr) {
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── PAGINATION ───────────────────────────────
function paginate(items, pageNum, pageSize) {
  const start = (pageNum - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function renderPagination(containerId, total, pageNum, pageSize, onPage) {
  const totalPages = Math.ceil(total / pageSize);
  const el = document.getElementById(containerId);
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" ${pageNum === 1 ? 'disabled' : ''} onclick="(${onPage})(${pageNum - 1})">‹</button>`;

  const range = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - pageNum) <= 2) range.push(i);
    else if (range[range.length - 1] !== '…') range.push('…');
  }
  range.forEach(r => {
    if (r === '…') html += `<span class="page-btn" style="cursor:default">…</span>`;
    else html += `<button class="page-btn ${r === pageNum ? 'active' : ''}" onclick="(${onPage})(${r})">${r}</button>`;
  });

  html += `<button class="page-btn" ${pageNum === totalPages ? 'disabled' : ''} onclick="(${onPage})(${pageNum + 1})">›</button>`;
  el.innerHTML = html;
}

// ── BOOT ─────────────────────────────────────
loadAll();
