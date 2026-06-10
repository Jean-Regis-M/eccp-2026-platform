import { Router } from 'express';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { computeScore } from './users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1] || dateStr;
}

function getWeekDates(start, end) {
  const dates = [];
  let cur = new Date(start + 'T12:00:00');
  const endD = new Date(end + 'T12:00:00');
  while (cur <= endD) {
    if (cur.getDay() !== 0) dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates.slice(0, 6);
}

function buildMentorReportData(mentorId, weekStart, weekEnd) {
  const mentor = db.prepare('SELECT * FROM users WHERE id = ?').get(mentorId);
  const mentees = db.prepare('SELECT * FROM users WHERE mentor_id = ? AND role = ? AND is_active = 1').all(mentorId, 'mentee');
  const weekDates = getWeekDates(weekStart, weekEnd);
  const sessions = db.prepare('SELECT * FROM sessions WHERE date BETWEEN ? AND ? AND COALESCE(is_deleted,0)=0 ORDER BY date').all(weekStart, weekEnd);

  const sessionByDate = {};
  for (const s of sessions) sessionByDate[s.date] = s;

  const attendanceGrid = mentees.map(m => {
    const days = {};
    for (const date of weekDates) {
      const sess = sessionByDate[date];
      if (sess) {
        const att = db.prepare('SELECT attended FROM attendance WHERE session_id = ? AND user_id = ?').get(sess.id, m.id);
        days[date] = att?.attended ? 'P' : 'A';
      } else {
        days[date] = '—';
      }
    }
    const missed = Object.values(days).filter(v => v === 'A').length;
    const score = computeScore(m.id);
    const profileDone = m.profile_completed;
    const feedbackCount = db.prepare('SELECT COUNT(*) as c FROM feedback WHERE user_id = ?').get(m.id).c;
    const needsFollowUp = missed >= 2 || !profileDone || score < 30;
    return { ...m, days, missed, score, needsFollowUp, feedbackCount };
  });

  const followUp = attendanceGrid.filter(m => m.needsFollowUp);
  const saved = db.prepare('SELECT * FROM mentor_weekly_reports WHERE mentor_id = ? AND week_start = ? AND week_end = ?')
    .get(mentorId, weekStart, weekEnd);

  const engagement = attendanceGrid.map(m => {
    const pd = JSON.parse(m.profile_data || '{}');
    return {
      name: m.name,
      pf: m.pf_number,
      score: m.score,
      profile: m.profile_completed ? 'Complete' : 'Incomplete',
      career: pd.career_interests || '—',
      goals: pd.goals || '—',
      feedbackCount: m.feedbackCount,
    };
  });

  return { mentor, weekDates, sessions, attendanceGrid, followUp, engagement, saved };
}

router.get('/mentor/preview', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const weekStart = req.query.week_start || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekEnd = req.query.week_end || new Date().toISOString().split('T')[0];
  const mentorId = req.user.role === 'mentor' ? req.user.id : parseInt(req.query.mentor_id) || req.user.id;
  res.json(buildMentorReportData(mentorId, weekStart, weekEnd));
});

router.post('/mentor/save', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const { week_start, week_end, challenges, actions_taken, recommendations, goals_next_week, reflections } = req.body;
  const mentorId = req.user.id;
  db.prepare(`
    INSERT INTO mentor_weekly_reports (mentor_id, week_start, week_end, challenges, actions_taken, recommendations, goals_next_week, reflections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mentor_id, week_start, week_end) DO UPDATE SET
    challenges = ?, actions_taken = ?, recommendations = ?, goals_next_week = ?, reflections = ?, submitted_at = datetime('now')
  `).run(mentorId, week_start, week_end, challenges || '', actions_taken || '', recommendations || '', goals_next_week || '', reflections || '',
    challenges || '', actions_taken || '', recommendations || '', goals_next_week || '', reflections || '');
  res.json({ message: 'Report saved' });
});

const PDF_MARGIN = 50;
const PDF_CONTENT_WIDTH = 495;

function pdfResetX(doc) {
  doc.x = PDF_MARGIN;
}

function pdfEnsureSpace(doc, needed = 60) {
  if (doc.y + needed > doc.page.height - PDF_MARGIN) {
    doc.addPage();
    pdfResetX(doc);
  }
}

