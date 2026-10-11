// Original Kindlr art — all hand-designed simple SVG shapes.
export const svgUrl = (w, h, inner) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`);
const C = (name, w, h, inner, cx = w / 2, cy = h / 2) => ({ name, src: svgUrl(w, h, inner), w, h, cx, cy });

const eyes = (y, dx = 11, r = 7, lookX = 2) => `
  <ellipse cx="${50 - dx}" cy="${y}" rx="${r}" ry="${r + 2}" fill="#fff"/><ellipse cx="${50 + dx}" cy="${y}" rx="${r}" ry="${r + 2}" fill="#fff"/>
  <circle cx="${50 - dx + lookX}" cy="${y + 1}" r="${r * 0.5}" fill="#1b1b2f"/><circle cx="${50 + dx + lookX}" cy="${y + 1}" r="${r * 0.5}" fill="#1b1b2f"/>
  <circle cx="${50 - dx + lookX + 1.5}" cy="${y - 1}" r="1.4" fill="#fff"/><circle cx="${50 + dx + lookX + 1.5}" cy="${y - 1}" r="1.4" fill="#fff"/>`;

// Sparky: the Kindlr mascot — a friendly flame spirit
const sparkyBody = (squash = 0) => `
  <defs><radialGradient id="g" cx="50%" cy="65%" r="60%"><stop offset="0" stop-color="#FFD166"/><stop offset=".55" stop-color="#FF8C42"/><stop offset="1" stop-color="#E4572E"/></radialGradient></defs>
  <path d="M50 ${6 + squash} C62 ${22 + squash} 70 ${18 + squash} 72 ${8 + squash} C86 ${30 + squash} 92 50 90 ${66} C88 ${90 - squash / 2} 70 ${100 - squash / 2} 50 ${100 - squash / 2} C30 ${100 - squash / 2} 12 ${90 - squash / 2} 10 66 C8 46 18 ${30 + squash} 30 ${18 + squash} C32 ${28 + squash} 38 ${30 + squash} 42 ${26 + squash} C40 ${18 + squash} 44 ${10 + squash} 50 ${6 + squash}Z" fill="url(#g)" stroke="#B8341B" stroke-width="3" stroke-linejoin="round"/>
  ${eyes(62 + squash / 3)}
  <path d="M40 ${80 + squash / 4} Q50 ${88 + squash / 4} 60 ${80 + squash / 4}" stroke="#7a1f0e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="30" cy="${76 + squash / 4}" rx="5" ry="3" fill="#ff6b6b" opacity=".6"/><ellipse cx="70" cy="${76 + squash / 4}" rx="5" ry="3" fill="#ff6b6b" opacity=".6"/>`;
export const sparky = [C('sparky-a', 100, 106, sparkyBody(0)), C('sparky-b', 100, 106, sparkyBody(10))];

// Bolt: a tiny robot
const boltBody = (arm) => `
  <line x1="50" y1="4" x2="50" y2="18" stroke="#5b6b82" stroke-width="3"/><circle cx="50" cy="6" r="5" fill="#FF5D73"/>
  <rect x="20" y="18" width="60" height="44" rx="12" fill="#8FD3FE" stroke="#2f4a6d" stroke-width="3"/>
  <rect x="28" y="28" width="44" height="22" rx="8" fill="#1d2b44"/>
  <circle cx="40" cy="39" r="5" fill="#7CFFCB"/><circle cx="60" cy="39" r="5" fill="#7CFFCB"/>
  <rect x="26" y="64" width="48" height="34" rx="8" fill="#C5D5EA" stroke="#2f4a6d" stroke-width="3"/>
  <circle cx="50" cy="80" r="6" fill="#FFB547" stroke="#2f4a6d" stroke-width="2"/>
  <path d="M26 72 L${arm ? 8 : 12} ${arm ? 58 : 90}" stroke="#2f4a6d" stroke-width="5" stroke-linecap="round"/>
  <path d="M74 72 L${arm ? 92 : 88} ${arm ? 58 : 90}" stroke="#2f4a6d" stroke-width="5" stroke-linecap="round"/>`;
export const bolt = [C('bolt-a', 100, 102, boltBody(false)), C('bolt-b', 100, 102, boltBody(true))];

