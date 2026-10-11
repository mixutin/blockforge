// Original line icons for the toolbar (24x24, stroke = currentColor). Static, trusted markup.
const s = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
export const ICONS = {
  new: s('<path d="M6 3h8l4 4v14H6z"/><path d="M12 10v7M8.5 13.5h7"/>'),
  open: s('<path d="M3 7h6l2 2h10v10H3z"/><path d="M3 7V5h6"/>'),
  save: s('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M4 19h16"/>'),
  examples: s('<rect x="3" y="4" width="8" height="7" rx="2"/><rect x="13" y="4" width="8" height="7" rx="2"/><rect x="3" y="13" width="8" height="7" rx="2"/><path d="M17 14v6M14 17h6"/>'),
  cloud: s('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>'),
  explore: s('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
  share: s('<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>'),
  user: s('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  warn: s('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'),
  theme: s('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/>'),
  full: s('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  play: s('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  more: s('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
  caret: s('<path d="M7 10l5 5 5-5"/>', ' width="14" height="14"'),
};
/** Put an icon + a collapsible label into a button: <svg/><span class="lbl">Label</span> */
export function iconize(el, icon, label) { el.innerHTML = ICONS[icon] || ''; if (label) { const l = document.createElement('span'); l.className = 'lbl'; l.textContent = label; el.appendChild(l); el.setAttribute('aria-label', label); } }
