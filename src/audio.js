// WebAudio synth — all sounds are generated procedurally (no audio assets).
let ctx = null, master = null;
const active = new Set();
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function env(g, t, dur, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
function osc(type, f0, f1, dur, vol = 0.4, delay = 0) {
  const c = ac(); if (!c) return; const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, dur, vol); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  active.add(o); o.onended = () => active.delete(o);
}
function noise(dur, vol = 0.5) {
  const c = ac(); if (!c) return; const t = c.currentTime;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  const g = c.createGain(); env(g, t, dur, vol); s.connect(f); f.connect(g); g.connect(master); s.start(t);
  active.add(s); s.onended = () => active.delete(s);
}
export const SOUNDS = {
  pop: v => { osc('sine', 900, 180, 0.12, 0.5 * v); return 0.12; },
  beep: v => { osc('square', 880, 880, 0.15, 0.25 * v); return 0.15; },
  coin: v => { osc('square', 988, 988, 0.08, 0.25 * v); osc('square', 1319, 1319, 0.3, 0.25 * v, 0.08); return 0.38; },
  laser: v => { osc('sawtooth', 1400, 90, 0.3, 0.25 * v); return 0.3; },
  boom: v => { noise(0.7, 0.8 * v); osc('sine', 120, 40, 0.5, 0.5 * v); return 0.7; },
  chirp: v => { osc('sine', 400, 1800, 0.2, 0.4 * v); return 0.2; },
  jump: v => { osc('triangle', 300, 900, 0.18, 0.5 * v); return 0.18; },
  win: v => { [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f, 0.18, 0.4 * v, i * 0.12)); return 0.6; },
};
export function playSound(name, volume = 100) { const f = SOUNDS[name] || SOUNDS.pop; return f(Math.max(0, Math.min(1, volume / 100))); }
export function playTone(freq, secs, wave = 'square', volume = 100) { if (freq > 0 && secs > 0) osc(wave, freq, freq, secs, 0.3 * Math.max(0, Math.min(1, volume / 100))); }
export function stopAll() { for (const n of active) { try { n.stop(); } catch (e) {} } active.clear(); }