const starPts = (cx, cy, R, r, n = 5) => Array.from({ length: n * 2 }, (_, i) => {
  const a = Math.PI / n * i - Math.PI / 2, rr = i % 2 ? r : R; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
export const star = [C('star', 60, 60, `<polygon points="${starPts(30, 32, 28, 12)}" fill="#FFD23F" stroke="#E09F00" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="30" r="2.5" fill="#5a3d00"/><circle cx="36" cy="30" r="2.5" fill="#5a3d00"/>`)];
export const gem = [C('gem', 56, 50, `<polygon points="12,4 44,4 54,18 28,48 2,18" fill="#5EE6EB" stroke="#1C7C8C" stroke-width="3" stroke-linejoin="round"/><polyline points="2,18 54,18" stroke="#1C7C8C" stroke-width="2" fill="none"/><polygon points="12,4 20,18 28,4 36,18 44,4" fill="#B8FBFF" opacity=".7"/>`)];
export const ball = [C('ball', 50, 50, `<circle cx="25" cy="25" r="22" fill="#FF5D73" stroke="#A0213A" stroke-width="3"/><path d="M5 22 Q25 34 45 22" stroke="#fff" stroke-width="3" fill="none"/><circle cx="17" cy="15" r="5" fill="#fff" opacity=".5"/>`)];
export const rocket = [C('rocket', 60, 100, `<path d="M30 4 C46 18 50 40 46 70 L14 70 C10 40 14 18 30 4Z" fill="#EDF2FB" stroke="#3a4a6b" stroke-width="3"/><circle cx="30" cy="36" r="9" fill="#4C7EF3" stroke="#3a4a6b" stroke-width="3"/><path d="M14 56 L2 80 L16 72Z M46 56 L58 80 L44 72Z" fill="#FF5D73" stroke="#3a4a6b" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 72 Q30 100 40 72Z" fill="#FFB547"/>`, 30, 50),
  C('rocket-boost', 60, 100, `<path d="M30 4 C46 18 50 40 46 70 L14 70 C10 40 14 18 30 4Z" fill="#EDF2FB" stroke="#3a4a6b" stroke-width="3"/><circle cx="30" cy="36" r="9" fill="#4C7EF3" stroke="#3a4a6b" stroke-width="3"/><path d="M14 56 L2 80 L16 72Z M46 56 L58 80 L44 72Z" fill="#FF5D73" stroke="#3a4a6b" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 72 Q30 112 42 72Z" fill="#FF5D2E"/><path d="M23 72 Q30 96 37 72Z" fill="#FFE066"/>`, 30, 50)];
export const fish = [C('fish', 90, 56, `<path d="M8 28 C24 4 58 4 72 28 C58 52 24 52 8 28Z" fill="#FF9F1C" stroke="#9c5a00" stroke-width="3"/><path d="M70 28 L88 10 L84 28 L88 46Z" fill="#FFBF69" stroke="#9c5a00" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="24" r="5" fill="#fff"/><circle cx="23" cy="24" r="2.5" fill="#222"/><path d="M38 16 Q46 28 38 40" stroke="#9c5a00" stroke-width="2" fill="none"/>`)];
export const paddle = [C('paddle', 110, 22, `<rect x="2" y="2" width="106" height="18" rx="9" fill="#7C5CFF" stroke="#3b2a99" stroke-width="3"/>`)];
export const heart = [C('heart', 60, 54, `<path d="M30 50 C4 32 2 14 14 7 C22 2 28 8 30 13 C32 8 38 2 46 7 C58 14 56 32 30 50Z" fill="#FF4D6D" stroke="#9d0b28" stroke-width="3" stroke-linejoin="round"/>`)];
export const cloud = [C('cloud', 120, 64, `<path d="M24 56 C6 56 4 34 22 32 C20 14 46 8 54 22 C62 6 92 10 90 30 C110 28 116 56 96 56Z" fill="#fff" stroke="#9bb0c9" stroke-width="3"/>`)];
export const arrow = [C('pointer', 60, 40, `<path d="M4 14 L36 14 L36 4 L56 20 L36 36 L36 26 L4 26Z" fill="#3DBE6A" stroke="#1d6b38" stroke-width="3" stroke-linejoin="round"/>`)];

const B = (name, inner) => C(name, 480, 360, inner);
export const backdrops = {
  blank: B('blank', `<rect width="480" height="360" fill="#ffffff"/>`),
  night: B('night sky', `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset="1" stop-color="#2b2f77"/></linearGradient></defs><rect width="480" height="360" fill="url(#s)"/>` +
    Array.from({ length: 60 }, (_, i) => `<circle cx="${(i * 97) % 480}" cy="${(i * 53) % 300}" r="${(i % 3) * 0.6 + 0.6}" fill="#fff" opacity="${0.4 + (i % 5) / 8}"/>`).join('') +
    `<circle cx="400" cy="70" r="30" fill="#F8F4D2"/><circle cx="388" cy="62" r="6" fill="#e5dfb3"/><path d="M0 330 Q120 290 240 320 T480 310 V360 H0Z" fill="#141a3d"/>`),
  meadow: B('meadow', `<defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7EC8F8"/><stop offset="1" stop-color="#D6F0FF"/></linearGradient></defs><rect width="480" height="360" fill="url(#m)"/><circle cx="70" cy="60" r="32" fill="#FFE27A"/><path d="M0 250 Q120 200 240 240 T480 225 V360 H0Z" fill="#7BCB6B"/><path d="M0 290 Q160 250 300 290 T480 280 V360 H0Z" fill="#5BAF4E"/>` +
    Array.from({ length: 14 }, (_, i) => `<circle cx="${20 + i * 34}" cy="${320 + (i % 3) * 10}" r="4" fill="${['#ff7aa2', '#fff', '#ffd23f'][i % 3]}"/>`).join('')),
  grid: B('blueprint', `<rect width="480" height="360" fill="#16325c"/>` + Array.from({ length: 25 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="360" stroke="#2e5a94" stroke-width="${i % 4 === 0 ? 1.5 : .5}"/>`).join('') + Array.from({ length: 19 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="480" y2="${i * 20}" stroke="#2e5a94" stroke-width="${i % 4 === 2 ? 1.5 : .5}"/>`).join('') + `<line x1="240" y1="0" x2="240" y2="360" stroke="#6fa8ff" stroke-width="1.5"/><line x1="0" y1="180" x2="480" y2="180" stroke="#6fa8ff" stroke-width="1.5"/>`),
  sunset: B('sunset', `<defs><linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1c71"/><stop offset=".5" stop-color="#d76d77"/><stop offset="1" stop-color="#ffaf7b"/></linearGradient></defs><rect width="480" height="360" fill="url(#u)"/><circle cx="240" cy="250" r="70" fill="#FFD27F" opacity=".9"/><path d="M0 260 L80 200 L150 250 L230 180 L320 255 L400 205 L480 250 V360 H0Z" fill="#2b1442"/>`),
  ocean: B('ocean', `<defs><linearGradient id="o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#48CAE4"/><stop offset="1" stop-color="#023E8A"/></linearGradient></defs><rect width="480" height="360" fill="url(#o)"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${(i * 131) % 480}" cy="${(i * 71) % 300 + 20}" r="${3 + i % 4}" fill="none" stroke="#caf0f8" stroke-width="1.5" opacity=".6"/>`).join('') + `<path d="M0 330 Q60 310 120 330 T240 330 T360 330 T480 330 V360 H0Z" fill="#E9C46A"/><path d="M60 330 q-6 -40 4 -70 M70 330 q8 -30 -2 -55" stroke="#2a9d8f" stroke-width="5" fill="none"/>`),
};

export const SPRITE_LIBRARY = [
  { name: 'Sparky', costumes: sparky }, { name: 'Bolt', costumes: bolt }, { name: 'Star', costumes: star },
  { name: 'Gem', costumes: gem }, { name: 'Ball', costumes: ball }, { name: 'Rocket', costumes: rocket },
  { name: 'Fish', costumes: fish }, { name: 'Paddle', costumes: paddle }, { name: 'Heart', costumes: heart },
  { name: 'Cloud', costumes: cloud }, { name: 'Pointer', costumes: arrow },
];

export const LOGO_SVG = `<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><defs><linearGradient id="kgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2550"/><stop offset="1" stop-color="#171a2b"/></linearGradient></defs><rect x="1" y="1" width="38" height="38" rx="10" fill="url(#kgr)"/><rect x="8" y="8" width="8" height="25" rx="3" fill="#4C7EF3"/><rect x="15" y="17.5" width="15" height="7.5" rx="3" fill="#3DBE6A" transform="rotate(-42 17 21)"/><rect x="16" y="20" width="16" height="7.5" rx="3" fill="#F28A2E" transform="rotate(42 18 24)"/><path d="M29.5 4.5c2.6 2.4 4 4.4 4 7a4 4 0 0 1-8 0c0-1.7.9-3 1.8-3.8 0 1.1.4 1.8 1 2.2.1-2 .4-3.6 1.2-5.4z" fill="#FFB347" stroke="#E0611F" stroke-width="1"/><path d="M29.5 9.3c.9.9 1.4 1.6 1.4 2.4a1.4 1.4 0 0 1-2.8 0c0-.6.3-1.1.7-1.4 0 .4.2.6.4.7 0-.6.1-1.1.3-1.7z" fill="#FFE066"/></svg>`;
export const FLAME_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 4 0-4 0-6 1-9z" fill="#FF8C42" stroke="#B8341B" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 12c1.5 1.5 2.5 2.5 2.5 4a2.5 2.5 0 0 1-5 0c0-1 .5-2 1-2.5 0 1 .5 1.5 1 1.5 0-1.5 0-2 .5-3z" fill="#FFE066"/></svg>`;
