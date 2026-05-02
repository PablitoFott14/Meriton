/* ═══════════════════════════════════════════
   calendar.js — All events, filterable,
   grouped by month, detail modal on click
═══════════════════════════════════════════ */

let calAllEvents = [];
let calFilter = '';

function renderCalendar(data) {
  calAllEvents = (data.calendar?.events || [])
    .sort((a, b) => a.start_datetime - b.start_datetime);

  document.getElementById('cal-search').addEventListener('input', e => {
    calFilter = e.target.value.toLowerCase();
    drawCalendar();
  });
  document.getElementById('cal-tag').addEventListener('change', e => {
    calFilter = '';
    document.getElementById('cal-search').value = '';
    drawCalendar(e.target.value);
  });

  drawCalendar();
}

let calTagFilter = '';

function drawCalendar(tagOverride) {
  if (tagOverride !== undefined) calTagFilter = tagOverride;

  let events = calAllEvents.filter(e => {
    const matchTag   = !calTagFilter || e.tag === calTagFilter;
    const search     = calFilter;
    const matchSearch = !search
      || e.title.toLowerCase().includes(search)
      || (e.location || '').toLowerCase().includes(search)
      || (e.description || '').toLowerCase().includes(search)
      || (e.attendees || []).some(a => a.toLowerCase().includes(search));
    return matchTag && matchSearch;
  });

  document.getElementById('cal-count').textContent = `${events.length} event${events.length !== 1 ? 's' : ''}`;

  // Group by month
  const groups = {};
  events.forEach(e => {
    const key = monthKey(e.start_datetime);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const list = document.getElementById('cal-list');
  if (events.length === 0) {
    list.innerHTML = '<div class="empty-state">No events match your filter.</div>';
    return;
  }

  let html = '';
  Object.entries(groups).forEach(([month, evs]) => {
    html += `<div class="month-group">
      <div class="month-header">${escHtml(month)}</div>`;
    evs.forEach(e => {
      const d = new Date(e.start_datetime * 1000);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = fmtTime(e.start_datetime);
      const attendeeStr = (e.attendees || []).filter(a => a !== 'Christine Zhao').join(', ');
      html += `<div class="cal-row" onclick='showCalEventModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>
        <div class="cal-date">${escHtml(dateStr)}</div>
        <div class="cal-time">${escHtml(timeStr)}</div>
        <div>
          <div class="cal-title">${escHtml(e.title)}</div>
          ${e.description ? `<div class="cal-loc" style="color:var(--text3)">${escHtml(e.description.slice(0, 60))}${e.description.length > 60 ? '…' : ''}</div>` : ''}
        </div>
        <div><span class="badge badge-${e.tag}">${escHtml(e.tag)}</span></div>
        <div class="cal-loc">${escHtml(e.location || '')}</div>
        <div class="cal-attendees">${escHtml(attendeeStr)}</div>
      </div>`;
    });
    html += '</div>';
  });

  list.innerHTML = html;
}

function showCalEventModal(e) {
  const d   = new Date(e.start_datetime * 1000);
  const end = e.end_datetime ? new Date(e.end_datetime * 1000) : null;
  const dur = end ? Math.round((e.end_datetime - e.start_datetime) / 60) : null;

  const attendeesList = (e.attendees || []).length > 0
    ? e.attendees.map(a => `<span style="display:inline-block;margin-right:6px;margin-bottom:4px;padding:2px 8px;background:var(--surface3);border-radius:4px;font-size:12px">${escHtml(a)}</span>`).join('')
    : '—';

  const body = `
    <div class="mf-grid">
      <div class="mf-item">
        <label>Date</label>
        <span class="val">${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <div class="mf-item">
        <label>Time</label>
        <span class="val">${fmtTime(e.start_datetime)}${end ? ' – ' + fmtTime(e.end_datetime) : ''}${dur ? ` (${dur} min)` : ''}</span>
      </div>
      <div class="mf-item">
        <label>Tag</label>
        <span class="val"><span class="badge badge-${e.tag}">${e.tag}</span></span>
      </div>
      <div class="mf-item">
        <label>Location</label>
        <span class="val">${escHtml(e.location || '—')}</span>
      </div>
      ${e.description ? `<div class="mf-item mf-full"><label>Notes</label><span class="val">${escHtml(e.description)}</span></div>` : ''}
      <div class="mf-item mf-full">
        <label>Attendees</label>
        <div style="margin-top:4px">${attendeesList}</div>
      </div>
    </div>`;
  openModal(e.tag, e.title, body);
}