function pdfSection(doc, num, title) {
  pdfEnsureSpace(doc, 40);
  doc.moveDown(0.6);
  pdfResetX(doc);
  doc.fillColor('#C8102E').font('Helvetica-Bold').fontSize(11)
    .text(`Section ${num}: ${title}`, PDF_MARGIN, doc.y, { width: PDF_CONTENT_WIDTH, align: 'left' });
  doc.fillColor('#000').font('Helvetica').fontSize(10);
  doc.moveDown(0.4);
  pdfResetX(doc);
}

function pdfSubheading(doc, title) {
  pdfEnsureSpace(doc, 30);
  doc.moveDown(0.3);
  pdfResetX(doc);
  doc.fillColor('#1A1A2E').font('Helvetica-Bold').fontSize(10)
    .text(title, PDF_MARGIN, doc.y, { width: PDF_CONTENT_WIDTH, align: 'left' });
  doc.fillColor('#000').font('Helvetica').fontSize(9);
  doc.moveDown(0.3);
  pdfResetX(doc);
}

function pdfBody(doc, text, opts = {}) {
  pdfEnsureSpace(doc, 24);
  pdfResetX(doc);
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.size || 10)
    .fillColor(opts.color || '#000')
    .text(text || '(Not yet filled by mentor)', PDF_MARGIN, doc.y, {
      width: PDF_CONTENT_WIDTH,
      align: 'left',
      lineGap: 2,
    });
  pdfResetX(doc);
  if (opts.gap !== false) doc.moveDown(0.2);
}

function pdfDrawAttendanceTable(doc, data) {
  const scholarW = 95;
  const missedW = 36;
  const dayCount = Math.max(data.weekDates.length, 1);
  const dayW = Math.floor((PDF_CONTENT_WIDTH - scholarW - missedW) / dayCount);
  const rowH = 13;

  pdfEnsureSpace(doc, 30 + data.attendanceGrid.length * rowH);
  let y = doc.y;

  const drawRow = (cells, bold = false) => {
    pdfEnsureSpace(doc, rowH + 10);
    if (y > doc.page.height - PDF_MARGIN - rowH) {
      doc.addPage();
      y = PDF_MARGIN;
    }
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    let x = PDF_MARGIN;
    cells.forEach(({ text, width, align, color }) => {
      doc.fillColor(color || '#000').text(text, x, y, { width, align: align || 'left', lineBreak: false });
      x += width;
    });
    y += rowH;
  };

  const headerCells = [
    { text: 'Scholar', width: scholarW },
    ...data.weekDates.map(d => ({ text: getDayName(d).slice(0, 3), width: dayW, align: 'center' })),
    { text: 'Missed', width: missedW, align: 'center' },
  ];
  drawRow(headerCells, true);

  for (const m of data.attendanceGrid) {
    const dayCells = data.weekDates.map(date => {
      const val = m.days[date] || '—';
      const color = val === 'P' ? '#16a34a' : val === 'A' ? '#dc2626' : '#999';
      return { text: val, width: dayW, align: 'center', color };
    });
    drawRow([
      { text: m.name.slice(0, 24), width: scholarW },
      ...dayCells,
      { text: String(m.missed), width: missedW, align: 'center' },
    ]);
  }

  doc.y = y + 6;
  pdfResetX(doc);
}

