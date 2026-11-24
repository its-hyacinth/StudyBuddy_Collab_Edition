/**
 * StudyBuddy — Teacher Students
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;
  wireModalClosers();

  let search = '';
  let statusFilter = '';
  let courseFilter = '';
  let yearFilter = '';

  const AT_RISK_GPA = 2.5;

  // Escape user-provided text before putting it into innerHTML (prevents XSS)
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function initials(name) {
    return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  function studentGpa(student) {
    return student.gpa !== null && student.gpa !== undefined && Number.isFinite(Number(student.gpa))
      ? Number(student.gpa).toFixed(2)
      : 'N/A';
  }

  function showStudentInsight(title, content) {
    document.getElementById('studentInsightsTitle').textContent = title;
    document.getElementById('studentInsightsBody').innerHTML = content;
    openModal('studentInsightsModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function openStudentDetails(student) {
    const cls = getClasses().find((item) => item.id === student.classId);
    const status = student.status || 'inactive';
    const details = [
      ['Email', student.email || 'Not provided'],
      ['Course', student.course || 'Not provided'],
      ['Year level', student.year || 'Not provided'],
      ['Block', student.section ? `Block ${student.section}` : 'Not set'],
      ['Standing', isIrregularStudent(student) ? 'Irregular' : 'Regular'],
      ['Class', cls ? classDisplayName(cls) : 'No class assigned'],
      ['Student ID', student.studentId || 'Not provided'],
      ['GPA', studentGpa(student)],
    ];
    showStudentInsight(student.name || 'Student details', `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px">
        ${details.map(([label, value]) => `
          <div>
            <div class="stat-label">${escapeHtml(label)}</div>
            <div class="title">${escapeHtml(value)}</div>
          </div>`).join('')}
        <div>
          <div class="stat-label">Status</div>
          <span class="badge ${statusClass(status)}">${escapeHtml(statusLabel(status))}</span>
        </div>
      </div>`);
  }

  function openStudentOverview() {
    const students = getStudents();
    const classes = getClasses();
    const roster = students.length ? students.map((student) => {
      const cls = classes.find((item) => item.id === student.classId);
      return `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(student.name)}</div>
            <div class="item-sub">${escapeHtml(student.course || 'Course not set')} · ${escapeHtml(student.year || 'Year not set')} · ${escapeHtml(cls ? classDisplayName(cls) : 'No class assigned')}</div>
          </div>
          <span class="badge ${statusClass(student.status || 'inactive')}">${escapeHtml(statusLabel(student.status || 'inactive'))}</span>
        </div>`;
    }).join('') : '<p class="empty-state">No student records available.</p>';

    showStudentInsight('Student overview', `
      <div>${roster}</div>`);
  }

  function openTopPerformers() {
    const students = getStudents().slice()
      .sort((a, b) => (Number(b.gpa) || 0) - (Number(a.gpa) || 0));
    const content = students.length ? students.map((student, index) => `
      <div class="list-item">
        <span class="badge badge-info">${index + 1}</span>
        <div class="item-meta">
          <div class="item-title">${escapeHtml(student.name)}</div>
          <div class="item-sub">GPA ${escapeHtml(studentGpa(student))} · ${escapeHtml(student.course || 'Course not set')} · ${escapeHtml(student.year || 'Year not set')}</div>
        </div>
        <span class="badge ${statusClass(student.status || 'inactive')}">${escapeHtml(statusLabel(student.status || 'inactive'))}</span>
      </div>`).join('') : '<p class="empty-state">No student performance data available.</p>';
    showStudentInsight('Student performance', content);
  }

  function render() {
    const all = getStudents();

    // ---- Filtering ----
    let list = all.slice();
    if (statusFilter) list = list.filter((s) => s.status === statusFilter);
    if (courseFilter) list = list.filter((s) => normalizeCourseCode(s.course) === courseFilter);
    if (yearFilter) list = list.filter((s) => s.year === yearFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        String(s.name || '').toLowerCase().includes(q) ||
        String(s.email || '').toLowerCase().includes(q) ||
        String(s.course || '').toLowerCase().includes(q) ||
        String(s.subjectCode || '').toLowerCase().includes(q) ||
        String(s.section || '').toLowerCase().includes(q)
      );
    }

    // ---- Stat cards ----
    const activeCount = all.filter((s) => s.status === 'active').length;
    const inactiveCount = all.length - activeCount;
    const avgGpa = all.reduce((sum, s) => sum + (Number(s.gpa) || 0), 0) / (all.length || 1);
    const atRisk = all.filter((s) => Number(s.gpa) > 0 && Number(s.gpa) < AT_RISK_GPA);

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    // Same total as My Classes and the Dashboard: Classroom students + students added here
    const classes = getClasses();
    const classroomTotal = classes.reduce((s, c) => s + (Number(c.students) || 0), 0);
    setText('statTotalStudents', classroomTotal + all.length);
    const totalDelta = document.getElementById('statTotalStudents')?.closest('.stat-card')?.querySelector('.stat-delta');
    if (totalDelta) totalDelta.innerHTML = `<i data-lucide="users"></i> ${classroomTotal} Classroom · ${all.length} added`;
    setText('statActiveStudents', activeCount);
    setText('statAvgGpa', avgGpa.toFixed(1));
    setText('statAtRisk', atRisk.length);

    // ---- Table ----
    const tbody = document.getElementById('studentsTableBody');
    if (tbody) {
      tbody.innerHTML = list.length
        ? list.map((s) => `
        <tr data-id="${escapeHtml(s.id)}" data-status="${escapeHtml(s.status)}">
          <td>
            <div class="cell-title">
              <div class="avatar" style="width:36px;height:36px;flex-shrink:0;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px">
                ${escapeHtml(initials(s.name))}
              </div>
              <div>
                <div class="title">${escapeHtml(s.name)}</div>
                <div class="subtitle">${s.studentId ? 'ID: ' + escapeHtml(s.studentId) : ''}</div>
              </div>
            </div>
          </td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.course)}</td>
          <td>${escapeHtml(s.year || '—')}${s.section ? `<div class="subtitle">Block ${escapeHtml(s.section)}</div>` : ''}</td>
          <td>${escapeHtml((() => { const cls = classes.find((c) => c.id === s.classId); return cls ? classDisplayName(cls) : (s.subjectCode || '—'); })())}</td>
          <td><strong>${escapeHtml(s.gpa)}</strong></td>
          <td>
            <span class="badge ${statusClass(s.status)}">${statusLabel(s.status)}</span>
            ${isIrregularStudent(s) ? '<div class="subtitle">Irregular</div>' : ''}
          </td>
          <td>
            <div class="action-menu-wrap">
              <button type="button" class="action-menu-btn" data-student-menu
                aria-label="Actions for ${escapeHtml(s.name)}" aria-expanded="false">
                <i data-lucide="more-horizontal"></i>
              </button>
              <div class="action-dropdown">
                <button type="button" class="danger" data-unenroll="${escapeHtml(s.id)}">
                  <i data-lucide="user-minus"></i> Unenroll
                </button>
              </div>
            </div>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="8" style="text-align:center;padding:24px">${search || statusFilter || courseFilter || yearFilter ? 'No students match these filters.' : 'No students on this list yet. Import a class list, add a student, or have them join with a class code.'}</td></tr>`;
    }

    // ---- Student overview (donut center + legend; keeps the donut markup intact) ----
    const pct = all.length ? Math.round((activeCount / all.length) * 100) : 0;
    const center = document.querySelector('#studentOverview .center-label');
    if (center) center.innerHTML = `${pct}%<small>Active</small>`;
    const ring = document.querySelector('#studentOverview .donut circle:nth-of-type(2)');
    if (ring) {
      const circumference = 226.2;
      ring.setAttribute('stroke-dashoffset', (circumference * (1 - pct / 100)).toFixed(1));
    }
    const legendRows = document.querySelectorAll('#studentOverview .donut-legend-row');
    if (legendRows[0]) {
      legendRows[0].querySelector('.lbl span:last-child').textContent = activeCount;
      legendRows[0].querySelector('.fill').style.width = pct + '%';
    }
    if (legendRows[1]) {
      legendRows[1].querySelector('.lbl span:last-child').textContent = inactiveCount;
      legendRows[1].querySelector('.fill').style.width = (all.length ? 100 - pct : 0) + '%';
    }

    // ---- Top performers ----
    const top = document.getElementById('topPerformers');
    if (top) {
      const colors = [
        ['#DBEAFE', '#2563EB'],
        ['#EDE9FE', '#7C3AED'],
        ['#FFEDD5', '#EA580C']
      ];
      top.innerHTML = all
        .slice()
        .sort((a, b) => (Number(b.gpa) || 0) - (Number(a.gpa) || 0))
        .slice(0, 3)
        .map((s, i) => `
        <div class="list-item" role="button" tabindex="0" data-student-details="${escapeHtml(s.id)}" aria-label="View details for ${escapeHtml(s.name)}">
          <div class="cell-icon" style="background:${colors[i][0]};color:${colors[i][1]};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px">${i + 1}</div>
          <div class="item-meta">
            <div class="item-title">${escapeHtml(s.name)}</div>
            <div class="item-sub">GPA ${escapeHtml(s.gpa)} · ${escapeHtml(s.course)}</div>
          </div>
        </div>`).join('');
    }

    // ---- At-risk students ----
    const riskBox = document.getElementById('atRiskStudents');
    if (riskBox) {
      riskBox.innerHTML = atRisk.length
        ? atRisk.slice(0, 5).map((s) => `
        <div class="list-item">
          <div class="item-meta">
            <div class="item-title">${escapeHtml(s.name)}</div>
            <div class="item-sub">GPA ${escapeHtml(s.gpa)} · ${escapeHtml(s.course)}</div>
          </div>
          <span class="badge badge-warning">At Risk</span>
        </div>`).join('')
        : '<div class="list-item"><div class="item-meta"><div class="item-sub">No at-risk students.</div></div></div>';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Event wiring ----
  document.getElementById('studentSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    render();
  });
  document.getElementById('studentStatusFilter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });
  document.getElementById('studentCourseFilter')?.addEventListener('change', (e) => {
    courseFilter = e.target.value;
    render();
  });
  document.getElementById('studentYearFilter')?.addEventListener('change', (e) => {
    yearFilter = e.target.value;
    render();
  });
  const wireInsightCard = (card, showDetails) => {
    if (!card) return;
    card.addEventListener('click', (event) => {
      if (event.target.closest('[data-student-details]')) return;
      showDetails();
    });
    card.querySelector('.card-header')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      showDetails();
    });
  };
  wireInsightCard(document.querySelector('[data-student-insight-card="overview"]'), openStudentOverview);
  wireInsightCard(document.querySelector('[data-student-insight-card="top-performers"]'), openTopPerformers);
  const topPerformers = document.getElementById('topPerformers');
  topPerformers?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-student-details]');
    if (!row) return;
    const student = getStudents().find((item) => item.id === row.dataset.studentDetails);
    if (student) openStudentDetails(student);
  });
  topPerformers?.addEventListener('keydown', (event) => {
    const row = event.target.closest('[data-student-details]');
    if (!row || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    const student = getStudents().find((item) => item.id === row.dataset.studentDetails);
    if (student) openStudentDetails(student);
  });
  function classOptionsHtml(placeholder) {
    return `<option value="">${placeholder}</option>` +
      getClasses().map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(classDisplayName(c))}</option>`).join('');
  }

  const courseFilter = document.getElementById('studentCourseFilter');
  if (courseFilter) {
    const current = courseFilter.value;
    courseFilter.innerHTML = courseOptionsHtml('All Courses');
    if ([...courseFilter.options].some((option) => option.value === current)) courseFilter.value = current;
  }
  const studentCourse = document.getElementById('studentCourse');
  if (studentCourse) studentCourse.innerHTML = courseOptionsHtml('Select course');
  const studentYear = document.getElementById('studentYear');
  if (studentYear) studentYear.innerHTML = yearOptionsHtml('Select year');

  document.getElementById('addStudentBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('studentClass');
    if (sel) sel.innerHTML = classOptionsHtml('No class');
    openModal('addStudentModal');
  });

  // ---- Roster import: Excel, CSV, text, and PDF ----
  let importRows = [];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some((script) => script.src === src)) { resolve(); return; }
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('Could not load a file reader. CSV and text files still work.'));
      document.head.appendChild(el);
    });
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const src = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { cell += '"'; i += 1; }
          else inQuotes = false;
        } else cell += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',' || ch === '\t' || ch === ';') { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') cell += ch;
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    return rows;
  }

  const HEADER_ALIASES = {
    name: ['name', 'studentname', 'fullname', 'student', 'learner', 'learnername', 'lastname', 'firstname'],
    email: ['email', 'emailaddress', 'mail', 'e-mail'],
    studentId: ['studentid', 'idnumber', 'idno', 'studno', 'studentnumber', 'lrn', 'id'],
    course: ['course', 'program', 'degree'],
    year: ['year', 'yearlevel', 'level', 'yr'],
    section: ['section', 'block', 'sectionblock', 'classblock'],
    standing: ['standing', 'enrollment', 'studenttype', 'regularity'],
    subjectCode: ['subjectcode', 'coursecode', 'classcode', 'code', 'subject'],
    gpa: ['gpa', 'qpi'],
    status: ['status'],
  };

  function headerIndex(headers) {
    const norm = headers.map((header) => String(header || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    const index = {};
    Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
      const found = norm.findIndex((header) => aliases.includes(header));
      if (found >= 0) index[field] = found;
    });
    return index;
  }

  function looksLikeHeader(row) {
    const index = headerIndex(row);
    return index.name !== undefined || index.email !== undefined || index.subjectCode !== undefined;
  }

  function looseLine(line) {
    const emailMatch = String(line).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const email = emailMatch ? emailMatch[0] : '';
    let rest = email ? String(line).replace(email, ' ') : String(line);
    const idMatch = rest.match(/\b(\d{2,4}[-/]\d{3,8}|\d{6,12})\b/);
    const studentId = idMatch ? idMatch[1] : '';
    if (idMatch) rest = rest.replace(idMatch[0], ' ');
    let subjectCode = '';
    const known = getClasses().map((cls) => normalizeSubjectCode(classSubjectCode(cls))).filter((code) => code.length >= 2);
    const restNorm = normalizeSubjectCode(rest);
    const matches = known.filter((code) => restNorm.includes(code)).sort((a, b) => b.length - a.length);
    subjectCode = matches[0] || '';
    if (subjectCode) {
      rest = rest.split(/[\s,|/]+/).filter((token) => {
        const norm = normalizeSubjectCode(token);
        return !norm || !subjectCode.includes(norm);
      }).join(' ');
    }
    const name = rest.replace(/^\s*\d+[\.\)\-]\s*/, '').replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name && !email && !studentId) return null;
    if (!email && !studentId && (/^(name|student|email|subject|course|class list|official)\b/i.test(name) || name.split(/\s+/).length < 2)) {
      return null;
    }
    return {
      name: name || (email ? email.split('@')[0].replace(/[._]/g, ' ') : ''),
      email, studentId, subjectCode, course: '', year: '', gpa: '', status: '',
    };
  }

  function studentsFromTable(table) {
    const cleaned = table.filter((row) => row.some((cell) => String(cell || '').trim()));
    if (!cleaned.length) return [];
    if (cleaned[0].length === 1 && !looksLikeHeader(cleaned[0])) {
      return cleaned.map((row) => looseLine(row[0])).filter(Boolean);
    }
    let index;
    let start = 0;
    if (looksLikeHeader(cleaned[0])) {
      index = headerIndex(cleaned[0]);
      start = 1;
    } else {
      index = { name: 0, email: 1, studentId: 2, course: 3, year: 4, section: 5, standing: 6, subjectCode: 7 };
    }
    return cleaned.slice(start).map((row) => {
      const get = (field) => (index[field] === undefined ? '' : String(row[index[field]] || '').trim());
      const email = get('email');
      const name = get('name');
      const studentId = get('studentId');
      if (!name && !email && !studentId) return null;
      return {
        name: name || (email ? email.split('@')[0].replace(/[._]/g, ' ') : studentId),
        email, studentId,
        course: get('course'),
        year: get('year'),
        section: get('section'),
        standing: get('standing'),
        subjectCode: get('subjectCode'),
        gpa: get('gpa'),
        status: get('status').toLowerCase(),
      };
    }).filter(Boolean);
  }

  async function rowsFromFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) throw new Error('PDF reader failed to load.');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const lines = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const grouped = new Map();
        content.items.forEach((item) => {
          if (!item.str || !item.str.trim()) return;
          const y = Math.round(item.transform[5]);
          if (!grouped.has(y)) grouped.set(y, []);
          grouped.get(y).push({ x: item.transform[4], str: item.str });
        });
        [...grouped.keys()].sort((a, b) => b - a).forEach((y) => {
          const line = grouped.get(y).sort((a, b) => a.x - b.x).map((part) => part.str).join(' ').replace(/\s+/g, ' ').trim();
          if (line) lines.push(line);
        });
      }
      return lines.map(looseLine).filter(Boolean);
    }
    if (ext === 'xls' || ext === 'xlsx') {
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      if (!window.XLSX) throw new Error('Excel reader failed to load. Save the sheet as CSV and try again.');
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheetName = workbook.SheetNames.find((name) => {
        const sheet = workbook.Sheets[name];
        return sheet && window.XLSX.utils.sheet_to_json(sheet, { header: 1 }).length;
      });
      if (!sheetName) return [];
      const table = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false, defval: '' });
      return studentsFromTable(table.map((row) => row.map((cell) => String(cell ?? '').trim())));
    }
    const text = await file.text();
    if (ext === 'txt' && !text.includes(',') && !text.includes('\t') && !text.includes(';')) {
      return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(looseLine).filter(Boolean);
    }
    return studentsFromTable(parseCsv(text));
  }

  function resolveImportClass(row) {
    if (row.subjectCode) {
      const match = findClassForLabel(row.subjectCode);
      if (match) return { classId: match.id, subjectCode: classSubjectCode(match) };
    }
    const defaultId = document.getElementById('importDefaultClass')?.value || '';
    if (defaultId) {
      const cls = getClasses().find((item) => item.id === defaultId);
      if (cls) return { classId: cls.id, subjectCode: classSubjectCode(cls) };
    }
    if (row.subjectCode) return { error: `No class uses ${row.subjectCode}` };
    return { classId: null, subjectCode: '' };
  }

  function parseGpa(value) {
    if (value === '' || value == null) return null;
    const number = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(number) ? number : null;
  }

  function findExistingStudent(list, row) {
    const email = row.email.toLowerCase();
    if (email) return list.find((student) => String(student.email || '').toLowerCase() === email) || null;
    if (row.studentId) {
      const id = normalizeSubjectCode(row.studentId);
      return list.find((student) => student.studentId && normalizeSubjectCode(student.studentId) === id) || null;
    }
    const name = row.name.toLowerCase();
    if (!name) return null;
    return list.find((student) => !student.email && String(student.name || '').toLowerCase() === name) || null;
  }

  function renderImportPreview() {
    const box = document.getElementById('importPreview');
    const confirm = document.getElementById('confirmImportBtn');
    if (!box || !confirm) return;
    if (!importRows.length) {
      box.innerHTML = '';
      confirm.disabled = true;
      return;
    }
    const existing = getStudents();
    let ready = 0;
    let updates = 0;
    let skipped = 0;
    const preview = importRows.slice(0, 6).map((row) => {
      const resolved = resolveImportClass(row);
      if (resolved.error) skipped += 1;
      else if (findExistingStudent(existing, row)) updates += 1;
      else ready += 1;
      const cls = resolved.classId ? getClasses().find((item) => item.id === resolved.classId) : null;
      return `<tr>
        <td>${escapeHtml(row.name || '—')}</td>
        <td>${escapeHtml(row.email || row.studentId || '—')}</td>
        <td>${escapeHtml(cls ? classDisplayName(cls) : (resolved.error || 'No class'))}</td>
      </tr>`;
    }).join('');
    const rest = importRows.slice(6);
    rest.forEach((row) => {
      const resolved = resolveImportClass(row);
      if (resolved.error) skipped += 1;
      else if (findExistingStudent(existing, row)) updates += 1;
      else ready += 1;
    });
    box.innerHTML = `
      <p class="subtitle" style="margin-bottom:8px">${ready} new · ${updates} updated · ${skipped} skipped</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email / ID</th><th>Class</th></tr></thead>
          <tbody>${preview}</tbody>
        </table>
      </div>`;
    confirm.disabled = ready + updates === 0;
  }

  async function readRosterFile(file) {
    const confirm = document.getElementById('confirmImportBtn');
    if (confirm) confirm.disabled = true;
    const preview = document.getElementById('importPreview');
    if (preview) preview.innerHTML = '<p class="subtitle">Reading file…</p>';
    try {
      importRows = await rowsFromFile(file);
      if (!importRows.length) {
        if (preview) preview.innerHTML = '<p class="subtitle">No students found. Use columns for name and email, or a PDF/text list with one student per line. Scanned PDFs need to be exported to Excel or CSV first.</p>';
        return;
      }
      renderImportPreview();
    } catch (error) {
      importRows = [];
      if (preview) preview.innerHTML = `<p class="subtitle">${escapeHtml(error.message || 'Could not read that file.')}</p>`;
      showToast(error.message || 'Could not read that file.', 'error');
    }
  }

  document.getElementById('importStudentsBtn')?.addEventListener('click', () => {
    importRows = [];
    const file = document.getElementById('rosterFile');
    if (file) file.value = '';
    const sel = document.getElementById('importDefaultClass');
    if (sel) sel.innerHTML = classOptionsHtml('No class — subject code column only');
    const preview = document.getElementById('importPreview');
    if (preview) preview.innerHTML = '';
    const confirm = document.getElementById('confirmImportBtn');
    if (confirm) confirm.disabled = true;
    openModal('importStudentsModal');
  });

  document.getElementById('rosterFile')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) readRosterFile(file);
  });
  document.getElementById('importDefaultClass')?.addEventListener('change', () => {
    if (importRows.length) renderImportPreview();
  });
  document.getElementById('downloadRosterTemplate')?.addEventListener('click', () => {
    const sampleCode = classSubjectCode(getClasses()[0]) || 'PC 4112';
    const csv = `Name,Email,Student ID,Course,Year,Section,Standing,Subject Code\nMaria Santos,maria.santos@email.com,2022-00123,BSIT,1st Year,B,Regular,${sampleCode}\nJuan Cruz,juan.cruz@email.com,2021-00991,BSIT,3rd Year,A,Irregular,${sampleCode}\n`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'studybuddy-student-list.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  });
  document.getElementById('confirmImportBtn')?.addEventListener('click', () => {
    const list = getStudents();
    let added = 0;
    let updated = 0;
    let skipped = 0;
    importRows.forEach((row) => {
      const resolved = resolveImportClass(row);
      if (resolved.error || !row.name) { skipped += 1; return; }
      const gpa = parseGpa(row.gpa);
      const status = row.status === 'active' || row.status === 'inactive' ? row.status : '';
      const existing = findExistingStudent(list, row);
      if (existing) {
        if (row.name) existing.name = row.name;
        if (row.email) existing.email = row.email;
        if (row.studentId) existing.studentId = row.studentId;
        if (row.course) existing.course = normalizeCourseCode(row.course);
        if (row.year) existing.year = yearLevelLabel(row.year) || row.year;
        if (row.section) existing.section = row.section;
        if (row.standing) existing.standing = String(row.standing).toLowerCase().includes('irreg') ? 'irregular' : 'regular';
        if (gpa !== null) existing.gpa = gpa;
        if (status) existing.status = status;
        existing.classId = resolved.classId;
        existing.subjectCode = resolved.subjectCode;
        updated += 1;
        return;
      }
      list.push({
        id: uid('stu'),
        name: row.name,
        email: row.email || '',
        studentId: row.studentId || '',
        course: normalizeCourseCode(row.course),
        year: yearLevelLabel(row.year) || row.year || '',
        section: row.section || '',
        standing: String(row.standing || '').toLowerCase().includes('irreg') ? 'irregular' : 'regular',
        classId: resolved.classId,
        subjectCode: resolved.subjectCode,
        gpa: gpa === null ? 0 : gpa,
        status: status || 'active',
      });
      added += 1;
    });
    sbSet(SB_KEYS.STUDENTS, list);
    closeModal('importStudentsModal');
    importRows = [];
    showToast(`Imported ${added} new and updated ${updated}${skipped ? `. Skipped ${skipped}` : ''}`);
    render();
  });

  // ---- Unenroll: removes the student from their class and from the students list ----
  // Confirmation popup built with the app's own modal styles (instead of the browser's plain dialog)
  let pendingUnenrollId = null;
  const unenrollModal = document.createElement('div');
  unenrollModal.className = 'modal-backdrop';
  unenrollModal.id = 'unenrollModal';
  unenrollModal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Unenroll Student</h3>
        <button type="button" class="modal-close" id="unenrollCloseBtn" aria-label="Close"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <p id="unenrollMessage" style="margin:0;line-height:1.6"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-ghost" id="unenrollCancelBtn">Cancel</button>
        <button type="button" class="btn" id="unenrollConfirmBtn"
          style="background:#DC2626;color:#fff;border:none;font-weight:600">Unenroll</button>
      </div>
    </div>`;
  document.body.appendChild(unenrollModal);

  const closeUnenroll = () => { pendingUnenrollId = null; closeModal('unenrollModal'); };
  document.getElementById('unenrollCloseBtn').addEventListener('click', closeUnenroll);
  document.getElementById('unenrollCancelBtn').addEventListener('click', closeUnenroll);

  document.getElementById('unenrollConfirmBtn').addEventListener('click', () => {
    const id = pendingUnenrollId;
    const student = getStudents().find((s) => s.id === id);
    closeUnenroll();
    if (!student) return;

    const cls = getClasses().find((c) => c.id === student.classId);
    sbSet(SB_KEYS.STUDENTS, getStudents().filter((s) => s.id !== id));
    showToast(`${student.name} unenrolled${cls ? ' from ' + cls.name : ''}`, 'warning');
    render();
  });

  document.getElementById('studentsTableBody')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unenroll]');
    if (btn) {
      btn.closest('.action-dropdown')?.classList.remove('open');
      btn.closest('.action-menu-wrap')?.querySelector('[data-student-menu]')?.setAttribute('aria-expanded', 'false');
    } else {
      const menuButton = e.target.closest('[data-student-menu]');
      if (!menuButton) return;

      const menu = menuButton.nextElementSibling;
      const willOpen = !menu.classList.contains('open');
      document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((openMenu) => {
        openMenu.classList.remove('open');
        openMenu.previousElementSibling.setAttribute('aria-expanded', 'false');
      });
      menu.classList.toggle('open', willOpen);
      menuButton.setAttribute('aria-expanded', String(willOpen));
      return;
    }

    const student = getStudents().find((s) => s.id === btn.dataset.unenroll);
    if (!student) return;

    const cls = getClasses().find((c) => c.id === student.classId);
    pendingUnenrollId = student.id;
    document.getElementById('unenrollMessage').innerHTML =
      `Are you sure you want to unenroll <strong>${escapeHtml(student.name)}</strong>` +
      (cls ? ` from <strong>${escapeHtml(cls.name)}</strong>` : '') +
      `? They will be removed from the list.`;
    openModal('unenrollModal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#studentsTableBody .action-menu-wrap')) return;
    document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((menu) => {
      menu.classList.remove('open');
      menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('#studentsTableBody .action-dropdown.open').forEach((menu) => {
      menu.classList.remove('open');
      menu.previousElementSibling.setAttribute('aria-expanded', 'false');
    });
  });

  document.getElementById('addStudentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // IDs now match the HTML (studentName, studentEmail, studentCourse, studentYear)
    const name = document.getElementById('studentName')?.value.trim();
    const email = document.getElementById('studentEmail')?.value.trim();
    const course = normalizeCourseCode(document.getElementById('studentCourse')?.value || '');
    const year = yearLevelLabel(document.getElementById('studentYear')?.value || '');
    const section = document.getElementById('studentSection')?.value.trim() || '';
    const standing = document.getElementById('studentStanding')?.value === 'irregular' ? 'irregular' : 'regular';

    if (!name || !email) {
      showToast('Name and email required', 'error');
      return;
    }

    const list = getStudents();

    if (list.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      showToast('A student with that email already exists', 'error');
      return;
    }

    const classId = document.getElementById('studentClass')?.value || null;
    const cls = getClasses().find((item) => item.id === classId);
    const homeBlock = section || (standing === 'regular' ? (cls?.block || '') : '');
    list.push({
      id: uid('stu'), name, email, course, year, section: homeBlock, standing,
      classId, subjectCode: cls ? classSubjectCode(cls) : '',
      gpa: 0, status: 'active',
    });
    sbSet(SB_KEYS.STUDENTS, list);

    closeModal('addStudentModal');
    e.target.reset();
    showToast('Student added');
    render();
  });

  render();
  sbWhenReady(render);
});