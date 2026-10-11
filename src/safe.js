// Prototype-safe dictionary helpers. Anything that uses user-controlled strings (op names, variable/list/sprite
// names, storage and map keys) as object keys goes through these, so keys like "__proto__", "constructor" or
// "toString" are always treated as plain data and never reach Object.prototype.
export const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
export const get = (o, k) => (has(o, k) ? o[k] : undefined);
export function put(o, k, v) { Object.defineProperty(o, k, { value: v, writable: true, enumerable: true, configurable: true }); return v; }
export function dict(src) { const d = Object.create(null); if (src && typeof src === 'object') for (const k of Object.keys(src)) d[k] = src[k]; return d; }
export const RESERVED_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
