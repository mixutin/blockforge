// Blockforge block language ("Ember") — block shape definitions.
// spec placeholders: %n number, %s text, %b boolean, %k color, %m.<menu> dropdown
export const CATEGORIES = [
  { id: 'events', name: 'Events', color: '#E6B422' },
  { id: 'motion', name: 'Motion', color: '#4C7EF3' },
  { id: 'looks', name: 'Looks', color: '#9B6CF0' },
  { id: 'sound', name: 'Sound', color: '#D35BD8' },
  { id: 'control', name: 'Control', color: '#F28A2E' },
  { id: 'sensing', name: 'Sensing', color: '#2DB4D6' },
  { id: 'operators', name: 'Operators', color: '#3DBE6A' },
  { id: 'variables', name: 'Variables', color: '#F05D5E' },
  { id: 'lists', name: 'Lists', color: '#C8553D' },
  { id: 'pen', name: 'Pen', color: '#10A38F' },
  { id: 'program', name: 'Console & UI', color: '#5C6BC0' },
  { id: 'data', name: 'Data', color: '#7CB342' },
  { id: 'game', name: 'Game', color: '#B5733F' },
  { id: 'myblocks', name: 'My Blocks', color: '#E8507F' },
];
export const CAT_COLOR = Object.fromEntries(CATEGORIES.map(c => [c.id, c.color]));

// type: hat | stack | cap | c | cc (if/else) | reporter | boolean
// sprite: true => sprite only; stage: true => stage only
const D = [];
const add = (cat, op, type, text, def = [], kw = op, extra = {}) => D.push({ cat, op, type, text, def, kw, ...extra });

// Events
add('events', 'ev_ignite', 'hat', 'when %i Ignite pressed', [], 'on_ignite');
add('events', 'ev_key', 'hat', 'when %m.key key pressed', ['space'], 'on_key');
add('events', 'ev_click', 'hat', 'when this sprite clicked', [], 'on_click', { sprite: true });
add('events', 'ev_stageclick', 'hat', 'when stage clicked', [], 'on_stage_click', { stage: true });
add('events', 'ev_backdrop', 'hat', 'when backdrop switches to %m.backdrop', [''], 'on_backdrop');
add('events', 'ev_timer', 'hat', 'when timer > %n', [10], 'on_timer');
add('events', 'ev_receive', 'hat', 'when I receive %m.message', ['message1'], 'on_message');
add('events', 'ev_broadcast', 'stack', 'broadcast %m.message', ['message1'], 'broadcast');
add('events', 'ev_broadcastwait', 'stack', 'broadcast %m.message and wait', ['message1'], 'broadcast_wait');

// Motion
const S = { sprite: true };
add('motion', 'mo_move', 'stack', 'move %n steps', [10], 'move', S);
add('motion', 'mo_turnr', 'stack', 'turn ↻ %n degrees', [15], 'turn_right', S);
add('motion', 'mo_turnl', 'stack', 'turn ↺ %n degrees', [15], 'turn_left', S);
add('motion', 'mo_goto', 'stack', 'go to %m.goto', ['_random_'], 'go_to', S);
add('motion', 'mo_gotoxy', 'stack', 'go to x: %n y: %n', [0, 0], 'go_xy', S);
add('motion', 'mo_glideto', 'stack', 'glide %n secs to %m.goto', [1, '_random_'], 'glide_to', S);
add('motion', 'mo_glide', 'stack', 'glide %n secs to x: %n y: %n', [1, 0, 0], 'glide_xy', S);
add('motion', 'mo_point', 'stack', 'point in direction %n', [90], 'point', S);
add('motion', 'mo_towards', 'stack', 'point towards %m.towards', ['_mouse_'], 'point_towards', S);
add('motion', 'mo_chx', 'stack', 'change x by %n', [10], 'change_x', S);
add('motion', 'mo_setx', 'stack', 'set x to %n', [0], 'set_x', S);
add('motion', 'mo_chy', 'stack', 'change y by %n', [10], 'change_y', S);
add('motion', 'mo_sety', 'stack', 'set y to %n', [0], 'set_y', S);
add('motion', 'mo_bounce', 'stack', 'if on edge, bounce', [], 'bounce', S);
add('motion', 'mo_rotstyle', 'stack', 'set rotation style %m.rotStyle', ['left-right'], 'rotation_style', S);
add('motion', 'mo_x', 'reporter', 'x position', [], 'x_pos', S);
add('motion', 'mo_y', 'reporter', 'y position', [], 'y_pos', S);
add('motion', 'mo_dir', 'reporter', 'direction', [], 'direction', S);

