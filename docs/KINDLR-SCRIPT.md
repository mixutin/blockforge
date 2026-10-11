# Kindlr Script language guide

**Kindlr Script** is the text form of **Kindlr Blocks**. Every block program can be shown as Kindlr Script, and every Kindlr Script program becomes blocks. Both are the **same tree** and run on the **same tree-walking interpreter** (`src/runtime.js`). Kindlr Script is never translated to JavaScript or `eval`'d.

The full list of blocks with their exact Kindlr Script spelling is in [BLOCKS.md](BLOCKS.md).

## Files

| File | What it is |
|---|---|
| `name.kindlr` | A whole project (sprites, costumes, scripts, variables). Download/Open in the editor toolbar. |
| `name.kls` | Kindlr Script for one sprite (plain UTF-8 text). Use **Download .kls** / **Open .kls** in the Kindlr Script tab, then **Apply to blocks**. |

Kindlr was called *Blockforge* (and the text language *Ember*) before. Nothing changed in the syntax: old `.bforge.json` projects and old scripts open as they are, and autosaved work in the browser is migrated automatically.

## Scripts

A sprite's (or the Stage's) code is a list of scripts. Each one starts with a **hat**:

```
on_ignite { ... }                 // when the Ignite button is pressed
on_key("space") { ... }           // key names: "space", "up arrow", "a", "any", ...
on_click { ... }                  // this sprite clicked      (on_stage_click for the Stage)
on_message("level up") { ... }    // when I receive
on_clone { ... }                  // when I start as a clone
on_backdrop("night sky") { ... }  // when the backdrop/room switches
on_timer(10) { ... }              // when timer > 10
every(0.5) { ... }                // repeatedly, every 0.5 seconds while the project runs
on_draw { ... }                   // every frame; use draw_* commands here
on_widget_click("btn1") { ... }   on_widget_change("slider1") { ... }
define name(a, b) { ... }         // a custom block ("define!" = run without screen refresh)
script { ... }                    // a loose stack with no hat (runs when clicked)
```

## Statements

A statement is a block name, optionally followed by arguments in parentheses. Zero-argument blocks can drop the parentheses:

```
move(10)
say_for("Hello!", 2)
next_costume
pen_down()
```

C-blocks take a body in braces. Conditions can be written with or without parentheses:

```
repeat(10) { turn_right(36) }
forever { move(2)  bounce }
if touching("_edge_") { turn_right(180) } else { move(5) }
if (x_pos > 100) { set_x(-100) }
repeat_until(@lives < 1) { wait(1) }
while(key_pressed("space")) { change_y(2) }
for_each(@i, 10) { print(@i) }
```

Statements may be separated by newlines or spaces. `//` starts a comment.

## Values and expressions

| Kind | Example |
|---|---|
| number | `10`, `-3.5`, `1e3` |
| text | `"hello"` (escapes: `\"`, `\\`, `\n`) |
| boolean | `true`, `false` |
| variable | `@score`, `@"high score"` |
| list (as text) | `@@items`, `@@"my items"` |
| custom block input | `length` (a bare name inside `define`) |
| reporter call | `x_pos`, `random(1, 6)`, `join("a", "b")`, `list_item(1, @@items)` |

Operators, from lowest to highest precedence:

| Precedence | Operators |
|---|---|
| 1 | `or` |
| 2 | `and` |
| 3 | `not` (prefix) |
| 4 | `<`  `>`  `=`  (also `==`, `!=`, `<=`, `>=`, which become `not`/`=` combinations) |
| 5 | `+`  `-` |
| 6 | `*`  `/`  `%` (mod) |
| 7 | unary `-` |

Comparison is numeric when both sides look like numbers, otherwise case-insensitive text comparison. Like the blocks, Kindlr Script is forgiving: text that isn't a number counts as `0` in arithmetic.

## Menus

Dropdown arguments are written as strings. Special menu values:

| Value | Meaning |
|---|---|
| `"_random_"` | random position |
| `"_mouse_"` | mouse pointer |
| `"_edge_"` | stage edge |
| `"_myself_"` | this sprite (for `clone`) |
| `"_stage_"` | the Stage (for `prop_of`) |

Variable and list menus take a reference: `set(@score, 0)`, `list_add("x", @@items)`.

## Variables, lists, maps

```
set(@score, 0)
change(@score, 1)
list_add("apple", @@basket)
list_item(1, @@basket)
new_map(@player)
map_set(@player, "name", "Mika")
map_get("name", @player)
print(to_json(@player))            // {"name":"Mika"}
from_json(@player, "{\"hp\": 3}")
```

Variables used in Kindlr Script that don't exist yet are created automatically (for all sprites) when you click **Apply to blocks**.

## Custom blocks

```
define! star(size) {
  repeat(5) {
    move(size)
    turn_right(144)
  }
}

on_ignite {
  pen_down
  star(80)
}
```

`define!` runs the body without redrawing the screen between loop iterations (it's still capped, see Limits).

## Program mode

```
on_ignite {
  clear_console
  ui_label("title", "Tip calculator", 0, 140)
  ui_textbox("bill", 0, 90)
  ui_slider("tip", 0, 30, 0, 40)
  ui_button("go", "Calculate", 0, -10)
}

on_widget_click("go") {
  print(join("Tip: ", round(ui_value("bill") * ui_value("tip") / 100)))
  store_set("last_bill", ui_value("bill"))   // saved with the project
}
```

## Game toolkit

```
on_ignite {
  set_gravity(0.5)
  set_velocity(3, 0)
  physics("on")             // velocity + gravity + friction applied every frame
}
on_key("space") { change_velocity(0, 10) }
on_draw {                    // runs every frame; shapes are cleared each frame
  draw_rect(-240, -180, 480, 10, "#5BAF4E")   // x, y = bottom-left corner
  draw_text(join("vy ", round(velocity_y)), -230, 160, "#ffffff")
}
every(1) { change_camera(10, 0) }               // camera moves sprites, pen and shapes
```

Rooms are backdrops: `go_room("level 2")`, `room_name`, and `on_backdrop("level 2") { ... }`.

## Limits

The same limits apply to blocks and Kindlr Script (see `src/limits.js`):

| Limit | Value |
|---|---|
| Kindlr Script source size | 1 MB |
| Project JSON size | 5 MB |
| Nesting depth | 64 |
| Blocks per project | 20,000 |
| Sprites | 100 |
| Variables + lists per target | 1,000 |
| List length | 200,000 items |
| String length | 100,000 characters |
| Map size | 10,000 keys |
| Live clones | 300 |
| Custom-block recursion | 400 deep |
| Block steps per frame | 100,000, then the thread is forced to yield |
| No-refresh (`define!`) burst | 500 ms, then it yields |
| Watchdog | any single uninterrupted step over 1 s stops the project |

## Errors

Parse errors report the line: `Line 3: expected ) but found }`. Runtime errors (e.g. invalid JSON, recursion too deep) stop only the script that failed and show a toast.
