/* ═══════════════════════════════════════════
   overview.js — Profile + KPIs + reminders +
   upcoming events + Sonos now playing
═══════════════════════════════════════════ */

function renderOverview(data) {
  const el = document.getElementById('overview-content');

  // ── Derive data ───────────────────────────
  const ft       = data.fintrack  || {};
  const user     = (ft.users     || [])[0] || {};
  const accounts = ft.accounts   || [];
  const subs     = ft.subscriptions || [];
  const txns     = ft.transactions  || [];

  const qb       = data.quickbooks || {};
  const invoices = qb.invoices  || [];
  const bills    = qb.bills     || [];

  const contact0 = (data.contacts?.contacts || []).find(c => c.is_user) || {};
  const reminders= data.reminder?.reminders || [];
  const calEvents= data.calendar?.events    || [];
  const sonos    = data.sonos   || {};
  const speaker1 = (sonos.speakers || []).find(s => s.playback_state === 'PLAYING');

  // Net worth
  const netWorth = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Monthly subscriptions cost
  const monthlySubs = subs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  // Outstanding A/R (invoices with balance > 0)
  const outstandingAR = invoices
    .filter(i => i.Balance > 0)
    .reduce((sum, i) => sum + i.Balance, 0);

  // Strava: Christine's rides
  const christineId = (data.strava?.athletes || []).find(a => a.is_user)?.user_id;
  const myRides = (data.strava?.activities || []).filter(a => a.user_id === christineId);
  const totalKm = myRides.reduce((s, a) => s + (a.distance || 0), 0) / 1000;

  // Upcoming events (next 5 sorted by start_datetime > now)
  const now = Date.now() / 1000;
  const upcoming = calEvents
    .filter(e => e.start_datetime >= now)
    .sort((a, b) => a.start_datetime - b.start_datetime)
    .slice(0, 5);

  // ── Profile card ──────────────────────────
  const age = user.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth)) / (365.25 * 24 * 3600 * 1000))
    : contact0.age;

  let html = `
  <div class="profile-card">
    <div class="profile-avatar">CZ</div>
    <div class="profile-info">
      <div class="profile-name">${escHtml(contact0.first_name || user.name || 'Christine Zhao')} ${escHtml(contact0.last_name || '')}</div>
      <div class="profile-title">${escHtml(contact0.job || 'Compliance Officer')} · ${escHtml(contact0.description?.split('.')[0] || 'Meriton Financial Compliance Group')}</div>
      <div class="profile-meta">
        <div class="profile-meta-item"><span class="icon">📍</span>${escHtml(contact0.city_living || 'Raleigh')}, ${escHtml(contact0.country || 'US')}</div>
        <div class="profile-meta-item"><span class="icon">✉</span>${escHtml(user.email || contact0.email || 'christine.zhao@gmail.com')}</div>
        <div class="profile-meta-item"><span class="icon">📞</span>${escHtml(user.phone || contact0.phone || '(919) 555-0341')}</div>
        <div class="profile-meta-item"><span class="icon">🎂</span>Age ${age || 31}</div>
        <div class="profile-meta-item"><span class="icon">📅</span>FinTrack member since ${escHtml(user.member_since || '—')}</div>
        ${contact0.address ? `<div class="profile-meta-item"><span class="icon">🏠</span>${escHtml(contact0.address)}</div>` : ''}
      </div>
    </div>
  </div>`;

  // ── KPI tiles ─────────────────────────────
  const kpis = [
    { label: 'Net Worth',       value: fmtCurrency(netWorth),        sub: `${accounts.length} accounts`,                 color: 'var(--sky)' },
    { label: 'Monthly Subs',    value: fmtCurrency(monthlySubs),      sub: `${subs.filter(s=>s.status==='active').length} active`,color: 'var(--violet)' },
    { label: 'Outstanding A/R', value: fmtCurrency(outstandingAR),    sub: `${invoices.filter(i=>i.Balance>0).length} open invoices`, color: 'var(--amber)' },
    { label: 'Total Rides',     value: myRides.length,                sub: `${totalKm.toFixed(0)} km total`,              color: 'var(--emerald)' },
    { label: 'Calendar Events', value: calEvents.length,              sub: `${upcoming.length} upcoming`,                 color: 'var(--indigo)' },
    { label: 'Reminders',       value: reminders.length,              sub: 'active',                                      color: 'var(--rose)' },
  ];

  html += '<div class="kpi-row">';
  kpis.forEach(k => {
    html += `<div class="kpi-tile">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="color:${k.color}">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`;
  });
  html += '</div>';

  // ── Main grid ─────────────────────────────
  html += '<div class="grid-2" style="gap:16px">';

  // ── Left column: reminders + upcoming ─────
  html += '<div>';

  // Reminders
  if (reminders.length > 0) {
    html += `<div class="section-label" style="margin-bottom:10px">Active Reminders</div>`;
    reminders.forEach(r => {
      html += `<div class="reminder-item">
        <div class="reminder-icon">⏰</div>
        <div>
          <div class="reminder-title">${escHtml(r.title)}</div>
          <div class="reminder-due">Due ${fmtDate(r.due_datetime)}${r.description ? ' · ' + escHtml(r.description.slice(0, 80)) + (r.description.length > 80 ? '…' : '') : ''}</div>
        </div>
      </div>`;
    });
    html += '<div style="margin-bottom:18px"></div>';
  }

  // Upcoming events
  if (false) {
  html += `<div class="card">
    <h4>Upcoming Events</h4>`;
  if (upcoming.length === 0) {
    html += '<div class="empty-state">No upcoming events</div>';
  } else {
    upcoming.forEach(e => {
      html += `<div class="event-item" style="cursor:pointer" onclick='openCalendarEventModal(${JSON.stringify(e).replace(/'/g, "&#39;")})'>
        <div class="event-dot ${e.tag}"></div>
        <div>
          <div class="event-title">${escHtml(e.title)}</div>
          <div class="event-meta">
            ${fmtDate(e.start_datetime)} · ${fmtTime(e.start_datetime)}
            ${e.location ? ' · ' + escHtml(e.location) : ''}
          </div>
          ${e.attendees && e.attendees.length ? `<div class="event-meta">${e.attendees.map(a => escHtml(a)).join(', ')}</div>` : ''}
        </div>
      </div>`;
    });
  }
  html += '</div>'; // card
  }

  html += '</div>'; // left column

  // ── Right column: Sonos + recent activity ─
  html += '<div>';

  // Sonos now playing
  if (speaker1) {
    html += `<div class="section-label" style="margin-bottom:10px">Sonos — Now Playing</div>
    <div class="sonos-widget" style="margin-bottom:18px">
      <div>
        <div class="sonos-playing-badge">▶ Playing</div>
        <div class="sonos-track">${escHtml(speaker1.now_playing_title)}</div>
        <div class="sonos-artist">${escHtml(speaker1.now_playing_artist)} · ${escHtml(speaker1.now_playing_album)}</div>
        <div class="sonos-room">${escHtml(speaker1.room)} · ${escHtml(speaker1.model)} · Vol ${speaker1.volume}</div>
        <div class="sonos-room" style="margin-top:4px">Source: ${escHtml(speaker1.now_playing_source)}</div>
      </div>
    </div>`;
  }

  // Recent transactions (last 5 by date)
  const recentTxns = [...txns]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (recentTxns.length > 0) {
    html += `<div class="card">
      <h4>Recent Transactions</h4>
      <table>
        <thead><tr>
          <th>Date</th><th>Merchant</th><th>Category</th><th style="text-align:right">Amount</th>
        </tr></thead>
        <tbody>`;
    recentTxns.forEach(t => {
      const pos = t.amount >= 0;
      html += `<tr>
        <td class="mono">${escHtml(t.date)}</td>
        <td>${escHtml(t.merchant)}</td>
        <td><span class="badge badge-completed">${escHtml(t.category)}</span></td>
        <td class="${pos ? 'amt-pos' : 'amt-neg'}">${fmtCurrency(t.amount)}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }

  html += '</div>'; // right column
  html += '</div>'; // grid-2

  el.innerHTML = html;
}

function openCalendarEventModal(e) {
  const body = `
    <div class="mf-grid">
      <div class="mf-item"><label>Date</label><span class="val">${fmtDate(e.start_datetime)}</span></div>
      <div class="mf-item"><label>Time</label><span class="val">${fmtTime(e.start_datetime)}${e.end_datetime ? ' – ' + fmtTime(e.end_datetime) : ''}</span></div>
      <div class="mf-item"><label>Tag</label><span class="val"><span class="badge badge-${e.tag}">${e.tag}</span></span></div>
      ${e.location ? `<div class="mf-item"><label>Location</label><span class="val">${escHtml(e.location)}</span></div>` : ''}
      ${e.description ? `<div class="mf-item mf-full"><label>Notes</label><span class="val">${escHtml(e.description)}</span></div>` : ''}
      ${e.attendees && e.attendees.length ? `<div class="mf-item mf-full"><label>Attendees</label><span class="val">${e.attendees.map(a => escHtml(a)).join(', ')}</span></div>` : ''}
    </div>`;
  openModal(e.tag, e.title, body);
}