// Looks
add('looks', 'lo_sayfor', 'stack', 'say %s for %n seconds', ['Hello!', 2], 'say_for', S);
add('looks', 'lo_say', 'stack', 'say %s', ['Hello!'], 'say', S);
add('looks', 'lo_thinkfor', 'stack', 'think %s for %n seconds', ['Hmm...', 2], 'think_for', S);
add('looks', 'lo_think', 'stack', 'think %s', ['Hmm...'], 'think', S);
add('looks', 'lo_costume', 'stack', 'switch costume to %m.costume', [''], 'costume', S);
add('looks', 'lo_nextcostume', 'stack', 'next costume', [], 'next_costume', S);
add('looks', 'lo_backdrop', 'stack', 'switch backdrop to %m.backdrop', [''], 'backdrop');
add('looks', 'lo_nextbackdrop', 'stack', 'next backdrop', [], 'next_backdrop');
add('looks', 'lo_chsize', 'stack', 'change size by %n', [10], 'change_size', S);
add('looks', 'lo_setsize', 'stack', 'set size to %n %', [100], 'set_size', S);
add('looks', 'lo_cheffect', 'stack', 'change %m.effect effect by %n', ['color', 25], 'change_effect');
add('looks', 'lo_seteffect', 'stack', 'set %m.effect effect to %n', ['ghost', 0], 'set_effect');
add('looks', 'lo_cleareffects', 'stack', 'clear graphic effects', [], 'clear_effects');
add('looks', 'lo_show', 'stack', 'show', [], 'show', S);
add('looks', 'lo_hide', 'stack', 'hide', [], 'hide', S);
add('looks', 'lo_front', 'stack', 'go to %m.frontBack layer', ['front'], 'layer', S);
add('looks', 'lo_layers', 'stack', 'go %m.fwdBack %n layers', ['forward', 1], 'move_layers', S);
add('looks', 'lo_costumeof', 'reporter', 'costume %m.numName', ['number'], 'costume_of', S);
add('looks', 'lo_backdropof', 'reporter', 'backdrop %m.numName', ['number'], 'backdrop_of');
add('looks', 'lo_size', 'reporter', 'size', [], 'size', S);

// Sound
add('sound', 'so_playwait', 'stack', 'play sound %m.sound until done', ['pop'], 'play_sound_wait');
add('sound', 'so_play', 'stack', 'start sound %m.sound', ['pop'], 'play_sound');
add('sound', 'so_note', 'stack', 'play note %n for %n beats', [60, 0.5], 'note');
add('sound', 'so_tone', 'stack', 'play tone %n Hz for %n secs', [440, 0.5], 'tone');
add('sound', 'so_inst', 'stack', 'set instrument to %m.wave', ['square'], 'instrument');
add('sound', 'so_stop', 'stack', 'stop all sounds', [], 'stop_sounds');
add('sound', 'so_chvol', 'stack', 'change volume by %n', [-10], 'change_volume');
add('sound', 'so_setvol', 'stack', 'set volume to %n %', [100], 'set_volume');
add('sound', 'so_tempo', 'stack', 'set tempo to %n bpm', [90], 'set_tempo');
add('sound', 'so_vol', 'reporter', 'volume', [], 'volume');

