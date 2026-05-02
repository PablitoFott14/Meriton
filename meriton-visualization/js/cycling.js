/* ═══════════════════════════════════════════
   cycling.js — Strava activities, athlete
   profiles, club, activity detail modal
═══════════════════════════════════════════ */

function renderCycling(data) {
  const strava   = data.strava || {};
  const athletes = strava.athletes || [];
  const allActs  = strava.activities || [];
  const clubs    = strava.clubs || [];
  const memberships = strava.club_memberships || [];

  const me = athletes.find(a => a.is_user);
  const myId = me?.user_id;

  const myActs = allActs
    .filter(a => a.user_id === myId)
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  const othersActs = allActs.filter(a => a.user_id !== myId);

  // ── Stats ──────────────────────────────────
  const totalDist   = myActs.reduce((s, a) => s + (a.distance || 0), 0);
  const totalElev   = myActs.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
  const totalCal    = myActs.reduce((s, a) => s + (a.calories || 0), 0);
  const totalTime   = myActs.reduce((s, a) => s + (a.moving_time || 0), 0);
  const totalKJ     = myActs.reduce((s, a) => s + (a.kilojoules || 0), 0);
  const avgPower    = myActs.filter(a => a.average_watts).length > 0
    ? myActs.filter(a => a.average_watts).reduce((s, a) => s + a.average_watts, 0) / myActs.filter(a => a.average_watts).length
    : 0;
  const longestDist = Math.max(...myActs.map(a => a.distance || 0));
  const lateNight   = myActs.filter(a => {
    const h = new Date(a.start_date).getUTCHours();
    return h >= 22 || h < 5;
  }).length;

  let html = '';

  // ── Aggregate stats ────────────────────────
  html += '<div class="cycling-stats">';
  const stats = [
    { val: myActs.length, unit: '', label: 'Total Rides' },
    { val: (totalDist / 1000).toFixed(0), unit: 'km', label: 'Total Distance' },
    { val: totalElev.toFixed(0), unit: 'm', label: 'Total Elevation' },
    { val: totalCal.toLocaleString(), unit: 'kcal', label: 'Total Calories' },
    { val: Math.floor(totalTime / 3600) + 'h ' + Math.floor((totalTime % 3600) / 60) + 'm', unit: '', label: 'Moving Time' },
    { val: (longestDist / 1000).toFixed(1), unit: 'km', label: 'Longest Ride' },
    { val: me?.ftp || '—', unit: 'W', label: 'FTP' },
    { val: lateNight, unit: '', label: 'Night Rides' },
  ];
  stats.forEach(s => {
    html += `<div class="stat-tile">
      <div class="stat-value">${s.val}<span class="stat-unit">${s.unit}</span></div>
      <div class="stat-label">${s.label}</div>
    </div>`;
  });
  html += '</div>';

  // ── Athletes + Club ────────────────────────
  html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px">';

  // Athlete cards
  html += '<div style="flex:2;min-width:280px">';
  html += '<div class="section-label" style="margin-bottom:10px">Athletes</div>';
  html += '<div class="athlete-cards">';
  athletes.forEach(a => {
    html += `<div class="athlete-card ${a.is_user ? 'is-user' : ''}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="width:32px;height:32px;border-radius:50%;
          background:${a.is_user ? 'linear-gradient(135deg,var(--sky),var(--teal))' : 'var(--surface3)'};
          display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
          color:${a.is_user ? '#0f1829' : 'var(--text2)'}">
          ${escHtml((a.firstname[0] + a.lastname[0]).toUpperCase())}
        </div>
        <div>
          <div class="athlete-name">${escHtml(a.firstname)} ${escHtml(a.lastname)}${a.is_user ? ' <span style="font-size:10px;color:var(--sky)">(you)</span>' : ''}</div>
          <div class="athlete-meta">${escHtml(a.city)}, ${escHtml(a.state)}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text3)">
        ${a.weight ? `${a.weight} kg · ` : ''}${a.premium ? '⭐ Premium' : 'Free'}
        · Joined ${new Date(a.created_at).getFullYear()}
      </div>
      ${a.ftp ? `<div class="athlete-ftp">FTP: ${a.ftp} W</div>` : ''}
      <div style="margin-top:6px;font-size:12px;color:var(--text2)">
        ${allActs.filter(ac => ac.user_id === a.user_id).length} rides in data
      </div>
    </div>`;
  });
  html += '</div></div>';

  // Club card
  if (clubs.length > 0) {
    const club = clubs[0];
    html += '<div style="flex:1;min-width:200px">';
    html += '<div class="section-label" style="margin-bottom:10px">Club</div>';
    html += `<div class="card">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px">${escHtml(club.name)}</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${escHtml(club.city)}, ${escHtml(club.state)}</div>
      <div style="font-size:13px;color:var(--emerald);font-weight:600">${club.member_count} members</div>
      ${memberships.length ? `<div style="font-size:11px;color:var(--text3);margin-top:6px">Joined ${new Date(memberships[0].joined_at).toLocaleDateString('en-US',{month:'short',year:'numeric'})}</div>` : ''}
    </div>`;
    html += '</div>';
  }

  html += '</div>';

  // ── Activity table ─────────────────────────
  html += '<div class="section-label" style="margin-bottom:10px">Activity Log — My Rides</div>';
  html += '<div class="table-wrap"><table><thead><tr>'
    + '<th>Date</th><th>Name</th><th>Distance</th><th>Time</th><th>Speed</th>'
    + '<th>Power</th><th>Elevation</th><th>HR</th><th>Suffer</th><th>Kudos</th>'
    + '</tr></thead><tbody>';

  myActs.forEach(a => {
    const d = new Date(a.start_date_local || a.start_date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    const isLate = (() => { const h = new Date(a.start_date).getUTCHours(); return h >= 22 || h < 5; })();

    html += `<tr onclick='showActivityModal(${JSON.stringify(a).replace(/'/g, "&#39;")})'>
      <td class="mono">${escHtml(dateStr)}${isLate ? ' <span title="Night ride" style="color:var(--violet)">🌙</span>' : ''}</td>
      <td>${escHtml(a.name)}${a.description ? ` <span style="color:var(--text3);font-size:11px">— ${escHtml(a.description.slice(0,40))}</span>` : ''}</td>
      <td class="mono">${fmtDistance(a.distance)}</td>
      <td class="mono dim">${fmtDuration(a.moving_time)}</td>
      <td class="mono dim">${fmtSpeed(a.average_speed)}</td>
      <td class="mono ${a.average_watts ? '' : 'dim'}">${a.average_watts ? a.average_watts + ' W' : '—'}</td>
      <td class="mono dim">${a.total_elevation_gain ? a.total_elevation_gain + ' m' : '—'}</td>
      <td class="mono dim">${a.average_heartrate ? a.average_heartrate + ' bpm' : '—'}</td>
      <td class="mono" style="color:${sufferColor(a.suffer_score)}">${a.suffer_score ?? '—'}</td>
      <td class="dim">${a.kudos_count ?? 0}</td>
    </tr>`;
  });

  if (othersActs.length > 0) {
    html += `<tr style="background:var(--surface2)"><td colspan="10" style="padding:8px 12px;font-size:11px;color:var(--text3);font-style:italic">
      ${othersActs.length} ride${othersActs.length !== 1 ? 's' : ''} from other athletes (Marcus Webb, Jun Zhao) not shown — use contact filter or see athletes above
    </td></tr>`;
  }

  html += '</tbody></table></div>';

  document.getElementById('cycling-content').innerHTML = html;
}

function sufferColor(score) {
  if (!score) return 'var(--text3)';
  if (score >= 80) return 'var(--rose)';
  if (score >= 55) return 'var(--amber)';
  return 'var(--emerald)';
}

function showActivityModal(a) {
  const d = new Date(a.start_date_local || a.start_date);
  const body = `
    <div class="mf-grid">
      <div class="mf-item"><label>Date</label><span class="val">${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</span></div>
      <div class="mf-item"><label>Local Start</label><span class="val">${escHtml(a.start_date_local?.replace('T',' ') || '—')}</span></div>
      <div class="mf-item"><label>Distance</label><span class="val" style="color:var(--sky)">${fmtDistance(a.distance)}</span></div>
      <div class="mf-item"><label>Moving Time</label><span class="val">${fmtDuration(a.moving_time)}</span></div>
      <div class="mf-item"><label>Avg Speed</label><span class="val">${fmtSpeed(a.average_speed)}</span></div>
      <div class="mf-item"><label>Max Speed</label><span class="val">${fmtSpeed(a.max_speed)}</span></div>
      <div class="mf-item"><label>Elevation Gain</label><span class="val">${a.total_elevation_gain} m</span></div>
      <div class="mf-item"><label>Elev Range</label><span class="val">${a.elev_low} – ${a.elev_high} m</span></div>
      ${a.average_watts != null ? `<div class="mf-item"><label>Avg Power</label><span class="val">${a.average_watts} W</span></div>` : ''}
      ${a.weighted_average_watts != null ? `<div class="mf-item"><label>Norm Power</label><span class="val">${a.weighted_average_watts} W</span></div>` : ''}
      ${a.max_watts != null ? `<div class="mf-item"><label>Max Power</label><span class="val">${a.max_watts} W</span></div>` : ''}
      ${a.kilojoules != null ? `<div class="mf-item"><label>Kilojoules</label><span class="val">${a.kilojoules} kJ</span></div>` : ''}
      ${a.average_cadence != null ? `<div class="mf-item"><label>Avg Cadence</label><span class="val">${a.average_cadence} rpm</span></div>` : ''}
      ${a.average_heartrate != null ? `<div class="mf-item"><label>Avg HR</label><span class="val">${a.average_heartrate} bpm</span></div>` : ''}
      ${a.max_heartrate != null ? `<div class="mf-item"><label>Max HR</label><span class="val">${a.max_heartrate} bpm</span></div>` : ''}
      <div class="mf-item"><label>Calories</label><span class="val">${a.calories}</span></div>
      <div class="mf-item"><label>Suffer Score</label><span class="val" style="color:${sufferColor(a.suffer_score)}">${a.suffer_score ?? '—'}</span></div>
      <div class="mf-item"><label>Kudos</label><span class="val">${a.kudos_count}</span></div>
      <div class="mf-item"><label>Device</label><span class="val">${escHtml(a.device_name || '—')}</span></div>
      ${a.description ? `<div class="mf-item mf-full"><label>Note</label><span class="val" style="font-style:italic">"${escHtml(a.description)}"</span></div>` : ''}
    </div>`;
  openModal('Ride', a.name, body);
}
