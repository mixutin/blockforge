// Rules for new usernames (login still accepts legacy names): 3-20 chars [a-z0-9_], stored lowercase, unique case-insensitively.
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED_USERNAMES = new Set(['admin', 'administrator', 'root', 'support', 'kindlr', 'blockforge', 'api', 'www', 'mail', 'noreply', 'no_reply',
  'staff', 'moderator', 'mod', 'system', 'security', 'help', 'official', 'team', 'null', 'undefined', 'me', 'u', 'p', 'explore', 'docs', 'embed', 'login',
  'signup', 'logout', 'verify', 'reset', 'settings', 'account', 'assets', 'player', 'run', 'static']);
export function checkNewUsername(v) {
  if (typeof v !== 'string') return { error: 'Username required' };
  const name = v.trim().toLowerCase();
  if (!USERNAME_RE.test(name)) return { error: 'Username must be 3–20 characters: a–z, 0–9 or _' };
  if (RESERVED_USERNAMES.has(name)) return { error: 'That username is reserved' };
  return { name };
}
