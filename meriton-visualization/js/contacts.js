/* ═══════════════════════════════════════════
   contacts.js — People directory, cards,
   detail modal with all available fields
═══════════════════════════════════════════ */

let allContacts = [];

function renderContacts(data) {
  allContacts = (data.contacts?.contacts || [])
    .sort((a, b) => {
      // Christine first, then alphabetically
      if (a.is_user) return -1;
      if (b.is_user) return 1;
      const na = (a.first_name + ' ' + a.last_name).toLowerCase();
      const nb = (b.first_name + ' ' + b.last_name).toLowerCase();
      return na.localeCompare(nb);
    });

  document.getElementById('contacts-search').addEventListener('input', e => {
    drawContacts(e.target.value.toLowerCase());
  });
  drawContacts('');
}

function drawContacts(search) {
  const filtered = allContacts.filter(c => {
    if (!search) return true;
    const fullName = (c.first_name + ' ' + c.last_name).toLowerCase();
    return fullName.includes(search)
      || (c.job || '').toLowerCase().includes(search)
      || (c.description || '').toLowerCase().includes(search)
      || (c.email || '').toLowerCase().includes(search)
      || (c.city_living || '').toLowerCase().includes(search);
  });

  document.getElementById('contacts-count').textContent =
    `${filtered.length} contact${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    document.getElementById('contacts-list').innerHTML = '<div class="empty-state">No contacts match your search.</div>';
    return;
  }

  let html = '<div class="contacts-grid">';
  filtered.forEach(c => {
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
    const initials = [c.first_name, c.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const desc = c.description ? c.description.slice(0, 100) + (c.description.length > 100 ? '…' : '') : '';

    html += `<div class="contact-card ${c.is_user ? 'is-user' : ''}"
      onclick='showContactModal(${JSON.stringify(c).replace(/'/g, "&#39;")})'>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;border-radius:50%;background:${c.is_user ? 'linear-gradient(135deg,var(--sky),var(--teal))' : 'var(--surface3)'};
          display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
          color:${c.is_user ? '#0f1829' : 'var(--text2)'};flex-shrink:0">
          ${escHtml(initials || '?')}
        </div>
        <div>
          <div class="contact-name">${escHtml(fullName)}</div>
          ${c.job ? `<div class="contact-job">${escHtml(c.job)}</div>` : ''}
        </div>
      </div>
      ${desc ? `<div class="contact-desc">${escHtml(desc)}</div>` : ''}
      <div class="contact-footer">
        ${c.phone ? `<div class="contact-detail">📞 ${escHtml(c.phone)}</div>` : ''}
        ${c.email ? `<div class="contact-detail">✉ ${escHtml(c.email)}</div>` : ''}
        ${c.city_living ? `<div class="contact-detail">📍 ${escHtml(c.city_living)}</div>` : ''}
        ${c.age ? `<div class="contact-detail">age ${c.age}</div>` : ''}
      </div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('contacts-list').innerHTML = html;
}

function showContactModal(c) {
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
  const fields = [
    { label: 'Job / Role',   val: c.job },
    { label: 'Status',       val: c.status },
    { label: 'Age',          val: c.age },
    { label: 'Nationality',  val: c.nationality },
    { label: 'City',         val: c.city_living },
    { label: 'Country',      val: c.country },
    { label: 'Phone',        val: c.phone },
    { label: 'Email',        val: c.email },
    { label: 'Address',      val: c.address },
  ].filter(f => f.val != null && f.val !== '');

  let grid = '<div class="mf-grid">';
  fields.forEach(f => {
    grid += `<div class="mf-item"><label>${escHtml(f.label)}</label><span class="val">${escHtml(String(f.val))}</span></div>`;
  });
  grid += '</div>';

  if (c.description) {
    grid += `<div class="mf-sep"></div>
      <div class="mf-item">
        <label style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);display:block;margin-bottom:6px">Notes</label>
        <div style="font-size:13px;color:var(--text2);line-height:1.6">${escHtml(c.description)}</div>
      </div>`;
  }

  const badge = c.is_user ? 'You' : (c.job ? c.job.split(',')[0] : 'Contact');
  openModal(badge, fullName, grid);
}