// Control
add('control', 'ct_wait', 'stack', 'wait %n seconds', [1], 'wait');
add('control', 'ct_repeat', 'c', 'repeat %n', [10], 'repeat');
add('control', 'ct_forever', 'c', 'forever', [], 'forever', { cap: true });
add('control', 'ct_if', 'c', 'if %b then', [null], 'if');
add('control', 'ct_ifelse', 'cc', 'if %b then', [null], 'if', { elseText: 'else' });
add('control', 'ct_waituntil', 'stack', 'wait until %b', [null], 'wait_until');
add('control', 'ct_until', 'c', 'repeat until %b', [null], 'repeat_until');
add('control', 'ct_while', 'c', 'while %b', [null], 'while');
add('control', 'ct_for', 'c', 'for each %m.var from 1 to %n', ['', 10], 'for_each');
add('control', 'ct_stop', 'stack', 'stop %m.stopOpt', ['all'], 'stop');
add('control', 'ct_cloned', 'hat', 'when I start as a clone', [], 'on_clone', S);
add('control', 'ct_clone', 'stack', 'create clone of %m.cloneOf', ['_myself_'], 'clone');
add('control', 'ct_delclone', 'cap', 'delete this clone', [], 'delete_clone', S);

// Sensing
add('sensing', 'se_touching', 'boolean', 'touching %m.touch ?', ['_mouse_'], 'touching', S);
add('sensing', 'se_touchcolor', 'boolean', 'touching color %k ?', ['#3DBE6A'], 'touching_color', S);
add('sensing', 'se_distance', 'reporter', 'distance to %m.towards', ['_mouse_'], 'distance_to', S);
add('sensing', 'se_ask', 'stack', 'ask %s and wait', ["What's your name?"], 'ask');
add('sensing', 'se_answer', 'reporter', 'answer', [], 'answer');
add('sensing', 'se_key', 'boolean', 'key %m.key pressed?', ['space'], 'key_pressed');
add('sensing', 'se_mousedown', 'boolean', 'mouse down?', [], 'mouse_down');
add('sensing', 'se_mousex', 'reporter', 'mouse x', [], 'mouse_x');
add('sensing', 'se_mousey', 'reporter', 'mouse y', [], 'mouse_y');
add('sensing', 'se_timer', 'reporter', 'timer', [], 'timer');
add('sensing', 'se_resettimer', 'stack', 'reset timer', [], 'reset_timer');
add('sensing', 'se_of', 'reporter', '%m.prop of %m.object', ['x position', '_stage_'], 'prop_of');
add('sensing', 'se_current', 'reporter', 'current %m.current', ['year'], 'current');
add('sensing', 'se_days', 'reporter', 'days since 2000', [], 'days_since_2000');

// Operators
add('operators', 'op_add', 'reporter', '%n + %n', ['', ''], '+', { infix: '+', prec: 5 });
add('operators', 'op_sub', 'reporter', '%n - %n', ['', ''], '-', { infix: '-', prec: 5 });
add('operators', 'op_mul', 'reporter', '%n * %n', ['', ''], '*', { infix: '*', prec: 6 });
add('operators', 'op_div', 'reporter', '%n / %n', ['', ''], '/', { infix: '/', prec: 6 });
add('operators', 'op_random', 'reporter', 'pick random %n to %n', [1, 10], 'random');
add('operators', 'op_gt', 'boolean', '%s > %s', ['', 50], '>', { infix: '>', prec: 4 });
add('operators', 'op_lt', 'boolean', '%s < %s', ['', 50], '<', { infix: '<', prec: 4 });
add('operators', 'op_eq', 'boolean', '%s = %s', ['', 50], '=', { infix: '=', prec: 4 });
add('operators', 'op_and', 'boolean', '%b and %b', [null, null], 'and', { infix: 'and', prec: 2 });
add('operators', 'op_or', 'boolean', '%b or %b', [null, null], 'or', { infix: 'or', prec: 1 });
add('operators', 'op_not', 'boolean', 'not %b', [null], 'not');
add('operators', 'op_join', 'reporter', 'join %s %s', ['apple ', 'pie'], 'join');
add('operators', 'op_letter', 'reporter', 'letter %n of %s', [1, 'apple'], 'letter_of');
add('operators', 'op_length', 'reporter', 'length of %s', ['apple'], 'length_of');
add('operators', 'op_contains', 'boolean', '%s contains %s ?', ['apple', 'a'], 'contains');
add('operators', 'op_mod', 'reporter', '%n mod %n', ['', ''], '%', { infix: '%', prec: 6 });
add('operators', 'op_round', 'reporter', 'round %n', [''], 'round');
add('operators', 'op_math', 'reporter', '%m.mathfn of %n', ['abs', ''], 'math');

