// Renders runtime UI widgets (button/label/text box/slider) as DOM over the stage (480x360 logical coords).
export function syncWidgets(root, rt) {
  if (root._v === rt.widgetsVersion) return; root._v = rt.widgetsVersion;
  const els = root._els || (root._els = new Map());
  for (const [n, el] of els) if (!rt.widgets.has(n)) { el.remove(); els.delete(n); }
  for (const w of rt.widgets.values()) {
    let el = els.get(w.name);
    if (!el || el._type !== w.type) { if (el) el.remove(); el = make(w, rt); els.set(w.name, el); root.appendChild(el); }
    el.style.left = (240 + w.x) + 'px'; el.style.top = (180 - w.y) + 'px';
    if (w.type === 'button' || w.type === 'label') { if (el.textContent !== w.text) el.textContent = w.text; }
    else if (w.type === 'textbox' && document.activeElement !== el && el.value !== w.value) el.value = w.value;
  }
}
function make(w, rt) {
  let el;
  if (w.type === 'button') { el = document.createElement('button'); el.onclick = () => rt.widgetEvent(w.name, 'click'); }
  else if (w.type === 'label') el = document.createElement('div');
  else if (w.type === 'textbox') {
    el = document.createElement('input'); el.type = 'text'; el.maxLength = 1000; el.placeholder = w.name;
    el.addEventListener('input', () => { const cur = rt.widgets.get(w.name); if (cur) cur.value = el.value; });
    el.addEventListener('change', () => rt.widgetEvent(w.name, 'change', el.value));
    el.addEventListener('keydown', e => e.stopPropagation());
  } else {
    el = document.createElement('input'); el.type = 'range'; el.min = w.min; el.max = w.max; el.step = 'any'; el.value = w.value;
    el.addEventListener('input', () => { const cur = rt.widgets.get(w.name); if (cur) cur.value = el.value; });
    el.addEventListener('change', () => rt.widgetEvent(w.name, 'change', el.value));
  }
  el._type = w.type; el.className = 'widget w-' + w.type; return el;
}
