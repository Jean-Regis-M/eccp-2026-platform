import nodemailer from 'nodemailer';
import db from '../db.js';

function getSmtpSettings() {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'smtp_%'").all();
  const s = {};
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export async function sendEmail({ to, subject, body, sentBy = null }) {
  const smtp = getSmtpSettings();
  const host = smtp.smtp_host || process.env.SMTP_HOST;
  const user = smtp.smtp_user || process.env.SMTP_USER;
  const pass = smtp.smtp_pass || process.env.SMTP_PASS;
  const port = parseInt(smtp.smtp_port || process.env.SMTP_PORT || '587', 10);

  if (!host || !user || !pass) {
    db.prepare('INSERT INTO email_log (to_email, subject, status, sent_by) VALUES (?, ?, ?, ?)')
      .run(to, subject, 'queued_no_smtp', sentBy);
    return { sent: false, status: 'queued', message: 'SMTP not configured — email queued for manual send' };
  }

  try {
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
    await transporter.sendMail({
      from: smtp.smtp_from || user,
      to,
      subject,
      text: body,
    });
    db.prepare('INSERT INTO email_log (to_email, subject, status, sent_by) VALUES (?, ?, ?, ?)')
      .run(to, subject, 'sent', sentBy);
    return { sent: true, status: 'sent' };
  } catch (err) {
    db.prepare('INSERT INTO email_log (to_email, subject, status, sent_by) VALUES (?, ?, ?, ?)')
      .run(to, subject, `failed: ${err.message}`, sentBy);
    return { sent: false, status: 'failed', message: err.message };
  }
}

export async function sendBulkEmails(emails, sentBy = null) {
  const results = [];
  for (const e of emails) {
    results.push({ to: e.to, ...(await sendEmail({ ...e, sentBy })) });
  }
  return results;
}