// Variables (var reporters are generated per variable)
add('variables', 'va_set', 'stack', 'set %m.var to %s', ['', 0], 'set');
add('variables', 'va_change', 'stack', 'change %m.var by %n', ['', 1], 'change');
add('variables', 'va_show', 'stack', 'show variable %m.var', [''], 'show_var');
add('variables', 'va_hide', 'stack', 'hide variable %m.var', [''], 'hide_var');
add('variables', 'var', 'reporter', '%v', [''], '@');

// Lists
add('lists', 'li_add', 'stack', 'add %s to %m.list', ['thing', ''], 'list_add');
add('lists', 'li_delete', 'stack', 'delete %n of %m.list', [1, ''], 'list_delete');
add('lists', 'li_clear', 'stack', 'delete all of %m.list', [''], 'list_clear');
add('lists', 'li_insert', 'stack', 'insert %s at %n of %m.list', ['thing', 1, ''], 'list_insert');
add('lists', 'li_replace', 'stack', 'replace item %n of %m.list with %s', [1, '', 'thing'], 'list_replace');
add('lists', 'li_item', 'reporter', 'item %n of %m.list', [1, ''], 'list_item');
add('lists', 'li_index', 'reporter', 'item # of %s in %m.list', ['thing', ''], 'list_index');
add('lists', 'li_length', 'reporter', 'length of %m.list', [''], 'list_length');
add('lists', 'li_contains', 'boolean', '%m.list contains %s ?', ['', 'thing'], 'list_contains');
add('lists', 'li_show', 'stack', 'show list %m.list', [''], 'show_list');
add('lists', 'li_hide', 'stack', 'hide list %m.list', [''], 'hide_list');
add('lists', 'list', 'reporter', '%v', [''], '@@');

// Pen
add('pen', 'pe_clear', 'stack', 'erase all', [], 'pen_clear');
add('pen', 'pe_stamp', 'stack', 'stamp', [], 'stamp', S);
add('pen', 'pe_down', 'stack', 'pen down', [], 'pen_down', S);
add('pen', 'pe_up', 'stack', 'pen up', [], 'pen_up', S);
add('pen', 'pe_color', 'stack', 'set pen color to %k', ['#4C7EF3'], 'pen_color', S);
add('pen', 'pe_chhue', 'stack', 'change pen hue by %n', [10], 'pen_hue', S);
add('pen', 'pe_size', 'stack', 'set pen size to %n', [2], 'pen_size', S);
add('pen', 'pe_chsize', 'stack', 'change pen size by %n', [1], 'change_pen_size', S);

// Console & UI widgets & storage
add('program', 'pr_print', 'stack', 'print %s', ['Hello, world!'], 'print');
add('program', 'pr_clear', 'stack', 'clear console', [], 'clear_console');
add('program', 'ui_button', 'stack', 'add button %s text %s at x: %n y: %n', ['btn1', 'Click me', 0, 0], 'ui_button');
add('program', 'ui_label', 'stack', 'add label %s text %s at x: %n y: %n', ['label1', 'Hello', 0, 120], 'ui_label');
add('program', 'ui_textbox', 'stack', 'add text box %s at x: %n y: %n', ['input1', 0, -60], 'ui_textbox');
add('program', 'ui_slider', 'stack', 'add slider %s from %n to %n at x: %n y: %n', ['slider1', 0, 100, 0, -120], 'ui_slider');
add('program', 'ui_settext', 'stack', 'set text of widget %s to %s', ['label1', 'Hi'], 'ui_set_text');
add('program', 'ui_remove', 'stack', 'remove widget %s', ['btn1'], 'ui_remove');
add('program', 'ui_clear', 'stack', 'remove all widgets', [], 'ui_clear');
add('program', 'ui_value', 'reporter', 'value of widget %s', ['input1'], 'ui_value');
add('program', 'ui_clicked', 'hat', 'when widget %s clicked', ['btn1'], 'on_widget_click');
add('program', 'ui_changed', 'hat', 'when widget %s changed', ['slider1'], 'on_widget_change');
add('program', 'st_set', 'stack', 'save %s = %s to project storage', ['best', 0], 'store_set');
add('program', 'st_get', 'reporter', 'stored value %s', ['best'], 'store_get');

