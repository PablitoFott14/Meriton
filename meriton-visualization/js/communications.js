/* ═══════════════════════════════════════════
   communications.js — Email (threaded) +
   Messages (conversation bubbles)
═══════════════════════════════════════════ */

function renderCommunications(data) {
  renderEmail(data.email || {});
  renderMessages(data.messaging || {});
}

// ── EMAIL ─────────────────────────────────────
let emailFolder = 'ALL';
let emailSearch = '';

function renderEmail(emailData) {
  const emails = (emailData.emails || []).sort((a, b) => b.timestamp - a.timestamp);
  const el = document.getElementById('comm-email');

  el.innerHTML = `
    <div class="email-filter-bar">
      <button class="folder-btn active" data-folder="ALL" onclick="setEmailFolder('ALL')">All</button>
      <button class="folder-btn" data-folder="INBOX" onclick="setEmailFolder('INBOX')">Inbox</button>
      <button class="folder-btn" data-folder="SENT" onclick="setEmailFolder('SENT')">Sent</button>
      <input id="email-search" class="ex-search" type="text" placeholder="Search subject or content…" style="max-width:280px" />
      <span class="ex-count" id="email-count"></span>
    </div>
    <div id="email-list" class="email-list"></div>`;

  el.querySelector('#email-search').addEventListener('input', e => {
    emailSearch = e.target.value.toLowerCase();
    drawEmailList(emails);
  });

  drawEmailList(emails);
}

function setEmailFolder(folder) {
  emailFolder = folder;
  document.querySelectorAll('.folder-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.folder === folder);
  });
  const emails = (window._emailData || []);
  drawEmailList(emails);
}

function drawEmailList(emails) {
  window._emailData = emails;
  const filtered = emails.filter(e => {
    const matchFolder = emailFolder === 'ALL' || e.folder === emailFolder;
    const s = emailSearch;
    const matchSearch = !s
      || (e.subject || '').toLowerCase().includes(s)
      || (e.content || '').toLowerCase().includes(s)
      || (e.sender || '').toLowerCase().includes(s)
      || (e.recipients_json || []).some(r => r.toLowerCase().includes(s));
    return matchFolder && matchSearch;
  });

  const countEl = document.getElementById('email-count');
  if (countEl) countEl.textContent = `${filtered.length} email${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    document.getElementById('email-list').innerHTML = '<div class="empty-state">No emails match your filter.</div>';
    return;
  }

  let html = '';
  filtered.forEach(e => {
    const isInbox = e.folder === 'INBOX';
    const from    = isInbox ? (e.sender || '—') : 'You → ' + (e.recipients_json || []).join(', ');
    const atts    = Object.keys(e.attachments_json || {});
    const hasReply = emails.some(other => other.parent_id === e.email_id);

    html += `<div class="email-row">
      <div class="email-summary" onclick="toggleEmail('${escHtml(e.email_id)}')">
        <span class="badge badge-${isInbox ? 'inbox' : 'sent'}">${e.folder}</span>
        <div>
          <div class="email-subject ${!e.is_read ? 'unread' : ''}">${escHtml(e.subject)}</div>
          <div class="email-from">${escHtml(from)}</div>
        </div>
        <div class="email-date">${fmtDate(e.timestamp)}</div>
        <div style="text-align:right">
          ${!e.is_read ? '<span class="badge badge-unread">unread</span>' : ''}
          ${atts.length ? `<div style="font-size:10px;color:var(--text3);margin-top:3px">📎 ${atts.length}</div>` : ''}
        </div>
      </div>
      <div class="email-body-wrap" id="email-body-${escHtml(e.email_id)}">
        <div class="email-meta-line">
          <strong>From:</strong> ${escHtml(e.sender)}<br>
          <strong>To:</strong> ${escHtml((e.recipients_json || []).join(', '))}<br>
          ${e.cc_json && e.cc_json.length ? `<strong>CC:</strong> ${escHtml(e.cc_json.join(', '))}<br>` : ''}
          <strong>Date:</strong> ${fmtDateTime(e.timestamp)}
          ${e.parent_id ? `<br><strong>Thread:</strong> reply` : ''}
        </div>
        <div class="email-content">${escHtml(e.content)}</div>
        ${atts.length ? `<div class="email-attachments">${atts.map(a => `<div class="attachment-chip">📎 ${escHtml(a)}</div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  });

  document.getElementById('email-list').innerHTML = html;
}

function toggleEmail(id) {
  const body = document.getElementById('email-body-' + id);
  if (body) body.classList.toggle('open');
}

// ── MESSAGES ─────────────────────────────────
function renderMessages(msgData) {
  const convos = msgData.conversations || [];
  const el = document.getElementById('comm-messages');

  if (convos.length === 0) {
    el.innerHTML = '<div class="empty-state">No message conversations found.</div>';
    return;
  }

  let html = '<div class="convo-list">';
  convos.forEach((convo, idx) => {
    const msgs    = convo.messages || [];
    const last    = msgs[msgs.length - 1];
    const preview = last ? last.content.slice(0, 60) + (last.content.length > 60 ? '…' : '') : '';

    // Determine participant names
    // p_christine = Christine; other participants get name from convo.title
    const otherName = convo.title || 'Unknown';

    html += `<div class="convo-card">
      <div class="convo-header" onclick="toggleConvo('convo-msgs-${idx}')">
        <div>
          <div class="convo-name">${escHtml(otherName)}</div>
          <div class="convo-preview">${escHtml(preview)}</div>
        </div>
        <div class="convo-count">${msgs.length} messages</div>
      </div>
      <div class="convo-messages" id="convo-msgs-${idx}">
        <div class="msg-list">`;

    msgs.forEach(m => {
      const isUser = m.sender_id === 'p_christine';
      const senderLabel = isUser ? 'Christine' : escHtml(otherName);
      html += `<div class="msg-bubble ${isUser ? 'from-user' : 'from-other'}">
        <div class="msg-sender ${isUser ? 'is-user' : ''}">${senderLabel}</div>
        ${escHtml(m.content)}
        ${m.attachment_name ? `<div style="margin-top:4px;font-size:11px;color:var(--text3)">📎 ${escHtml(m.attachment_name)}</div>` : ''}
        <div class="msg-time">${fmtDate(m.timestamp)}</div>
      </div>`;
    });

    html += `</div></div></div>`;
  });

  html += '</div>';
  el.innerHTML = html;
}

function toggleConvo(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
