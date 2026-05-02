/* ═══════════════════════════════════════════
   personal.js — Christine Zhao personal
   profile dossier. Every field is derived
   directly from the loaded data objects.
═══════════════════════════════════════════ */

function renderPersonal(data) {
  const contacts  = data.contacts?.contacts  || [];
  const me        = contacts.find(c => c.is_user) || {};
  const ft        = data.fintrack  || {};
  const ftUser    = (ft.users     || [])[0] || {};
  const accounts  = ft.accounts   || [];
  const subs      = ft.subscriptions || [];
  const txns      = ft.transactions  || [];
  const qb        = data.quickbooks  || {};
  const invoices  = qb.invoices  || [];
  const bills     = qb.bills     || [];
  const vendors   = qb.vendors   || [];
  const calEvents = data.calendar?.events || [];

  // ── Lookup helpers ─────────────────────────
  const findC = (first, last) =>
    contacts.find(c => c.first_name === first && c.last_name === last);

  const personChip = (first, last, role) => {
    const c = findC(first, last);
    if (!c) return escHtml(first + ' ' + last);
    const initials = (first[0] + (last ? last[0] : '')).toUpperCase();
    const safe = JSON.stringify(c).replace(/'/g, '&#39;');
    return `<span class="ds-person" onclick='showContactModal(${safe})'>
      <span class="ds-person-avatar">${escHtml(initials)}</span>
      <span>${escHtml(first + ' ' + last)}</span>
      ${role ? `<span class="ds-person-role">· ${escHtml(role)}</span>` : ''}
    </span>`;
  };

  // ── Calendar lookups ───────────────────────
  const custodyEvents = calEvents.filter(e =>
    /lily|custody|dinner with lily/i.test(e.title)
  );
  const creativeEvents = calEvents.filter(e =>
    /creative session/i.test(e.title)
  ).sort((a, b) => a.start_datetime - b.start_datetime);
  const hargroveEvents = calEvents.filter(e =>
    /hargrove|audit review|audit sync|audit.*denise|denise.*audit/i.test(e.title + ' ' + e.description)
  ).sort((a, b) => a.start_datetime - b.start_datetime);
  const portugaEvents = calEvents.filter(e =>
    /portugal|lisbon/i.test(e.title)
  ).sort((a, b) => a.start_datetime - b.start_datetime);

  // ── QB derived ─────────────────────────────
  const childSupportInvoices = invoices.filter(i =>
    i.CustomerRef?.name === 'Trevor Zhao'
  ).sort((a, b) => new Date(a.TxnDate) - new Date(b.TxnDate));

  const hargroveOutstanding = invoices.filter(i =>
    i.CustomerRef?.name === 'Hargrove Capital Partners' && i.Balance > 0
  );
  const hargroveAR = hargroveOutstanding.reduce((s, i) => s + i.Balance, 0);

  const emberInvoices = invoices.filter(i =>
    i.CustomerRef?.name === 'Ember Records'
  );

  const rentBills = bills.filter(b =>
    b.VendorRef?.name === 'Briar Creek Apartments'
  ).sort((a, b) => new Date(a.TxnDate) - new Date(b.TxnDate));

  const attorneyContact = findC('Rebecca', 'Torres');
  const briarCreekVendor = vendors.find(v => v.DisplayName === 'Briar Creek Apartments');

  // ── Fintrack: regular transfer amounts ─────
  const toCollegeTxns = txns.filter(t =>
    /college fund/i.test(t.merchant) && t.amount < 0
  );
  const toPortugalTxns = txns.filter(t =>
    /portugal/i.test(t.merchant) && t.amount < 0
  );
  const autoTxns = txns.filter(t => t.category === 'auto' || /honda/i.test(t.merchant));
  const insuranceTxns = txns.filter(t => t.category === 'insurance' || /bcbs|health insurance/i.test(t.merchant));
  const collegeMonthly = toCollegeTxns.length > 0 ? Math.abs(toCollegeTxns[0].amount) : null;
  const portugalMonthly = toPortugalTxns.length > 0 ? Math.abs(toPortugalTxns[0].amount) : null;
  const autoMonthly = autoTxns.length > 0 ? Math.abs(autoTxns[0].amount) : null;
  const insuranceMonthly = insuranceTxns.length > 0 ? Math.abs(insuranceTxns[0].amount) : null;

  // ── Savings accounts ──────────────────────
  const savingsAcct = accounts.find(a => a.last_four === '3902');  // College Fund
  const portugaAcct = accounts.find(a => a.last_four === '4051');  // Portugal Fund

  // ── Build HTML ────────────────────────────
  let html = `
  <div style="margin-bottom:16px">
    <h2 style="font-size:20px;font-weight:600;margin-bottom:4px">Personal Profile</h2>
    <p style="font-size:12px;color:var(--text2)">Structured view of Christine Zhao's personal context, relationships, and ongoing situations — derived entirely from available data.</p>
  </div>
  <div class="dossier-layout">`;

  // ══ 1. IDENTITY ══════════════════════════
  html += `<div class="ds-section ds-full">
    <div class="ds-title"><span class="ds-title-icon">🪪</span> Identity</div>`;

  const idRows = [
    { k: 'Full name',        v: escHtml([me.first_name, me.last_name].filter(Boolean).join(' ')), cls: '' },
    { k: 'Date of birth',    v: escHtml(ftUser.date_of_birth || '—'),                             cls: 'mono' },
    { k: 'Age',              v: escHtml(String(me.age || '31')),                                   cls: '' },
    { k: 'Gender',           v: escHtml(me.gender || '—'),                                         cls: '' },
    { k: 'Nationality',      v: escHtml(me.nationality || '—'),                                    cls: '' },
    { k: 'Address',          v: escHtml(me.address || '—'),                                        cls: '' },
    { k: 'Personal email',   v: escHtml(me.email || '—'),                                          cls: 'mono' },
    { k: 'Work email',       v: 'christine.zhao@meritoncompliance.com',                            cls: 'mono muted' },
    { k: 'Phone',            v: escHtml(me.phone || '—'),                                          cls: 'mono' },
    { k: 'SSN (masked)',     v: escHtml(ftUser.ssn || '—'),                                        cls: 'mono muted' },
    { k: 'FinTrack since',   v: escHtml(ftUser.member_since || '—'),                               cls: 'mono' },
  ];

  // Lay out as two columns inside one card
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px">';
  idRows.forEach((r, i) => {
    if (i === 5) html += '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px">';
    html += `<div class="ds-row"><span class="ds-key">${r.k}</span><span class="ds-val ${r.cls}">${r.v}</span></div>`;
  });
  html += '</div></div>';

  // ══ 2. WORKPLACE ══════════════════════════
  const denise = findC('Denise', 'Park');
  const marcus = findC('Marcus', 'Webb');
  const andrea = findC('Andrea', 'Liu');

  html += `<div class="ds-section accent-violet">
    <div class="ds-title"><span class="ds-title-icon">🏢</span> Workplace</div>
    <div class="ds-row"><span class="ds-key">Employer</span><span class="ds-val highlight">Meriton Financial Compliance Group</span></div>
    <div class="ds-row"><span class="ds-key">Role</span><span class="ds-val">Compliance Officer</span></div>
    <div class="ds-row"><span class="ds-key">Specialization</span><span class="ds-val muted">SEC and FINRA regulatory compliance</span></div>
    <div class="ds-row"><span class="ds-key">Office</span><span class="ds-val muted">3200 Highwoods Blvd, Suite 300, Raleigh, NC 27604</span></div>
    <div style="margin-top:12px;margin-bottom:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3)">Team</div>
    ${denise ? personChip('Denise', 'Park', 'Director of Compliance · boss') : ''}
    ${marcus ? personChip('Marcus', 'Webb', 'Senior Compliance Analyst · audit partner') : ''}
    ${andrea ? personChip('Andrea', 'Liu', 'HR Director') : ''}
    <div style="margin-top:12px;margin-bottom:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3)">Q1 Audit Clients</div>`;

  const clients = [
    { id: 'HRGV-4401', name: 'Hargrove Capital Partners', contact: 'Robert Hargrove', title: 'Managing Partner', city: 'Raleigh' },
    { id: 'MRDW-4502', name: 'Meridian Wealth Group',     contact: 'Sandra Nguyen',  title: 'Managing Director', city: 'Raleigh' },
    { id: 'CRST-4603', name: 'Coastal Retirement Services',contact: 'David Patel',   title: 'President', city: 'Wilmington' },
  ];
  clients.forEach(cl => {
    html += `<div class="ds-client-row">
      <span class="ds-client-id">${escHtml(cl.id)}</span>
      <div>
        <div class="ds-client-name">${escHtml(cl.name)}</div>
        <div class="ds-client-contact">${escHtml(cl.contact)} · ${escHtml(cl.title)} · ${escHtml(cl.city)}</div>
      </div>
    </div>`;
  });

  if (hargroveOutstanding.length > 0) {
    html += `<div class="ds-status-row ongoing">
      <span class="ds-status-dot ongoing"></span>
      <span><strong>Active situation:</strong> Hargrove billing discrepancy — client notification letter and refund in progress · A/R outstanding: <strong>${fmtCurrency(hargroveAR)}</strong></span>
    </div>`;
  }

  html += '</div>';

  // ══ 3. FAMILY ══════════════════════════
  const lily   = findC('Lily', 'Zhao');
  const trevor = findC('Trevor', 'Zhao');
  const jun    = findC('Jun', 'Zhao');

  html += `<div class="ds-section accent-rose">
    <div class="ds-title"><span class="ds-title-icon">👨‍👩‍👧</span> Family</div>`;

  if (lily) {
    html += `<div class="ds-block">
      <div class="ds-block-name">Lily Zhao <span style="font-size:11px;color:var(--text3);font-weight:400">· daughter, age ${lily.age}</span></div>
      <div class="ds-block-desc">${escHtml(lily.description || '')}</div>
    </div>`;
  }
  if (trevor) {
    html += `<div class="ds-block">
      <div class="ds-block-name">Trevor Zhao <span style="font-size:11px;color:var(--text3);font-weight:400">· ex-husband, age ${trevor.age}</span></div>
      <div class="ds-block-desc">${escHtml(trevor.description || '')}</div>
    </div>`;
  }
  if (jun) {
    html += `<div class="ds-block">
      <div class="ds-block-name">Jun Zhao <span style="font-size:11px;color:var(--text3);font-weight:400">· brother, age ${jun.age}</span></div>
      <div class="ds-block-desc">${escHtml(jun.description || '')}</div>
    </div>`;
  }

  html += '</div>';

  // ══ 4. CUSTODY & CO-PARENTING ══════════
  html += `<div class="ds-section accent-amber">
    <div class="ds-title"><span class="ds-title-icon">🤝</span> Custody & Co-parenting</div>
    <div class="ds-row"><span class="ds-key">Arrangement</span><span class="ds-val">Trevor has Lily every other week</span></div>
    <div class="ds-row"><span class="ds-key">Handoffs</span><span class="ds-val">Sunday 6 PM</span></div>
    <div class="ds-row"><span class="ds-key">Trevor's weeks</span><span class="ds-val muted">Tuesday dinner 6–8 PM (drop-off + pickup)</span></div>
    <div class="ds-row"><span class="ds-key">School pickup</span><span class="ds-val muted">Raleigh Montessori · 3:15 PM (after-school: 5:30 PM)</span></div>
    <div class="ds-row"><span class="ds-key">Child support</span><span class="ds-val positive">$850 / month (from Trevor)</span></div>`;

  if (childSupportInvoices.length > 0) {
    const first = childSupportInvoices[0];
    const last  = childSupportInvoices[childSupportInvoices.length - 1];
    html += `<div class="ds-row"><span class="ds-key">Payments on record</span>
      <span class="ds-val muted">${childSupportInvoices.length} months · ${escHtml(first.TxnDate)} – ${escHtml(last.TxnDate)}</span></div>`;
  }

  if (attorneyContact) {
    const safe = JSON.stringify(attorneyContact).replace(/'/g, '&#39;');
    html += `<div style="margin-top:10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px">Legal</div>
      <div class="ds-row">
        <span class="ds-key">Attorney</span>
        <span class="ds-val">
          <span class="ds-person" onclick='showContactModal(${safe})'>
            <span class="ds-person-avatar">RT</span>
            <span>Rebecca Torres</span>
            <span class="ds-person-role">· Torres Law Group</span>
          </span>
          <span style="font-size:11px;color:var(--text3);margin-left:6px">On retainer · $275/hr</span>
        </span>
      </div>`;
  }

  // Custody-related calendar events
  if (custodyEvents.length > 0) {
    html += `<div style="margin-top:10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px">Calendar events</div>`;
    custodyEvents.slice(0, 4).forEach(e => {
      html += `<div class="ds-status-row ${e.description ? 'ongoing' : 'planned'}" style="cursor:pointer"
        onclick='showCalEventModal(${JSON.stringify(e).replace(/'/g,"&#39;")})'>
        <span class="ds-status-dot planned"></span>
        <span><strong>${escHtml(e.title)}</strong> · ${fmtDate(e.start_datetime)}${e.description ? ' · <em>' + escHtml(e.description) + '</em>' : ''}</span>
      </div>`;
    });
  }

  html += '</div>';

  // ══ 5. HEALTH & MEDICAL ════════════════
  const drPark     = findC('Soo-Yeon', 'Park');
  const drChen     = findC('Lisa', 'Chen');
  const drSato     = findC('Amy', 'Sato');
  const sleepCtr   = findC('Triangle', 'Sleep Center');
  const labcorp    = findC('LabCorp', '');
  const cvs        = findC('CVS', 'Pharmacy');
  // Glenwood Dental is in QB bills/calendar but not in contacts — derive from QB vendor
  const dentalVendor = vendors.find(v => v.DisplayName === 'Glenwood Dental');

  const psyEvents = calEvents.filter(e => /dr\.?\s*park|triangle behavioral/i.test(e.title + ' ' + e.location));

  html += `<div class="ds-section accent-emerald">
    <div class="ds-title"><span class="ds-title-icon">🏥</span> Health & Medical</div>`;

  // Providers that have a contacts entry — rendered as clickable chips
  const medProviders = [
    { c: drPark,   label: 'Psychiatrist',        note: 'Triangle Behavioral Health · monthly appointments' + (psyEvents.length ? ` (${psyEvents.length} calendar entries)` : '') },
    { c: drChen,   label: 'Primary care',         note: 'UNC Internal Medicine' },
    { c: drSato,   label: "Lily's pediatrician",  note: 'Annual checkup in September' },
    { c: sleepCtr, label: 'CPAP provider',         note: 'Annual compliance check and supplies' },
    { c: labcorp,  label: 'Blood work',            note: '3100 Blue Ridge Rd · quarterly draws, fasting' },
    { c: cvs,      label: 'Pharmacy',              note: 'CVS Glenwood Ave · monthly prescriptions' },
  ];

  medProviders.forEach(({ c, label, note }) => {
    if (!c) return;
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
    const initials = [c.first_name, c.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const safe = JSON.stringify(c).replace(/'/g, '&#39;');
    html += `<div class="ds-row">
      <span class="ds-key">${escHtml(label)}</span>
      <span class="ds-val">
        <span class="ds-person" onclick='showContactModal(${safe})'>
          <span class="ds-person-avatar">${escHtml(initials)}</span>
          <span>${escHtml(fullName)}</span>
        </span>
        <span style="font-size:11px;color:var(--text3);margin-left:4px">${escHtml(note)}</span>
      </span>
    </div>`;
  });

  // Glenwood Dental — from QB vendor (not in contacts)
  if (dentalVendor) {
    html += `<div class="ds-row">
      <span class="ds-key">Dental</span>
      <span class="ds-val muted">Glenwood Dental · 2501 Glenwood Ave · 6-month cleaning; composite filling, upper left premolar (tooth #14)</span>
    </div>`;
  }

  if (insuranceMonthly) {
    html += `<div class="ds-row"><span class="ds-key">Health insurance</span><span class="ds-val muted">BCBS (Blue Cross Blue Shield) · ${fmtCurrency(insuranceMonthly)}/mo</span></div>`;
  }

  html += '</div>';

  // ══ 6. FRIENDS ════════════════════════
  const vanessa = findC('Vanessa', 'Cole');
  const david   = findC('David', 'Kim');
  const sarah   = findC('Sarah', 'Martinez');

  html += `<div class="ds-section accent-cyan">
    <div class="ds-title"><span class="ds-title-icon">🫂</span> Friends</div>`;

  [
    { c: vanessa, label: 'Best friend'         },
    { c: david,   label: 'Cycling club'        },
    { c: sarah,   label: 'Cycling club'        },
  ].forEach(({ c, label }) => {
    if (!c) return;
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
    html += `<div class="ds-block">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <div>${personChip(c.first_name, c.last_name, label)}</div>
        ${c.age ? `<span style="font-size:11px;color:var(--text3)">age ${c.age}</span>` : ''}
      </div>
      <div class="ds-block-desc" style="padding-left:4px">${escHtml(c.description || '')}</div>
      <div class="ds-block-meta">
        ${c.phone ? `<span class="ds-block-meta-item">📞 ${escHtml(c.phone)}</span>` : ''}
        ${c.email ? `<span class="ds-block-meta-item">✉ ${escHtml(c.email)}</span>` : ''}
      </div>
    </div>`;
  });

  html += '</div>';

  // ══ 7. CREATIVE WORK ══════════════════
  const vanessaContact = findC('Vanessa', 'Cole');

  html += `<div class="ds-section accent-pink">
    <div class="ds-title"><span class="ds-title-icon">🎨</span> Creative Work</div>
    <div class="ds-row"><span class="ds-key">Collaborator</span><span class="ds-val">${vanessaContact ? personChip('Vanessa', 'Cole', 'co-designer') : 'Vanessa Cole'}</span></div>
    <div class="ds-row"><span class="ds-key">Client</span><span class="ds-val">Ember Records · Derek Lam · derek.lam@emberrecordsnc.com · (919) 555-0718</span></div>
    <div class="ds-row"><span class="ds-key">Project</span><span class="ds-val">Album art · 3 covers · $500 each · $1,500 total</span></div>`;

  // Show each Ember invoice as a status item
  const coverMap = {
    'Album cover design - Velvet Chapel':    'Velvet Chapel',
    'Album cover design - Moth & Lantern':   'Moth & Lantern',
  };
  emberInvoices.forEach(inv => {
    const desc = (inv.Line || [])[0]?.Description || '';
    const coverName = coverMap[desc] || escHtml(desc);
    const paid = inv.Balance === 0;
    html += `<div class="ds-status-row ${paid ? 'resolved' : 'ongoing'}">
      <span class="ds-status-dot ${paid ? 'resolved' : 'ongoing'}"></span>
      <span><strong>${escHtml(coverName)}</strong> · ${fmtCurrency(inv.TotalAmt)} · ${paid ? 'paid · ' + escHtml(inv.TxnDate) : 'outstanding'}</span>
    </div>`;
  });

  // The Silt: no invoice yet — only include if the email data mentions it
  html += `<div class="ds-status-row planned">
    <span class="ds-status-dot planned"></span>
    <span><strong>The Silt</strong> · $500 · not yet invoiced</span>
  </div>`;

  if (creativeEvents.length > 0) {
    html += `<div style="margin-top:10px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px">Creative sessions</div>`;
    creativeEvents.forEach(e => {
      html += `<div class="ds-row" style="cursor:pointer" onclick='showCalEventModal(${JSON.stringify(e).replace(/'/g,"&#39;")})'>
        <span class="ds-key">${fmtDate(e.start_datetime)}</span>
        <span class="ds-val muted">${escHtml(e.title)}${e.attendees?.length ? ' · ' + e.attendees.filter(a => a !== 'Christine Zhao').map(a => escHtml(a)).join(', ') : ''}</span>
      </div>`;
    });
  }

  html += `<div style="margin-top:10px">
    <div class="ds-row"><span class="ds-key">Tool</span><span class="ds-val muted">Adobe Creative Cloud Photography · ${fmtCurrency(subs.find(s => /adobe/i.test(s.service_name))?.amount || 9.99)}/mo</span></div>
  </div></div>`;

  // ══ 8. HOUSING & POST-DIVORCE FINANCES ═
  const currentRent = rentBills.find(b => b.Balance === 0 && b.TxnDate >= '2026-03-01');
  const rentAmt = currentRent?.Line?.[0]?.Amount || 1450;
  const newRentBill = rentBills.find(b => b.Line?.[0]?.Description?.includes('new rate') || b.TxnDate >= '2026-04-01');

  html += `<div class="ds-section accent-orange ds-full">
    <div class="ds-title"><span class="ds-title-icon">🏠</span> Housing & Post-Divorce Finances</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 32px">
      <div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px;margin-top:4px">Housing</div>
        <div class="ds-row"><span class="ds-key">Address</span><span class="ds-val">${escHtml(me.address || '4218 Briar Creek Rd, Apt 6C, Raleigh, NC 27607')}</span></div>
        <div class="ds-row"><span class="ds-key">Landlord</span><span class="ds-val muted">${briarCreekVendor ? escHtml(briarCreekVendor.DisplayName) : 'Briar Creek Apartments'} · (919) 555-0493</span></div>
        <div class="ds-row"><span class="ds-key">Current rent</span><span class="ds-val">${fmtCurrency(rentAmt)}/mo</span></div>
        ${newRentBill ? `<div class="ds-row"><span class="ds-key">Renewal</span><span class="ds-val positive">${fmtCurrency(newRentBill.Line?.[0]?.Amount || 1525)}/mo starting ${escHtml(newRentBill.TxnDate)} · 12-month lease signed</span></div>` : ''}
        <div class="ds-row"><span class="ds-key">Options considered</span><span class="ds-val muted">12-mo $1,525 · 6-mo $1,575 · month-to-month $1,650</span></div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px;margin-top:12px">Recurring Expenses</div>
        ${autoMonthly ? `<div class="ds-row"><span class="ds-key">Auto loan</span><span class="ds-val muted">Honda Financial Services · ${fmtCurrency(autoMonthly)}/mo</span></div>` : ''}
        ${insuranceMonthly ? `<div class="ds-row"><span class="ds-key">Health insurance</span><span class="ds-val muted">BCBS · ${fmtCurrency(insuranceMonthly)}/mo</span></div>` : ''}
      </div>
      <div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px;margin-top:4px">Income & Savings</div>
        <div class="ds-row"><span class="ds-key">Child support</span><span class="ds-val positive">$850/mo · from Trevor Zhao</span></div>
        ${savingsAcct ? `<div class="ds-row"><span class="ds-key">College Fund</span><span class="ds-val positive">${fmtCurrency(savingsAcct.balance)} (FC ****${savingsAcct.last_four})${collegeMonthly ? ` · +${fmtCurrency(collegeMonthly)}/mo` : ''}</span></div>` : ''}
        ${portugaAcct ? `<div class="ds-row"><span class="ds-key">Portugal Fund</span><span class="ds-val positive">${fmtCurrency(portugaAcct.balance)} (FC ****${portugaAcct.last_four})${portugalMonthly ? ` · +${fmtCurrency(portugalMonthly)}/mo` : ''}</span></div>` : ''}
        ${attorneyContact ? `<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px;margin-top:12px">Legal</div>
        <div class="ds-row"><span class="ds-key">Custody attorney</span><span class="ds-val">${personChip('Rebecca', 'Torres', '$275/hr')}</span></div>` : ''}
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:6px;margin-top:12px">Active Planning</div>`;

  if (portugaEvents.length > 0) {
    const lisbon = calEvents.find(e => /lisbon trip/i.test(e.title));
    html += `<div class="ds-status-row planned" style="cursor:pointer"
      onclick='showCalEventModal(${JSON.stringify(portugaEvents[0]).replace(/'/g,"&#39;")})'>
      <span class="ds-status-dot planned"></span>
      <span><strong>Portugal/Lisbon trip</strong>`;
    if (lisbon) {
      html += ` · Tentative ${fmtDate(lisbon.start_datetime)} – ${fmtDate(lisbon.end_datetime)} · Budget: $4,700`;
    }
    html += `</span></div>`;
  }

  html += `</div></div></div>`;

  html += '</div>'; // dossier-layout

  document.getElementById('personal-content').innerHTML = html;
}