router.get('/mentor/pdf', authenticate, requireRole('admin', 'mentor'), (req, res) => {
  const weekStart = req.query.week_start || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekEnd = req.query.week_end || new Date().toISOString().split('T')[0];
  const mentorId = req.user.role === 'mentor' ? req.user.id : parseInt(req.query.mentor_id) || req.user.id;
  const data = buildMentorReportData(mentorId, weekStart, weekEnd);
  const saved = data.saved || {};
  const submitDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali' }).format(new Date());

  const doc = new PDFDocument({ margin: PDF_MARGIN, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ECCP-Weekly-Report-${weekStart}.pdf`);
  doc.pipe(res);

  const logoPaths = [
    path.join(__dirname, '..', '..', 'public', 'logo.png'),
    path.join(__dirname, '..', '..', 'dist', 'logo.png'),
  ];
  for (const lp of logoPaths) {
    if (fs.existsSync(lp)) {
      try { doc.image(lp, PDF_MARGIN, 42, { width: 55 }); } catch { /* skip */ }
      break;
    }
  }

  doc.fillColor('#C8102E').fontSize(11).text('EQUITY LEADERS PROGRAM', 120, 48, { width: 400, lineBreak: false });
  doc.fillColor('#1A1A2E').fontSize(16).font('Helvetica-Bold').text('College Counselling Program (ECCP)', 120, 63, { width: 400, lineBreak: false });
  doc.fontSize(13).text('WEEKLY MENTORSHIP REPORT', 120, 83, { width: 400, lineBreak: false });
  doc.fontSize(9).font('Helvetica').fillColor('#666').text('Executive Monitoring & Compliance Document', 120, 100, { width: 400, lineBreak: false });

  doc.y = 128;
  pdfResetX(doc);
  doc.fillColor('#000').font('Helvetica').fontSize(10);
  pdfBody(doc, `Mentor Name: ${data.mentor.name}`, { gap: false });
  pdfBody(doc, `Reporting Week: ${weekStart} to ${weekEnd}`, { gap: false });
  pdfBody(doc, `Date of Submission: ${submitDate}`, { gap: false });
  doc.moveDown(0.5);

  // Section 1 — Attendance
  pdfSection(doc, 1, 'Attendance Summary & Scholar Engagement Dashboard');
  pdfDrawAttendanceTable(doc, data);

  pdfSubheading(doc, 'Follow-up & Intervention Tracker');
  if (data.followUp.length === 0) {
    pdfBody(doc, 'All scholars are on track this week.');
  } else {
    for (const m of data.followUp) {
      pdfBody(doc, `[!] ${m.name} (PF ${m.pf_number}) — Missed: ${m.missed}, Score: ${m.score}, Profile: ${m.profile_completed ? 'Complete' : 'Incomplete'}`, { size: 9 });
    }
  }

  // Section 2 — Sessions
  pdfSection(doc, 2, 'Session Summaries & Topics Covered (Mon–Sat)');
  if (data.sessions.length === 0) {
    pdfBody(doc, 'No sessions recorded this week.');
  } else {
    for (const s of data.sessions) {
      pdfBody(doc, `${getDayName(s.date)} (${s.date}): ${s.topic}`, { bold: true, gap: false });
      pdfBody(doc, s.description || 'No description provided.');
    }
  }

  // Section 3 — Engagement
  pdfSection(doc, 3, 'Scholar Engagement Analysis & Academic Progress');
  for (const e of data.engagement) {
    pdfBody(doc, `${e.name} | PF ${e.pf} | Score: ${e.score} | Profile: ${e.profile} | Feedback entries: ${e.feedbackCount}`, { gap: false });
    pdfBody(doc, `Career interests: ${e.career} | Goals: ${(e.goals || '—').slice(0, 120)}`);
  }

  // Sections 4–8 — Mentor narrative (saved form data)
  pdfSection(doc, 4, 'Challenges Encountered');
  pdfBody(doc, saved.challenges);

  pdfSection(doc, 5, 'Actions Taken');
  pdfBody(doc, saved.actions_taken);

  pdfSection(doc, 6, 'Recommendations & Strategic Adjustments');
  pdfBody(doc, saved.recommendations);

  pdfSection(doc, 7, 'Goals for Next Week');
  pdfBody(doc, saved.goals_next_week);

  pdfSection(doc, 8, 'Mentorship Reflections & 360-Degree Support Notes');
  pdfBody(doc, saved.reflections);

  // Section 9 — Declaration
  pdfSection(doc, 9, 'Mentor Declaration & Compliance Statement');
  pdfBody(doc,
    'I hereby confirm that the information provided in this weekly report is accurate, truthful, and complies with the Equity College Counselling Mentor Guidelines 2026 (sections on confidentiality, professional boundaries, and scholar support). I understand that misrepresentation may lead to disciplinary action as outlined in the mentor contract.',
    { size: 9 }
  );
  doc.moveDown(1);
  pdfBody(doc, `Mentor Signature: _________________________    Date: ${submitDate}`, { size: 9, gap: false });
  pdfBody(doc, `Printed Name: ${data.mentor.name}`, { size: 9, bold: true });

  doc.end();
});

export default router;