// Data: booleans, text, maps, JSON
add('data', 'dt_true', 'boolean', 'true', [], 'true');
add('data', 'dt_false', 'boolean', 'false', [], 'false');
add('data', 'dt_typeof', 'reporter', 'type of %s', ['42'], 'type_of');
add('data', 'dt_upper', 'reporter', 'uppercase %s', ['hello'], 'upper');
add('data', 'dt_lower', 'reporter', 'lowercase %s', ['HELLO'], 'lower');
add('data', 'dt_trim', 'reporter', 'trim %s', ['  hi  '], 'trim');
add('data', 'dt_replace', 'reporter', 'replace %s with %s in %s', ['a', 'o', 'banana'], 'replace');
add('data', 'dt_sub', 'reporter', 'letters %n to %n of %s', [1, 3, 'blocks'], 'substring');
add('data', 'dt_index', 'reporter', 'position of %s in %s', ['c', 'abc'], 'index_of');
add('data', 'dt_split', 'stack', 'split %s by %s into list %m.list', ['a,b,c', ',', ''], 'split');
add('data', 'dt_joinlist', 'reporter', 'join list %m.list with %s', ['', ', '], 'join_list');
add('data', 'dt_newmap', 'stack', 'set %m.var to empty map', [''], 'new_map');
add('data', 'dt_mapset', 'stack', 'in map %m.var set %s to %s', ['', 'key', 'value'], 'map_set');
add('data', 'dt_mapget', 'reporter', 'item %s of map %m.var', ['key', ''], 'map_get');
add('data', 'dt_maphas', 'boolean', 'map %m.var has %s ?', ['', 'key'], 'map_has');
add('data', 'dt_mapdel', 'stack', 'delete %s from map %m.var', ['key', ''], 'map_delete');
add('data', 'dt_mapkeys', 'stack', 'put keys of map %m.var into list %m.list', ['', ''], 'map_keys');
add('data', 'dt_mapsize', 'reporter', 'size of map %m.var', [''], 'map_size');
add('data', 'dt_tojson', 'reporter', 'json of %m.var', [''], 'to_json');
add('data', 'dt_fromjson', 'stack', 'set %m.var to parsed json %s', ['', '{"a": 1}'], 'from_json');

// Game: physics, camera, rooms, draw event, timers
add('game', 'ev_every', 'hat', 'every %n seconds', [1], 'every');
add('game', 'ga_draw', 'hat', 'when drawing (every frame)', [], 'on_draw');
add('game', 'ga_rect', 'stack', 'draw rect x: %n y: %n w: %n h: %n %k', [0, 0, 60, 40, '#4C7EF3'], 'draw_rect');
add('game', 'ga_circle', 'stack', 'draw circle x: %n y: %n r: %n %k', [0, 0, 20, '#FF5D73'], 'draw_circle');
add('game', 'ga_line', 'stack', 'draw line %n , %n to %n , %n %k', [-50, 0, 50, 0, '#FFD23F'], 'draw_line');
add('game', 'ga_text', 'stack', 'draw text %s at x: %n y: %n %k', ['Score', -200, 160, '#ffffff'], 'draw_text');
add('game', 'ga_physics', 'stack', 'turn physics %m.onoff', ['on'], 'physics', S);
add('game', 'ga_setvel', 'stack', 'set velocity to x: %n y: %n', [3, 0], 'set_velocity', S);
add('game', 'ga_chvel', 'stack', 'change velocity by x: %n y: %n', [0, 8], 'change_velocity', S);
add('game', 'ga_speed', 'stack', 'set speed %n in my direction', [4], 'set_speed', S);
add('game', 'ga_gravity', 'stack', 'set gravity to %n', [0.5], 'set_gravity', S);
add('game', 'ga_friction', 'stack', 'set friction to %n', [0.02], 'set_friction', S);
add('game', 'ga_vx', 'reporter', 'velocity x', [], 'velocity_x', S);
add('game', 'ga_vy', 'reporter', 'velocity y', [], 'velocity_y', S);
add('game', 'ga_camera', 'stack', 'set camera to x: %n y: %n', [0, 0], 'camera');
add('game', 'ga_chcamera', 'stack', 'change camera by x: %n y: %n', [5, 0], 'change_camera');
add('game', 'ga_follow', 'stack', 'center camera on me', [], 'camera_follow', S);
add('game', 'ga_camx', 'reporter', 'camera x', [], 'camera_x');
add('game', 'ga_camy', 'reporter', 'camera y', [], 'camera_y');
add('game', 'ga_room', 'stack', 'go to room %m.backdrop', [''], 'go_room');
add('game', 'ga_roomname', 'reporter', 'room name', [], 'room_name');

