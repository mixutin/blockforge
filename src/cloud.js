// Optional Kindlr Cloud client. The editor is fully static; these calls only work
// when the companion server (server/) is deployed behind /api/. Paths are relative to the page,
// so the editor also works when hosted under a sub-path.
// App root: pages served at clean nested URLs (/embed/<id>) are one level below it.
export const ROOT = new URL(/\/embed\/[^/]+\/?$/.test(location.pathname) ? '../' : './', location.href);
const API = new URL('api/', ROOT).pathname;
async function api(method, path, body) {
  let r;
  try { r = await fetch(API + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); }
  catch (e) { throw new Error('Cloud server unreachable'); }
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(r.status === 404 ? 'Cloud features are not available on this host' : `Server error (${r.status})`);
  const data = await r.json();
  if (!r.ok) { const e = new Error(data.error || `Request failed (${r.status})`); e.status = r.status; e.code = data.code; throw e; }
  return data;
}
const enc = encodeURIComponent;
export const cloud = {
  me: () => api('GET', 'me').then(d => d.user),
  signup: (username, email, password) => api('POST', 'signup', { username, email, password }).then(d => d.user),
  login: (username, password) => api('POST', 'login', { username, password }).then(d => d.user),
  logout: () => api('POST', 'logout'),
  verify: token => api('POST', 'verify', { token }),
  resendVerification: () => api('POST', 'verify/resend'),
  forgot: email => api('POST', 'password/forgot', { email }),
  reset: (token, password) => api('POST', 'password/reset', { token, password }),
  changePassword: (current_password, new_password) => api('POST', 'account/password', { current_password, new_password }),
  changeEmail: (email, password) => api('POST', 'account/email', { email, password }).then(d => d.user),
  deleteAccount: (password, confirm) => api('POST', 'account/delete', { password, confirm }),
  tokens: () => api('GET', 'tokens').then(d => d.tokens),
  createToken: name => api('POST', 'tokens', { name }),
  deleteToken: id => api('DELETE', 'tokens/' + enc(id)),
  list: () => api('GET', 'projects').then(d => d.projects),
  get: id => api('GET', 'projects/' + enc(id)).then(d => d.data),
  meta: id => api('GET', 'projects/' + enc(id)),
  save: (id, name, data) => (id ? api('PUT', 'projects/' + enc(id), { name, data }) : api('POST', 'projects', { name, data })),
  publish: (id, { title, description, notes }) => api('POST', `projects/${enc(id)}/share`, { public: true, confirm: true, title, description, notes }),
  unshare: id => api('DELETE', `projects/${enc(id)}/share`),
  remove: id => api('DELETE', 'projects/' + enc(id)),
  shared: id => api('GET', 'shared/' + enc(id)),
  sharedRaw: id => api('GET', 'shared/' + enc(id)).then(d => d.data),
  remix: id => api('POST', `shared/${enc(id)}/remix`, {}),
  explore: (page = 1, per = 24) => api('GET', `explore?page=${page}&per=${per}`),
};
// Links to public pages (relative, so they work on any host / sub-path).
export const pageUrl = (page, params = {}) => { const u = new URL(page, ROOT); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v); return u.href; };
export const shareUrl = shareId => pageUrl('p', { id: shareId });
// Dedicated embeddable route (the only Kindlr page that may be framed by other sites): /embed/<share-id>
export const embedUrl = shareId => new URL('embed/' + encodeURIComponent(shareId), ROOT).href;
