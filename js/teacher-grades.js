/**
 * StudyBuddy — Teacher Grades
 */
document.addEventListener('DOMContentLoaded', () => {
  const session = initShell('teacher');
  if (!session) return;

  let classFilter = '';
  let statusFilter = '';
  let search = '';
  let visibleGrades = [];
  const requestedGradeId = new URLSearchParams(window.location.search).get('grade');

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  const gradeClassFilter = document.getElementById('gradeClassFilter');
  function populateGradeClassFilter() {
    if (!gradeClassFilter) return;
    const selectedClass = classFilter || gradeClassFilter.value;
    const classes = getClasses();
    gradeClassFilter.innerHTML = '<option value="">All Classes</option>' + classes.map((cls) =>
      `<option value="${escapeHtml(cls.id)}">${escapeHtml(classDisplayName(cls))}</option>`
    ).join('');
    if (classes.some((cls) => String(cls.id) === selectedClass)) {
      gradeClassFilter.value = selectedClass;
      classFilter = selectedClass;
    } else {
      gradeClassFilter.value = '';
      classFilter = '';
    }
  }
  populateGradeClassFilter();

  function render() {
    let grades = getGrades();
    if (classFilter) {
      const cls = getClasses().find((item) => String(item.id) === classFilter);
      const labels = new Set([
        cls?.name, cls?.subject, classDisplayName(cls), classSubjectCode(cls),
      ].filter(Boolean));
      grades = grades.filter((grade) => String(grade.classId || '') === classFilter || labels.has(grade.class));
    }
    if (statusFilter) grades = grades.filter((grade) => grade.status === statusFilter);
    if (search) {
      const query = search.toLowerCase();
      grades = grades.filter((grade) =>
        [grade.student, grade.assignment, grade.class].some((value) => String(value || '').toLowerCase().includes(query))
      );
    }
    if (requestedGradeId) grades = grades.filter((grade) => String(grade.id) === requestedGradeId);
    visibleGrades = grades.slice();

    const all = getGrades();
    const vals = document.querySelectorAll('.stat-grid .stat-value');
    if (vals[0]) vals[0].textContent = all.length;
    if (vals[1]) vals[1].textContent = all.filter((g) => g.status === 'graded').length;
    if (vals[2]) vals[2].textContent = all.filter((g) => g.status === 'pending').length;
    const graded = all.filter((g) => g.score != null);
    const avg = graded.length ? Math.round(graded.reduce((s, g) => s + (g.score / g.max) * 100, 0) / graded.length) : 0;
    if (vals[3]) vals[3].textContent = avg + '%';

    const distributionChart = document.getElementById('gradeDistribution');
    if (distributionChart) {
      const distribution = [
        { label: 'F', minimum: 0, maximum: 60, color: 'danger' },
        { label: 'D', minimum: 60, maximum: 70, color: 'warning' },
        { label: 'C', minimum: 70, maximum: 80, color: 'info' },
        { label: 'B', minimum: 80, maximum: 90, color: 'primary' },
        { label: 'A', minimum: 90, maximum: null, color: 'success' },
      ].map((band) => ({
        ...band,
        count: all.filter((grade) => {
          if (grade.status !== 'graded' || grade.score == null || grade.score === '') return false;
          const score = Number(grade.score);
          const maximum = Number(grade.max);
          if (!Number.isFinite(score) || !Number.isFinite(maximum) || maximum <= 0) return false;
          const percentage = Math.min(100, Math.max(0, (score / maximum) * 100));
          return percentage >= band.minimum && (band.maximum === null || percentage < band.maximum);
        }).length,
      }));
      const highestCount = Math.max(0, ...distribution.map((band) => band.count));
      distributionChart.innerHTML = distribution.map((band) => {
        const height = highestCount ? Math.round((band.count / highestCount) * 100) : 0;
        const range = band.maximum === null ? `${band.minimum}–100%` : `${band.minimum}–${band.maximum}%`;
        return `
          <div class="bar-col">
            <span class="bar-val">${band.count}</span>
            <div class="bar" title="${band.label}: ${band.count} graded record${band.count === 1 ? '' : 's'} (${range})" style="height:${height}%;background:var(--${band.color})"></div>
            <span class="bar-label">${band.label}</span>
          </div>`;
      }).join('');
      distributionChart.setAttribute('aria-label', `Grade distribution: ${distribution.map((band) => `${band.label} ${band.count}`).join(', ')}`);
    }

    const tbody = document.querySelector('#gradesTable tbody') || document.getElementById('gradesTableBody');
    if (tbody) {
      tbody.innerHTML = grades.map((g) => `
        <tr data-id="${escapeHtml(g.id)}">
          <td>${escapeHtml(g.student)}</td>
          <td class="grade-assignment-cell">
            <div>${escapeHtml(g.assignment)}</div>
            <div class="grade-mobile-class">${escapeHtml(g.class)}</div>
          </td>
          <td class="grade-class-cell">${escapeHtml(g.class)}</td>
          <td class="grade-score-cell">
            <div class="grade-score-main">${g.status === 'pending'
              ? `<input type="number" class="form-control score-input" data-id="${escapeHtml(g.id)}" min="0" max="${Number(g.max) || 0}" placeholder="0–${Number(g.max) || 0}" />`
              : `<strong>${escapeHtml(g.score)}</strong>`}
              <span class="grade-score-max">/ ${escapeHtml(g.max)}</span>
            </div>
          </td>
          <td class="grade-status-cell"><span class="badge ${statusClass(g.status)}">${statusLabel(g.status)}</span></td>
          <td class="grade-submission-cell">${g.submission?.gradeId
            ? `<a href="../api/submissions.php?file=${encodeURIComponent(g.submission.gradeId)}">${escapeHtml(g.submission.fileName || 'Download file')}</a><div class="subtitle">${escapeHtml(g.submission.submittedAt ? new Date(g.submission.submittedAt).toLocaleString() : '')}</div>`
            : '—'}</td>
          <td class="grade-action-cell">
            ${g.status === 'pending'
              ? `<button type="button" class="btn btn-sm btn-primary" data-save="${escapeHtml(g.id)}">Save</button>`
              : `<button type="button" class="btn btn-sm btn-ghost" data-edit="${escapeHtml(g.id)}">Edit</button>`}
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-save]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.save;
          const input = tbody.querySelector(`.score-input[data-id="${id}"]`);
          const value = input?.value.trim() || '';
          const score = Number(value);
          const g = getGrades().find((x) => x.id === id);
          if (!g || value === '' || !Number.isFinite(score) || score < 0 || score > Number(g.max)) {
            showToast('Enter a score between 0 and the maximum points.', 'error');
            return;
          }
          updateGrade(id, { score, status: 'graded', gradedAt: new Date().toISOString() });
          showToast('Grade saved');
          render();
        });
      });
      tbody.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          updateGrade(btn.dataset.edit, { status: 'pending', score: null, gradedAt: null });
          render();
        });
      });
    }

    const pending = document.getElementById('pendingGradingList');
    if (pending) {
      pending.innerHTML = getGrades().filter((g) => g.status === 'pending').map((g) => `
        <div class="list-item">
          <div class="item-meta"><div class="item-title">${escapeHtml(g.student)}</div>
          <div class="item-sub">${escapeHtml(g.assignment)} · ${escapeHtml(g.class)}</div></div>
          <span class="badge badge-pending">Pending</span>
        </div>`).join('') || '<p style="color:var(--text-muted);font-size:13px">All caught up!</p>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function pdfPlainText(value) {
    return String(value ?? '')
      .replace(/[\r\n\t]+/g, ' ')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[–—]/g, '-')
      .replace(/[^\x20-\x7E]/g, '?');
  }

  function escapePdfText(value) {
    return pdfPlainText(value)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  function wrapPdfText(value, maxChars) {
    const text = pdfPlainText(value).replace(/\s+/g, ' ').trim();
    if (!text) return ['-'];
    const lines = [];
    let line = '';
    text.split(' ').forEach((wordValue) => {
      let word = wordValue;
      while (word.length > maxChars) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(word.slice(0, maxChars));
        word = word.slice(maxChars);
      }
      if (!word) return;
      if (!line) line = word;
      else if ((line + ' ' + word).length <= maxChars) line += ' ' + word;
      else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : ['-'];
  }

  function createGradesPdf(grades) {
    const pageWidth = 792;
    const margin = 36;
    const columnWidths = [120, 140, 95, 70, 65, 135, 95];
    const headers = ['Student', 'Assignment', 'Class', 'Score', 'Status', 'Submission', 'Submitted'];
    const generatedAt = new Date().toLocaleString();
    const pages = [];
    let commands = [];
    let cursorY = 0;

    const text = (x, y, value, fontSize = 9, bold = false, color = '0.12 0.17 0.25') => {
      commands.push(`BT /${bold ? 'F2' : 'F1'} ${fontSize} Tf ${color} rg ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
    };
    const line = (x1, y1, x2, y2, color = '0.82 0.85 0.9') => {
      commands.push(`${color} RG 0.5 w ${x1} ${y1} m ${x2} ${y2} l S`);
    };
    const startPage = (pageNumber) => {
      commands = [];
      text(margin, 570, 'StudyBuddy Grades Report', 18, true, '0.08 0.16 0.3');
      text(margin, 552, `Records: ${grades.length} | Generated: ${generatedAt} | Page ${pageNumber}`, 9, false, '0.35 0.4 0.48');
      commands.push(`0.12 0.25 0.45 rg ${margin} 512 ${pageWidth - margin * 2} 24 re f`);
      let x = margin;
      headers.forEach((header, index) => {
        text(x + 5, 521, header, 8, true, '1 1 1');
        x += columnWidths[index];
      });
      cursorY = 512;
    };
    const finishPage = () => pages.push(commands.join('\n'));

    startPage(1);
    grades.forEach((grade, rowIndex) => {
      const submittedAt = grade.submission?.submittedAt
        ? new Date(grade.submission.submittedAt)
        : null;
      const cells = [
        grade.student || '—',
        grade.assignment || '—',
        grade.class || '—',
        grade.score === null || grade.score === undefined || grade.score === ''
          ? `Pending / ${grade.max ?? '—'}`
          : `${grade.score} / ${grade.max ?? '—'}`,
        statusLabel(grade.status),
        grade.submission?.fileName || '—',
        submittedAt && !Number.isNaN(submittedAt.getTime()) ? submittedAt.toLocaleString() : '—',
      ];
      const wrapped = cells.map((cell, index) => wrapPdfText(cell, Math.max(8, Math.floor((columnWidths[index] - 10) / 4.5))));
      const rowHeight = Math.max(28, Math.max(...wrapped.map((cell) => cell.length)) * 11 + 10);
      if (cursorY - rowHeight < 36) {
        finishPage();
        startPage(pages.length + 1);
      }
      const bottomY = cursorY - rowHeight;
      if (rowIndex % 2 === 1) {
        commands.push(`0.96 0.97 0.99 rg ${margin} ${bottomY} ${pageWidth - margin * 2} ${rowHeight} re f`);
      }
      let x = margin;
      wrapped.forEach((cellLines, index) => {
        cellLines.forEach((cellLine, lineIndex) => {
          text(x + 5, cursorY - 14 - lineIndex * 11, cellLine, 8);
        });
        x += columnWidths[index];
      });
      line(margin, bottomY, pageWidth - margin, bottomY);
      cursorY = bottomY;
    });
    finishPage();

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    ];
    pages.forEach((content, index) => {
      const pageObjectId = 5 + index * 2;
      const contentObjectId = pageObjectId + 1;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 612] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
      );
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  document.getElementById('exportGradesBtn')?.addEventListener('click', () => {
    if (!visibleGrades.length) {
      showToast('There are no grade records to export.', 'error');
      return;
    }
    try {
      const pdfUrl = URL.createObjectURL(createGradesPdf(visibleGrades));
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = `studybuddy-grades-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      showToast('Grades PDF downloaded');
    } catch (error) {
      console.error('Could not generate the grade report PDF.', error);
      showToast('The grade report PDF could not be generated. Please try again.', 'error');
    }
  });

  document.getElementById('gradeClassFilter')?.addEventListener('change', (e) => {
    classFilter = e.target.value;
    render();
  });
  document.getElementById('gradeStatusFilter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });
  document.getElementById('gradeSearch')?.addEventListener('input', (e) => {
    search = e.target.value.trim();
    render();
  });

  render();
  sbWhenReady(() => {
    populateGradeClassFilter();
    render();
    if (requestedGradeId) {
      const tbody = document.querySelector('#gradesTable tbody') || document.getElementById('gradesTableBody');
      [...(tbody?.querySelectorAll('tr') || [])]
        .find((row) => row.dataset.id === requestedGradeId)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  window.addEventListener('focus', () => {
    sbInvalidate(SB_KEYS.GRADES, SB_KEYS.CLASSES);
    populateGradeClassFilter();
    render();
  });
});
