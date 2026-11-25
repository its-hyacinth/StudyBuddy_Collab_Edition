/**
 * StudyBuddy — Teacher Messages
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let selectedId = null;

  function renderList() {
    const msgs = getMessages();
    const el = document.getElementById('messageList');
    if (!el) return;
    el.innerHTML = msgs.map((m) => `
      <div class="list-item ${m.id === selectedId ? 'active' : ''}" data-id="${m.id}" style="${m.unread ? 'background:#EFF6FF' : ''}">
        <div class="avatar" style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;flex-shrink:0">
          ${m.from.split(' ').map((w) => w[0]).slice(0, 2).join('')}
        </div>
        <div class="item-meta">
          <div class="item-title">${m.from} ${m.unread ? '<span class="badge badge-upcoming" style="margin-left:6px">New</span>' : ''}</div>
          <div class="item-sub">${m.preview}</div>
        </div>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${m.time}</span>
      </div>`).join('');

    el.querySelectorAll('[data-id]').forEach((row) => {
      row.addEventListener('click', () => {
        selectedId = row.dataset.id;
        const list = getMessages().map((m) => m.id === selectedId ? { ...m, unread: false } : m);
        sbSet(SB_KEYS.MESSAGES, list);
        renderList();
        renderThread();
      });
    });

    const unread = msgs.filter((m) => m.unread).length;
    const badge = document.getElementById('unreadCount');
    if (badge) badge.textContent = unread;
  }

  function renderThread() {
    const panel = document.getElementById('threadPanel');
    if (!panel) return;
    const m = getMessages().find((x) => x.id === selectedId);
    if (!m) {
      panel.innerHTML = '<div class="empty-state"><i data-lucide="message-square"></i><p>Select a message to read</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }
    panel.innerHTML = `
      <div style="padding-bottom:16px;border-bottom:1px solid var(--border);margin-bottom:16px">
        <h3 style="font-size:16px">${m.from}</h3>
        <p style="font-size:12px;color:var(--text-muted)">${m.class} · ${m.time}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="background:var(--page-bg);padding:14px;border-radius:12px;max-width:85%">
          <p style="font-size:13.5px;color:var(--text-heading)">${m.preview}</p>
          <p style="font-size:11px;color:var(--text-muted);margin-top:6px">${m.time}</p>
        </div>
        <div style="background:var(--primary-soft);padding:14px;border-radius:12px;max-width:85%;align-self:flex-end">
          <p style="font-size:13.5px;color:var(--text-heading)">Thanks for reaching out! I'll get back to you shortly.</p>
          <p style="font-size:11px;color:var(--text-muted);margin-top:6px">You</p>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:8px">
        <input class="form-control" id="replyInput" placeholder="Type a reply..." />
        <button type="button" class="btn btn-primary" id="sendReply"><i data-lucide="send"></i></button>
      </div>`;
    document.getElementById('sendReply')?.addEventListener('click', () => {
      const text = document.getElementById('replyInput')?.value.trim();
      if (!text) return;
      showToast('Reply sent (demo)');
      document.getElementById('replyInput').value = '';
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function fillSelect(select, placeholder, items) {
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = placeholder;
    select.appendChild(blank);
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
    select.value = items.some((item) => item.value === previous) ? previous : '';
  }

  function syncComposeOptions() {
    const classSelect = document.getElementById('composeClass');
    const classes = getClasses();
    fillSelect(classSelect, 'Select class', classes.map((cls) => ({
      value: String(cls.id),
      label: classDisplayName(cls) || cls.name || 'Untitled class',
    })));
    const selected = classes.find((cls) => String(cls.id) === classSelect?.value);
    const students = (selected ? classRoster(selected, getStudents(), true) : getStudents())
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    fillSelect(document.getElementById('composeTo'), 'Select student', students.map((student) => ({
      value: String(student.id),
      label: student.name || student.email || 'Student',
    })));
  }

  document.getElementById('composeClass')?.addEventListener('change', syncComposeOptions);
  document.getElementById('composeBtn')?.addEventListener('click', () => {
    syncComposeOptions();
    openModal('composeModal');
  });
  document.getElementById('composeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = getStudents().find((item) => String(item.id) === document.getElementById('composeTo')?.value);
    const cls = getClasses().find((item) => String(item.id) === document.getElementById('composeClass')?.value);
    const body = document.getElementById('composeBody')?.value.trim();
    const to = student?.name || '';
    if (!to || !body) { showToast('Recipient and message required', 'error'); return; }
    const list = getMessages();
    list.unshift({
      id: uid('msg'), from: to, preview: body, time: 'Just now', createdAt: new Date().toISOString(),
      unread: false, class: cls ? classDisplayName(cls) : 'General',
    });
    sbSet(SB_KEYS.MESSAGES, list);
    closeModal('composeModal');
    e.target.reset();
    showToast('Message sent');
    renderList();
  });

  renderList();
  renderThread();
  syncComposeOptions();
  sbWhenReady(() => { renderList(); renderThread(); syncComposeOptions(); });
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
