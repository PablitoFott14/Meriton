/* ═══════════════════════════════════════════
   entertainment.js — Ticketmaster orders
   + Sonos speakers, favorites, queue
═══════════════════════════════════════════ */

function renderEntertainment(data) {
  const el = document.getElementById('entertainment-content');

  const tm    = data.ticketmaster || {};
  const sonos = data.sonos || {};

  let html = '';

  // ══ TICKETMASTER ══════════════════════════
  const orders      = tm.orders      || [];
  const events      = tm.events      || [];
  const venues      = tm.venues      || [];
  const attractions = tm.attractions || [];
  const evtAttr     = tm.event_attractions || [];
  const ticketTypes = tm.ticket_types || [];

  const evtMap   = Object.fromEntries(events.map(e => [e.id, e]));
  const venuMap  = Object.fromEntries(venues.map(v => [v.id, v]));
  const attrMap  = Object.fromEntries(attractions.map(a => [a.id, a]));
  const ttMap    = Object.fromEntries(ticketTypes.map(t => [t.id, t]));

  const totalSpent = orders.reduce((s, o) => s + (o.total_price || 0), 0);

  html += `<div style="margin-bottom:24px">
    <div class="fin-section-header" style="margin-bottom:14px">
      <div class="fin-section-title">Ticketmaster — ${orders.length} Orders</div>
      <div class="fin-section-total" style="color:var(--sky)">Total ${fmtCurrency(totalSpent)}</div>
    </div>
    <div class="tm-orders">`;

  // Sort by event date
  const sortedOrders = [...orders].sort((a, b) => {
    const ea = evtMap[a.event_id]; const eb = evtMap[b.event_id];
    return new Date(eb?.date || 0) - new Date(ea?.date || 0);
  });

  sortedOrders.forEach(o => {
    const evt  = evtMap[o.event_id] || {};
    const venu = venuMap[evt.venue_id] || {};
    const tt   = ttMap[o.ticket_type_id] || {};

    // Attractions for this event
    const attrIds = evtAttr.filter(ea => ea.event_id === o.event_id);
    const headliner = attrIds.find(ea => ea.billing === 'headline');
    const supports  = attrIds.filter(ea => ea.billing !== 'headline');
    const headArt   = headliner ? attrMap[headliner.attraction_id] : null;
    const supportNames = supports.map(s => attrMap[s.attraction_id]?.name).filter(Boolean);

    const segBadge = evt.segment === 'Music' ? 'badge-music' : evt.segment === 'Sports' ? 'badge-sports' : 'badge-shopping';

    html += `<div class="tm-order" onclick='showOrderModal(
      ${JSON.stringify(o).replace(/'/g,"&#39;")},
      ${JSON.stringify(evt).replace(/'/g,"&#39;")},
      ${JSON.stringify(venu).replace(/'/g,"&#39;")},
      ${JSON.stringify(tt).replace(/'/g,"&#39;")},
      ${JSON.stringify(headArt).replace(/'/g,"&#39;")},
      ${JSON.stringify(supportNames).replace(/'/g,"&#39;")}
    )'>
      <div class="tm-order-header">
        <div>
          <div class="tm-event-name">${escHtml(evt.name || '—')}</div>
          <div class="tm-event-meta">
            ${evt.date ? fmtISODate(evt.date) + (evt.time ? ' · ' + fmtTimeStr(evt.time) : '') : ''}
            ${venu.name ? ' · ' + escHtml(venu.name) : ''}
            ${venu.city ? ', ' + escHtml(venu.city) : ''}
          </div>
          ${headArt ? `<div style="font-size:12px;color:var(--text2);margin-top:3px">${escHtml(headArt.name)}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="tm-price">${fmtCurrency(o.total_price)}</div>
          <div style="font-size:11px;color:var(--text3)">${o.quantity} ticket${o.quantity !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="tm-order-footer">
        <span class="badge ${segBadge}">${escHtml(evt.segment || '—')}</span>
        <span class="badge badge-${evt.status === 'completed' ? 'completed' : 'onsale'}">${escHtml(evt.status || '—')}</span>
        ${tt.name ? `<span class="tm-detail">${escHtml(tt.name)}${tt.section ? ' · ' + escHtml(tt.section) : ''}</span>` : ''}
        <span class="tm-detail">Conf: ${escHtml(o.confirmation_code)}</span>
        <span class="tm-detail">Purchased ${fmtDateShort(new Date(o.purchased_at).getTime() / 1000)}</span>
      </div>
    </div>`;
  });

  html += '</div></div>';

  // ══ SONOS ═════════════════════════════════
  const speakers    = sonos.speakers     || [];
  const favorites   = sonos.favorites    || [];
  const favTracks   = sonos.favorite_tracks || [];
  const queueItems  = sonos.queue_items  || [];

  html += `<div>
    <div class="fin-section-header" style="margin-bottom:14px">
      <div class="fin-section-title">Sonos System — ${speakers.length} Speakers</div>
    </div>`;

  // Speakers
  html += '<div class="sonos-speakers">';
  speakers.forEach(s => {
    const isPlaying = s.playback_state === 'PLAYING';
    html += `<div class="speaker-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div>
          <div class="speaker-room">${escHtml(s.room)}</div>
          <div class="speaker-model">${escHtml(s.model)} · v${escHtml(s.software_version)}</div>
        </div>
        <div class="vol-badge">🔊 Vol ${s.volume}${s.mute ? ' (muted)' : ''}</div>
      </div>
      ${isPlaying && s.now_playing_title ? `
        <div class="speaker-playing">
          <div class="sonos-playing-badge" style="margin-bottom:6px">▶ Playing</div>
          <div class="now-playing-track">${escHtml(s.now_playing_title)}</div>
          <div class="now-playing-artist">${escHtml(s.now_playing_artist)} · ${escHtml(s.now_playing_album)}</div>
          <div class="now-playing-source">via ${escHtml(s.now_playing_source)}</div>
        </div>` : `
        <div style="font-size:12px;color:var(--text3);padding:8px 0">Stopped</div>`}
    </div>`;
  });
  html += '</div>';

  // Favorites
  if (favorites.length > 0) {
    html += `<div style="margin-bottom:16px">
      <div class="section-label" style="margin-bottom:10px">Saved Favorites</div>
      <div class="favorites-grid">`;
    favorites.forEach(f => {
      const tracks = favTracks.filter(t => t.favorite_id === f.favorite_id);
      const typeIcon = f.type === 'podcast' ? '🎙' : '🎵';
      html += `<div class="fav-chip">
        <div class="fav-title">${typeIcon} ${escHtml(f.title)}</div>
        <div class="fav-meta">${escHtml(f.source)} · ${f.type}${tracks.length ? ` · ${tracks.length} tracks` : ''}</div>
      </div>`;
    });
    html += '</div></div>';
  }

  // Queue (Living Room speaker)
  const lrQueue = queueItems.filter(q => q.speaker_id === '1').sort((a, b) => a.position - b.position);
  if (lrQueue.length > 0) {
    html += `<div>
      <div class="section-label" style="margin-bottom:10px">Living Room Queue</div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Track</th><th>Artist</th><th>Album</th><th>Duration</th></tr></thead>
        <tbody>`;
    lrQueue.forEach(q => {
      html += `<tr>
        <td class="mono dim">${q.position + 1}</td>
        <td>${escHtml(q.title)}</td>
        <td class="dim">${escHtml(q.artist)}</td>
        <td class="dim">${escHtml(q.album)}</td>
        <td class="mono dim">${fmtDuration(q.duration_seconds)}</td>
      </tr>`;
    });
    html += '</tbody></table></div></div>';
  }

  html += '</div>';
  el.innerHTML = html;
}

function fmtTimeStr(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function showOrderModal(o, evt, venu, tt, headArt, supportNames) {
  const body = `
    <div class="mf-grid">
      <div class="mf-item"><label>Event</label><span class="val">${escHtml(evt.name)}</span></div>
      <div class="mf-item"><label>Date</label><span class="val">${fmtISODate(evt.date)}${evt.time ? ' · ' + fmtTimeStr(evt.time) : ''}</span></div>
      <div class="mf-item"><label>Venue</label><span class="val">${escHtml(venu.name || '—')}</span></div>
      <div class="mf-item"><label>Location</label><span class="val">${escHtml(venu.address || '')} ${escHtml(venu.city || '')} ${escHtml(venu.state || '')}</span></div>
      ${headArt ? `<div class="mf-item"><label>Headliner</label><span class="val">${escHtml(headArt.name)}</span></div>` : ''}
      ${supportNames.length ? `<div class="mf-item"><label>Support</label><span class="val">${supportNames.map(s => escHtml(s)).join(', ')}</span></div>` : ''}
      <div class="mf-item"><label>Genre</label><span class="val">${escHtml(evt.genre || '—')}${evt.sub_genre ? ' · ' + escHtml(evt.sub_genre) : ''}</span></div>
      <div class="mf-item"><label>Status</label><span class="val"><span class="badge badge-${evt.status === 'completed' ? 'completed' : 'onsale'}">${evt.status}</span></span></div>
    </div>
    <div class="mf-sep"></div>
    <div class="mf-grid">
      <div class="mf-item"><label>Ticket Type</label><span class="val">${escHtml(tt.name || '—')}</span></div>
      <div class="mf-item"><label>Section</label><span class="val">${escHtml(tt.section || '—')}</span></div>
      <div class="mf-item"><label>Quantity</label><span class="val">${o.quantity}</span></div>
      <div class="mf-item"><label>Subtotal</label><span class="val">${fmtCurrency(o.subtotal)}</span></div>
      <div class="mf-item"><label>Service Fee</label><span class="val">${fmtCurrency(o.service_fee)}</span></div>
      <div class="mf-item"><label>Processing Fee</label><span class="val">${fmtCurrency(o.order_processing_fee)}</span></div>
      <div class="mf-item"><label>Total</label><span class="val" style="color:var(--sky);font-size:16px;font-weight:700">${fmtCurrency(o.total_price)}</span></div>
      <div class="mf-item"><label>Confirmation</label><span class="val" style="font-family:var(--mono)">${escHtml(o.confirmation_code)}</span></div>
      <div class="mf-item"><label>Purchased</label><span class="val">${new Date(o.purchased_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}</span></div>
    </div>`;
  openModal(evt.segment || 'Order', evt.name || '—', body);
}
