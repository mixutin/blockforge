// Optional Blockforge Cloud client. The editor is fully static; these calls only work
// when the companion server (server/) is deployed behind /api/.
async function api(method, path, body) {
  let r;
  try { r = await fetch('/api/' + path, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); }
  catch (e) { throw new Error('Cloud server unreachable'); }
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(r.status === 404 ? 'Cloud features are not available on this host' : `Server error (${r.status})`);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
  return data;
}
export const cloud = {
  me: () => api('GET', 'me').then(d => d.user),
  signup: (username, password) => api('POST', 'signup', { username, password }).then(d => d.user),
  login: (username, password) => api('POST', 'login', { username, password }).then(d => d.user),
  logout: () => api('POST', 'logout'),
  list: () => api('GET', 'projects').then(d => d.projects),
  get: id => api('GET', 'projects/' + encodeURIComponent(id)).then(d => d.data),
  save: (id, name, data) => (id ? api('PUT', 'projects/' + id, { name, data }) : api('POST', 'projects', { name, data })),
  share: (id, pub) => api('POST', `projects/${id}/share`, { public: pub }),
  remove: id => api('DELETE', 'projects/' + id),
  sharedRaw: id => api('GET', 'shared/' + encodeURIComponent(id)).then(d => d.data),
};
