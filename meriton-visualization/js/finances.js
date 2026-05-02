/* ═══════════════════════════════════════════
   finances.js — Accounts, Transactions,
   Subscriptions, QB Invoices, QB Bills
═══════════════════════════════════════════ */

let finTxns   = [];
let finTxPage = 1;
const FIN_PAGE_SIZE = 50;
let finTxFilter = { search: '', cat: '' };

function renderFinances(data) {
  const ft = data.fintrack  || {};
  const qb = data.quickbooks || {};

  renderFinAccounts(ft, qb);
  renderFinTransactions(ft);
  renderFinSubscriptions(ft);
  renderFinInvoices(qb);
  renderFinBills(qb);
}

// ── ACCOUNTS ─────────────────────────────────
function renderFinAccounts(ft, qb) {
  const accounts = ft.accounts || [];
  const netWorth = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  let html = `<div class="net-worth-bar">
    <div class="net-worth-label">Net Worth (all accounts)</div>
    <div class="net-worth-value">${fmtCurrency(netWorth)}</div>
  </div>`;

  html += '<div class="accounts-row">';
  const typeLabel = { checking: 'Checking', savings: 'Savings', brokerage: 'Brokerage', credit_card: 'Credit Card' };
  accounts.forEach(a => {
    const pos = a.balance >= 0;
    html += `<div class="account-card">
      <div class="account-inst">${escHtml(a.institution_name)}</div>
      <div class="account-type">${typeLabel[a.account_type] || a.account_type}</div>
      <div class="account-last4">····${escHtml(a.last_four)}</div>
      <div class="account-balance ${pos ? 'positive' : 'negative'}">${fmtCurrency(a.balance)}</div>
      <div style="margin-top:6px"><span class="badge badge-${a.status === 'active' ? 'active' : 'completed'}">${a.status}</span></div>
    </div>`;
  });
  html += '</div>';

  // QB bank accounts for reference
  const qbBanks = (qb.accounts || []).filter(a => a.AccountType === 'Bank' || a.AccountType === 'Credit Card');
  if (qbBanks.length > 0) {
    html += `<div style="margin-top:20px">
      <div class="fin-section-header">
        <div class="fin-section-title">QuickBooks Accounts</div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Account</th><th>Type</th><th>Subtype</th><th style="text-align:right">Balance</th>
        </tr></thead><tbody>`;
    (qb.accounts || []).forEach(a => {
      const pos = (a.CurrentBalance || 0) >= 0;
      html += `<tr>
        <td>${escHtml(a.Name)}</td>
        <td class="dim">${escHtml(a.AccountType)}</td>
        <td class="dim">${escHtml(a.AccountSubType || '—')}</td>
        <td class="${pos ? 'amt-pos' : 'amt-neg'}" style="text-align:right">${fmtCurrency(a.CurrentBalance)}</td>
      </tr>`;
    });
    html += '</tbody></table></div></div>';
  }

  document.getElementById('fin-accounts').innerHTML = html;
}