// My Blocks (special rendering)
add('myblocks', 'define', 'hat', 'define', [], 'define');
add('myblocks', 'call', 'stack', '', [], 'call');
add('myblocks', 'param', 'reporter', '%v', [''], 'param');

export const DEFS = Object.fromEntries(D.map(d => [d.op, d]));
export const DEF_LIST = D;

// Parse spec into parts: [{t:'text',v}, {t:'arg',kind,menu,idx}]
const specCache = new Map();
export function parseSpec(text) {
  if (specCache.has(text)) return specCache.get(text);
  const parts = []; let idx = 0;
  const re = /%(n|s|b|k|i|v|m\.(\w+))/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: 'text', v: text.slice(last, m.index).trim() });
    const k = m[1][0];
    if (k === 'i') parts.push({ t: 'icon' });
    else if (k === 'v') parts.push({ t: 'label', idx: idx++ });
    else parts.push({ t: 'arg', kind: k, menu: m[2] || null, idx: idx++ });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ t: 'text', v: text.slice(last).trim() });
  const out = parts.filter(p => p.t !== 'text' || p.v);
  specCache.set(text, out);
  return out;
}
export function argKinds(op) {
  const d = DEFS[op];
  return parseSpec(d.text).filter(p => p.t === 'arg' || p.t === 'label');
}

export function newBlock(op, overrides = {}) {
  const d = DEFS[op];
  const b = { op, args: d.def.map(v => (v === null ? null : v)) };
  if (d.type === 'c' || d.type === 'cc') b.body = [];
  if (d.type === 'cc') b.body2 = [];
  return Object.assign(b, overrides);
}
export const isReporterType = t => t === 'reporter' || t === 'boolean';
export function blockType(b) { return DEFS[b.op]?.type || 'stack'; }
export function isCap(b) {
  const d = DEFS[b.op]; if (!d) return false;
  if (d.type === 'cap' || d.cap) return true;
  if (b.op === 'ct_stop') return b.args[0] === 'all' || b.args[0] === 'this script';
  return false;
}
export const clone = o => JSON.parse(JSON.stringify(o));

export const MENUS_STATIC = {
  key: ['space', 'up arrow', 'down arrow', 'left arrow', 'right arrow', 'any', ...'abcdefghijklmnopqrstuvwxyz0123456789'],
  rotStyle: ['all around', 'left-right', "don't rotate"],
  effect: ['color', 'ghost', 'brightness', 'saturation'],
  frontBack: ['front', 'back'],
  fwdBack: ['forward', 'backward'],
  numName: ['number', 'name'],
  sound: ['pop', 'beep', 'coin', 'laser', 'boom', 'chirp', 'jump', 'win'],
  wave: ['sine', 'square', 'sawtooth', 'triangle'],
  stopOpt: ['all', 'this script', 'other scripts in sprite'],
  mathfn: ['abs', 'floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'e ^', '10 ^'],
  current: ['year', 'month', 'date', 'day of week', 'hour', 'minute', 'second'],
  onoff: ['on', 'off'],
  prop: ['x position', 'y position', 'direction', 'costume #', 'costume name', 'size', 'volume', 'backdrop #', 'backdrop name'],
};
