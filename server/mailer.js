// Outgoing mail for Kindlr (verification, password reset, notices).
// Production: SMTP to a local MTA (no auth). Dev / MAIL_TRANSPORT=log: links are printed to stdout instead.
import nodemailer from 'nodemailer';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Original Kindlr wordmark built from table cells (SVG/remote images are unreliable in mail clients).
function layout(title, introHtml, button, footHtml) {
  const block = c => `<td style="width:14px;height:14px;background:${c};border-radius:4px"></td><td style="width:3px"></td>`;
  return `<!doctype html><html><body style="margin:0;background:#f3f1f8;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#25213a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3def0">
<tr><td style="background:#1d1a2e;padding:18px 24px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
${block('#F28A2E')}${block('#4C7EF3')}${block('#3DBE6A')}<td style="padding-left:10px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:.3px">Kindlr</td></tr></table></td></tr>
<tr><td style="padding:26px 24px 8px"><h1 style="margin:0 0 12px;font-size:20px">${esc(title)}</h1>${introHtml}</td></tr>
<tr><td style="padding:8px 24px 18px"><a href="${esc(button.url)}" style="display:inline-block;background:#ff7a2f;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${esc(button.label)}</a>
<p style="font-size:12px;color:#6b6585;margin:16px 0 0">Or paste this link into your browser:<br><span style="word-break:break-all">${esc(button.url)}</span></p></td></tr>
<tr><td style="padding:14px 24px 22px;border-top:1px solid #eee9f6;font-size:12px;color:#6b6585">${footHtml}</td></tr>
</table></td></tr></table></body></html>`;
}

export function createMailer({ logOnly, host, port, from, publicUrl, log = console.log, onError = console.error }) {
  const base = publicUrl.replace(/\/+$/, '');
  const loopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
  const transport = logOnly ? null : nodemailer.createTransport({
    host, port, secure: port === 465,
    ignoreTLS: loopback,               // local Postfix on loopback: plain SMTP, no auth
    disableFileAccess: true, disableUrlAccess: true,
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });

  async function deliver(to, subject, text, html, link) {
    if (logOnly) { log(`[mail] to=${to} subject="${subject}"${link ? ` link=${link}` : ''}`); return; }
    try { await transport.sendMail({ from, to, subject, text, html, headers: { 'Auto-Submitted': 'auto-generated' } }); }
    catch (e) { onError(`[mail] delivery failed (${subject}): ${e.message}`); }
  }

  return {
    verifyLink: t => `${base}/verify?token=${encodeURIComponent(t)}`,
    resetLink: t => `${base}/reset?token=${encodeURIComponent(t)}`,
    sendVerify(to, username, token) {
      const url = this.verifyLink(token);
      const text = `Hi ${username},\n\nWelcome to Kindlr! Please confirm your email address so you can publish projects and create API tokens:\n\n${url}\n\nThis link works once and expires in 24 hours. If you didn't create a Kindlr account, you can ignore this email.\n\n— Kindlr\n${base}\n`;
      const html = layout('Confirm your email', `<p style="margin:0 0 10px">Hi <b>${esc(username)}</b>,</p><p style="margin:0">Welcome to Kindlr! Confirm your email address so you can publish projects and create API tokens.</p>`,
        { url, label: 'Confirm email' }, `This link works once and expires in 24 hours. If you didn't create a Kindlr account, you can ignore this email.`);
      return deliver(to, 'Confirm your Kindlr email', text, html, url);
    },
    sendReset(to, username, token) {
      const url = this.resetLink(token);
      const text = `Hi ${username},\n\nSomeone (hopefully you) asked to reset the password for the Kindlr account "${username}". Choose a new password here:\n\n${url}\n\nThis link works once and expires in 1 hour. Resetting signs you out everywhere. If you didn't ask for this, ignore this email; your password stays the same.\n\n— Kindlr\n${base}\n`;
      const html = layout('Reset your password', `<p style="margin:0 0 10px">Hi <b>${esc(username)}</b>,</p><p style="margin:0">Someone (hopefully you) asked to reset the password for the Kindlr account <b>${esc(username)}</b>.</p>`,
        { url, label: 'Choose a new password' }, `This link works once and expires in 1 hour. Resetting signs you out everywhere. If you didn't ask for this, ignore this email; your password stays the same.`);
      return deliver(to, 'Reset your Kindlr password', text, html, url);
    },
    sendEmailChanged(to, username) {
      const text = `Hi ${username},\n\nThe email address on your Kindlr account was just changed. If this was you, there's nothing to do.\nIf it wasn't, reset your password right away at ${base}/ (Sign in > Forgot password) using this address.\n\n— Kindlr\n`;
      const html = layout('Your email address was changed', `<p style="margin:0 0 10px">Hi <b>${esc(username)}</b>,</p><p style="margin:0">The email address on your Kindlr account was just changed. If this was you, there's nothing to do. If it wasn't, reset your password right away.</p>`,
        { url: base + '/', label: 'Open Kindlr' }, 'You received this security notice because this address was on the account.');
      return deliver(to, 'Your Kindlr email was changed', text, html, null);
    },
  };
}