// ── TRANSACTIONS ─────────────────────────────
function renderFinTransactions(ft) {
  finTxns = (ft.transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const cats = [...new Set(finTxns.map(t => t.category).filter(Boolean))].sort();
  const catSelect = document.createElement('select');
  catSelect.className = 'ex-filter';
  catSelect.id = 'fin-tx-cat';
  catSelect.innerHTML = '<option value="">All Categories</option>';
  cats.forEach(c => {
    catSelect.innerHTML += `<option value="${escHtml(c)}">${escHtml(c)}</option>`;
  });

  const bar = document.createElement('div');
  bar.className = 'explorer-bar';
  bar.innerHTML = `
    <input id="fin-tx-search" class="ex-search" type="text" placeholder="Search merchant…" />
    <span class="ex-count" id="fin-tx-count"></span>
  `;
  bar.insertBefore(catSelect, bar.querySelector('#fin-tx-count'));

  const wrap = document.getElementById('fin-transactions');
  wrap.appendChild(bar);

  const tableWrap = document.createElement('div');
  tableWrap.id = 'fin-tx-table';
  wrap.appendChild(tableWrap);

  const pagWrap = document.createElement('div');
  pagWrap.id = 'fin-tx-pag';
  pagWrap.className = 'pagination';
  wrap.appendChild(pagWrap);

  bar.querySelector('#fin-tx-search').addEventListener('input', e => {
    finTxFilter.search = e.target.value.toLowerCase();
    finTxPage = 1;
    drawFinTxTable();
  });
  catSelect.addEventListener('change', e => {
    finTxFilter.cat = e.target.value;
    finTxPage = 1;
    drawFinTxTable();
  });

  drawFinTxTable();
}

function drawFinTxTable() {
  const filtered = finTxns.filter(t => {
    const s = finTxFilter.search;
    const matchSearch = !s || (t.merchant || '').toLowerCase().includes(s) || (t.category || '').toLowerCase().includes(s);
    const matchCat    = !finTxFilter.cat || t.category === finTxFilter.cat;
    return matchSearch && matchCat;
  });

  const countEl = document.getElementById('fin-tx-count');
  if (countEl) countEl.textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;

  const page = paginate(filtered, finTxPage, FIN_PAGE_SIZE);

  let html = '<div class="table-wrap"><table><thead><tr>'
    + '<th>Date</th><th>Merchant</th><th>Category</th><th>Account</th><th style="text-align:right">Amount</th>'
    + '</tr></thead><tbody>';

  if (page.length === 0) {
    html += '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">No transactions match your filter.</td></tr>';
  } else {
    page.forEach(t => {
      const pos = t.amount >= 0;
      html += `<tr>
        <td class="mono">${escHtml(t.date)}</td>
        <td>${escHtml(t.merchant)}</td>
        <td><span class="badge badge-completed">${escHtml(t.category)}</span></td>
        <td class="mono dim">····${escHtml(t.account_last_four)}</td>
        <td class="${pos ? 'amt-pos' : 'amt-neg'}">${fmtCurrency(t.amount)}</td>
      </tr>`;
    });
  }
  html += '</tbody></table></div>';

  document.getElementById('fin-tx-table').innerHTML = html;

  renderPagination('fin-tx-pag', filtered.length, finTxPage, FIN_PAGE_SIZE,
    `function(p){ finTxPage=p; drawFinTxTable(); }`);
}

// ── SUBSCRIPTIONS ─────────────────────────────
function renderFinSubscriptions(ft) {
  const subs = ft.subscriptions || [];
  const total = subs.filter(s => s.status === 'active').reduce((n, s) => n + (s.amount || 0), 0);

  let html = `<div class="fin-section-header" style="margin-bottom:14px">
    <div class="fin-section-title">Active Subscriptions</div>
    <div class="fin-section-total" style="color:var(--violet)">${fmtCurrency(total)}/mo</div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th>Service</th><th>Amount</th><th>Frequency</th><th>Next Billing</th><th>Status</th>
    </tr></thead><tbody>`;

  subs.forEach(s => {
    html += `<tr>
      <td>${escHtml(s.service_name)}</td>
      <td class="amt-neg">${fmtCurrency(s.amount)}</td>
      <td class="dim">${escHtml(s.billing_frequency)}</td>
      <td class="mono dim">${escHtml(s.next_billing_date || '—')}</td>
      <td><span class="badge badge-${s.status === 'active' ? 'active' : 'completed'}">${s.status}</span></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('fin-subscriptions').innerHTML = html;
}

// ── INVOICES ─────────────────────────────────
function renderFinInvoices(qb) {
  const invoices  = qb.invoices  || [];
  const customers = qb.customers || [];
  const custMap   = Object.fromEntries(customers.map(c => [c.Id, c]));

  const outstanding = invoices.filter(i => i.Balance > 0);
  const paid        = invoices.filter(i => i.Balance === 0);
  const totalAR     = outstanding.reduce((s, i) => s + i.Balance, 0);

  let html = `<div class="fin-section-header" style="margin-bottom:14px">
    <div class="fin-section-title">Invoices — ${outstanding.length} outstanding · ${paid.length} paid</div>
    <div class="fin-section-total" style="color:var(--amber)">A/R ${fmtCurrency(totalAR)}</div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th>Client</th><th>Description</th><th>Date</th><th>Due</th>
      <th style="text-align:right">Total</th><th>Status</th>
    </tr></thead><tbody>`;

  [...outstanding, ...paid].forEach(inv => {
    const cust = custMap[inv.CustomerRef?.value] || {};
    const desc = (inv.Line || []).map(l => l.Description).join('; ');
    const isPaid = inv.Balance === 0;
    html += `<tr onclick='showInvoiceModal(${JSON.stringify(inv).replace(/'/g, "&#39;")}, ${JSON.stringify(cust).replace(/'/g, "&#39;")})'>
      <td>${escHtml(inv.CustomerRef?.name || '—')}</td>
      <td class="dim" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(desc)}</td>
      <td class="mono dim">${escHtml(inv.TxnDate)}</td>
      <td class="mono dim">${escHtml(inv.DueDate)}</td>
      <td class="${isPaid ? 'amt-pos' : 'amt-neg'}" style="text-align:right">${fmtCurrency(inv.TotalAmt)}</td>
      <td><span class="badge badge-${isPaid ? 'paid' : 'outstanding'}">${isPaid ? 'paid' : 'outstanding'}</span></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('fin-invoices').innerHTML = html;
}

function showInvoiceModal(inv, cust) {
  const lines = (inv.Line || []).map(l =>
    `<div style="padding:6px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:13px">${escHtml(l.Description)}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${fmtCurrency(l.Amount)}</div>
    </div>`
  ).join('');

  const isPaid = inv.Balance === 0;
  const body = `
    <div class="mf-grid">
      <div class="mf-item"><label>Client</label><span class="val">${escHtml(inv.CustomerRef?.name)}</span></div>
      <div class="mf-item"><label>Status</label><span class="val"><span class="badge badge-${isPaid ? 'paid' : 'outstanding'}">${isPaid ? 'Paid' : 'Outstanding'}</span></span></div>
      <div class="mf-item"><label>Invoice Date</label><span class="val">${escHtml(inv.TxnDate)}</span></div>
      <div class="mf-item"><label>Due Date</label><span class="val">${escHtml(inv.DueDate)}</span></div>
      <div class="mf-item"><label>Total</label><span class="val" style="color:var(--amber)">${fmtCurrency(inv.TotalAmt)}</span></div>
      <div class="mf-item"><label>Balance</label><span class="val" style="color:${isPaid ? 'var(--emerald)' : 'var(--rose)'}">${fmtCurrency(inv.Balance)}</span></div>
    </div>
    <div class="mf-sep"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:8px">Line Items</div>
    ${lines}`;
  openModal('Invoice', inv.CustomerRef?.name || '—', body);
}

// ── BILLS ─────────────────────────────────────
function renderFinBills(qb) {
  const bills   = qb.bills   || [];
  const vendors = qb.vendors || [];
  const vndMap  = Object.fromEntries(vendors.map(v => [v.Id, v]));

  const outstanding = bills.filter(b => b.Balance > 0);
  const paid        = bills.filter(b => b.Balance === 0);
  const totalOwed   = outstanding.reduce((s, b) => s + b.Balance, 0);

  let html = `<div class="fin-section-header" style="margin-bottom:14px">
    <div class="fin-section-title">Bills — ${outstanding.length} outstanding · ${paid.length} paid</div>
    <div class="fin-section-total" style="color:var(--rose)">Owed ${fmtCurrency(totalOwed)}</div>
  </div>
  <div class="table-wrap"><table>
    <thead><tr>
      <th>Vendor</th><th>Description</th><th>Date</th><th>Due</th>
      <th style="text-align:right">Total</th><th>Status</th>
    </tr></thead><tbody>`;

  [...outstanding, ...paid].forEach(b => {
    const desc = (b.Line || []).map(l => l.Description).join('; ');
    const isPaid = b.Balance === 0;
    html += `<tr onclick='showBillModal(${JSON.stringify(b).replace(/'/g, "&#39;")})'>
      <td>${escHtml(b.VendorRef?.name || '—')}</td>
      <td class="dim" style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(desc)}</td>
      <td class="mono dim">${escHtml(b.TxnDate)}</td>
      <td class="mono dim">${escHtml(b.DueDate)}</td>
      <td class="amt-neg" style="text-align:right">${fmtCurrency(b.TotalAmt)}</td>
      <td><span class="badge badge-${isPaid ? 'paid' : 'outstanding'}">${isPaid ? 'paid' : 'outstanding'}</span></td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  document.getElementById('fin-bills').innerHTML = html;
}

function showBillModal(b) {
  const lines = (b.Line || []).map(l =>
    `<div style="padding:6px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:13px">${escHtml(l.Description)}</div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px">${fmtCurrency(l.Amount)}</div>
    </div>`
  ).join('');

  const isPaid = b.Balance === 0;
  const body = `
    <div class="mf-grid">
      <div class="mf-item"><label>Vendor</label><span class="val">${escHtml(b.VendorRef?.name)}</span></div>
      <div class="mf-item"><label>Status</label><span class="val"><span class="badge badge-${isPaid ? 'paid' : 'outstanding'}">${isPaid ? 'Paid' : 'Outstanding'}</span></span></div>
      <div class="mf-item"><label>Bill Date</label><span class="val">${escHtml(b.TxnDate)}</span></div>
      <div class="mf-item"><label>Due Date</label><span class="val">${escHtml(b.DueDate)}</span></div>
      <div class="mf-item"><label>Total</label><span class="val" style="color:var(--rose)">${fmtCurrency(b.TotalAmt)}</span></div>
      <div class="mf-item"><label>Balance</label><span class="val" style="color:${isPaid ? 'var(--emerald)' : 'var(--rose)'}">${fmtCurrency(b.Balance)}</span></div>
    </div>
    <div class="mf-sep"></div>
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:var(--text3);margin-bottom:8px">Line Items</div>
    ${lines}`;
  openModal('Bill', b.VendorRef?.name || '—', body);
}
