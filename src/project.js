import { parseKls } from './kls.js';
import * as art from './art.js';
import { clone } from './blocks.js';

export function makeTarget(name, costumes, o = {}) {
  return Object.assign({ name, isStage: false, x: 0, y: 0, direction: 90, size: 100, visible: true, costume: 0, rotationStyle: 'all around', layer: 0, volume: 100,
    variables: {}, lists: {}, costumes: clone(costumes), scripts: [] }, o);
}
export function makeStage(backdrops, o = {}) { return makeTarget('Stage', backdrops, { isStage: true, tempo: 90, ...o }); }

function estHeight(blocks) {
  let h = 0; for (const b of blocks) { h += b.op === 'define' || /^ev_|ct_cloned/.test(b.op) && !/broadcast/.test(b.op) ? 56 : 34; if (b.body) h += 30 + estHeight(b.body); if (b.body2) h += 30 + estHeight(b.body2); }
  return h;
}
export function layoutScripts(scripts, prev = []) {
  const cols = [24, 24]; const xs = [24, 430];
  scripts.forEach((s, i) => {
    if (prev[i]) { s.x = prev[i].x; s.y = prev[i].y; return; }
    const c = cols[0] <= cols[1] ? 0 : 1; s.x = xs[c]; s.y = cols[c]; cols[c] += estHeight(s.blocks) + 40;
  });
  return scripts;
}
export function withCode(target, code) { target.scripts = layoutScripts(parseKls(code)); return target; }

export function blankProject() {
  const stage = makeStage([art.backdrops.blank, art.backdrops.meadow]);
  const s = makeTarget('Sparky', art.sparky, { layer: 0 });
  return { format: 'kindlr', version: 1, name: 'Untitled project', targets: [stage, s], monitors: [] };
}

const EX1 = {
  stage: `on_stage_click {
  next_backdrop
}`,
  sparky: `on_ignite {
  go_xy(0, -40)
  point(45)
  set_size(100)
  set(@bounces, 0)
  say_for("Hi! I'm Sparky. Click me!", 2)
  forever {
    move(4)
    if touching("_edge_") {
      change(@bounces, 1)
      play_sound("pop")
    }
    bounce
    next_costume
    wait(0.05)
  }
}

on_click {
  broadcast("party")
  repeat(3) {
    change_effect("color", 25)
    note(60, 0.25)
    note(64, 0.25)
    note(67, 0.25)
  }
  clear_effects
}

on_key("left arrow") {
  turn_left(15)
}

on_key("right arrow") {
  turn_right(15)
}`,
  bolt: `on_ignite {
  go_xy(-150, 100)
  point(90)
  forever {
    glide_to(1.5, "_random_")
    think_for(join("x is ", round(x_pos)), 1)
  }
}

on_message("party") {
  repeat(12) {
    next_costume
    turn_right(30)
    wait(0.08)
  }
  point(90)
}`,
};

const EX2 = {
  stage: `on_ignite {
  backdrop("night sky")
}

on_message("game over") {
  backdrop("sunset")
  play_sound("win")
}`,
  sparky: `on_ignite {
  set(@score, 0)
  set(@lives, 5)
  set_size(60)
  go_xy(0, -135)
  rotation_style("left-right")
  say_for("Catch the falling stars!", 2)
  forever {
    if key_pressed("left arrow") {
      point(-90)
      change_x(-8)
    }
    if key_pressed("right arrow") {
      point(90)
      change_x(8)
    }
    if mouse_down {
      set_x(mouse_x)
    }
  }
}

on_message("game over") {
  stop("other scripts in sprite")
  say(join("Game over! Score: ", @score))
}`,
  star: `on_ignite {
  hide
  forever {
    clone("_myself_")
    wait(random(0.5, 1.2))
  }
}

on_clone {
  go_xy(random(-220, 220), 175)
  set_effect("color", random(0, 100))
  show
  repeat_until(y_pos < -165) {
    change_y(-2 - @score / 6)
    turn_right(5)
    if touching("Sparky") {
      change(@score, 1)
      play_sound("coin")
      delete_clone
    }
  }
  change(@lives, -1)
  play_sound("boom")
  if @lives < 1 {
    broadcast("game over")
  }
  delete_clone
}

on_message("game over") {
  stop("other scripts in sprite")
  hide
  delete_clone
}`,
};

const EX3 = {
  stage: `// The stage just sets the scene
on_ignite {
  backdrop("blueprint")
}`,
  pointer: `define! polygon(sides, length) {
  repeat(sides) {
    move(length)
    turn_right(360 / sides)
  }
}

on_ignite {
  pen_clear
  list_clear(@@palette)
  list_add("#FF5D73", @@palette)
  list_add("#FFD23F", @@palette)
  list_add("#3DBE6A", @@palette)
  list_add("#5EE6EB", @@palette)
  list_add("#C9A7FF", @@palette)
  go_xy(0, 0)
  point(90)
  pen_size(2)
  set(@rings, 0)
  repeat(36) {
    pen_color(list_item(@rings % list_length(@@palette) + 1, @@palette))
    pen_down
    polygon(6, 60)
    pen_up
    turn_right(10)
    change(@rings, 1)
  }
  say("Press space for a random design!")
}

on_key("space") {
  say("")
  pen_clear
  set(@sides, random(3, 9))
  pen_color("#FFD23F")
  repeat(24) {
    pen_hue(15)
    pen_down
    polygon(@sides, random(30, 80))
    pen_up
    turn_right(15)
  }
}`,
};

const EX4 = {
  stage: `// A tiny notes app: widgets, console, lists, maps and project storage
on_ignite {
  clear_console
  ui_clear
  ui_label("title", "Kindlr Notes", 0, 150)
  ui_textbox("note", 0, 105)
  ui_button("add", "Add note", -60, 62)
  ui_button("clear", "Clear all", 60, 62)
  ui_slider("stars", 1, 8, 0, -150)
  ui_label("starsLabel", "Mood: 1 star", 0, -118)
  list_clear(@@notes)
  new_map(@stats)
  map_set(@stats, "added", 0)
  set(@visits, store_get("visits") + 1)
  store_set("visits", @visits)
  print(join("Welcome! This project has been started ", join(@visits, " time(s).")))
  print("Type a note and press Add note.")
}

on_widget_click("add") {
  if length_of(trim(ui_value("note"))) > 0 {
    list_add(trim(ui_value("note")), @@notes)
    map_set(@stats, "added", map_get("added", @stats) + 1)
    print(join("Added: ", ui_value("note")))
    ui_set_text("note", "")
  } else {
    print("Type something first!")
  }
}

on_widget_click("clear") {
  list_clear(@@notes)
  print(join("Cleared. Stats so far: ", to_json(@stats)))
}

on_widget_change("stars") {
  ui_set_text("starsLabel", join("Mood: ", join(round(ui_value("stars")), " star(s)")))
}

on_draw {
  for_each(@i, round(ui_value("stars"))) {
    draw_circle(-180 + @i * 40, -80, 12, "#FFD23F")
  }
  draw_text(join("Notes: ", list_length(@@notes)), -228, 160, "#1d2333")
}`,
};
const EX5 = {
  stage: `on_draw {
  draw_rect(-240, -180, 480, 8, "#5BAF4E")
}`,
  ball: `on_ignite {
  go_xy(0, 120)
  set_velocity(4, 0)
  set_gravity(0.45)
  set_friction(0.004)
  physics("on")
  forever {
    if y_pos < -150 and velocity_y < 0 {
      set_y(-150)
      set_velocity(velocity_x, 0 - velocity_y * 0.8)
      if velocity_y > 2 {
        play_sound("pop")
      }
    }
    if x_pos > 215 and velocity_x > 0 or x_pos < -215 and velocity_x < 0 {
      set_velocity(0 - velocity_x, velocity_y)
    }
  }
}

on_key("space") {
  change_velocity(0, 9)
  play_sound("jump")
}

on_key("left arrow") {
  change_velocity(-2, 0)
}

on_key("right arrow") {
  change_velocity(2, 0)
}

on_draw {
  draw_line(0, 0, x_pos, y_pos, "#ffffff")
  draw_text(join("vx ", round(velocity_x)), -228, 160, "#ffffff")
  draw_text(join("vy ", round(velocity_y)), -228, 140, "#ffffff")
  draw_text("space = jump, arrows = push", 20, 160, "#ffffff")
}`,
};

export function exampleProjects() {
  const b = art.backdrops;
  const p1 = { format: 'kindlr', version: 1, name: 'Hello Sparky', monitors: [{ type: 'var', name: 'bounces', owner: null, visible: true, x: 6, y: 6 }],
    targets: [withCode(makeStage([b.meadow, b.sunset, b.night], { variables: { bounces: 0 } }), EX1.stage),
      withCode(makeTarget('Sparky', art.sparky, { y: -40, direction: 45, layer: 1 }), EX1.sparky),
      withCode(makeTarget('Bolt', art.bolt, { x: -150, y: 100, size: 80, layer: 0 }), EX1.bolt)] };
  const p2 = { format: 'kindlr', version: 1, name: 'Star Catcher', monitors: [{ type: 'var', name: 'score', owner: null, visible: true, x: 6, y: 6 }, { type: 'var', name: 'lives', owner: null, visible: true, x: 6, y: 36 }],
    targets: [withCode(makeStage([b.night, b.sunset], { variables: { score: 0, lives: 5 } }), EX2.stage),
      withCode(makeTarget('Sparky', art.sparky, { y: -135, size: 60, rotationStyle: 'left-right', layer: 1 }), EX2.sparky),
      withCode(makeTarget('Star', art.star, { y: 170, visible: false, layer: 0 }), EX2.star)] };
  const p3 = { format: 'kindlr', version: 1, name: 'Pen Art Lab', monitors: [{ type: 'var', name: 'rings', owner: null, visible: true, x: 6, y: 6 }, { type: 'list', name: 'palette', owner: null, visible: true, x: 370, y: 6 }],
    targets: [withCode(makeStage([b.grid, b.blank], { variables: { rings: 0, sides: 6 }, lists: { palette: [] } }), EX3.stage),
      withCode(makeTarget('Pointer', art.arrow, { size: 70, layer: 0 }), EX3.pointer)] };
  const p4 = { format: 'kindlr', version: 1, name: 'Notes App (program mode)', storage: {}, monitors: [{ type: 'list', name: 'notes', owner: null, visible: true, x: 370, y: 6 }],
    targets: [withCode(makeStage([b.blank, b.grid], { variables: { visits: 0, stats: 0, i: 0 }, lists: { notes: [] } }), EX4.stage)] };
  const p5 = { format: 'kindlr', version: 1, name: 'Physics Playground', monitors: [],
    targets: [withCode(makeStage([b.night]), EX5.stage), withCode(makeTarget('Ball', art.ball, { y: 120 }), EX5.ball)] };
  return [p1, p2, p3, p4, p5];
}
