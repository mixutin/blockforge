# Kindlr block & Kindlr Script reference

_Generated from `src/blocks.js` by `npm run docs`. Every block has an exact Kindlr Script equivalent; both compile to the same tree and run on the same interpreter._

Notation: `@name` = variable, `@@name` = list, menu arguments are strings (e.g. `"space"`). Shapes: **hat** starts a script, **C** wraps a body `{ }`, **reporter** returns a value, **boolean** returns true/false.

## Events

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| when 🔥 Ignite pressed | `on_ignite { … }` | hat | — |
| when [key ▾] key pressed | `on_key("space") { … }` | hat | menu: key |
| when this sprite clicked | `on_click { … }` | hat · sprite only | — |
| when stage clicked | `on_stage_click { … }` | hat · stage only | — |
| when backdrop switches to [backdrop ▾] | `on_backdrop("") { … }` | hat | menu: backdrop |
| when timer > ( ) | `on_timer(10) { … }` | hat | number |
| when I receive [message ▾] | `on_message("message1") { … }` | hat | menu: message |
| broadcast [message ▾] | `broadcast("message1")` | stack | menu: message |
| broadcast [message ▾] and wait | `broadcast_wait("message1")` | stack | menu: message |

## Motion

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| move ( ) steps | `move(10)` | stack · sprite only | number |
| turn ↻ ( ) degrees | `turn_right(15)` | stack · sprite only | number |
| turn ↺ ( ) degrees | `turn_left(15)` | stack · sprite only | number |
| go to [goto ▾] | `go_to("_random_")` | stack · sprite only | menu: goto |
| go to x: ( ) y: ( ) | `go_xy(0, 0)` | stack · sprite only | number, number |
| glide ( ) secs to [goto ▾] | `glide_to(1, "_random_")` | stack · sprite only | number, menu: goto |
| glide ( ) secs to x: ( ) y: ( ) | `glide_xy(1, 0, 0)` | stack · sprite only | number, number, number |
| point in direction ( ) | `point(90)` | stack · sprite only | number |
| point towards [towards ▾] | `point_towards("_mouse_")` | stack · sprite only | menu: towards |
| change x by ( ) | `change_x(10)` | stack · sprite only | number |
| set x to ( ) | `set_x(0)` | stack · sprite only | number |
| change y by ( ) | `change_y(10)` | stack · sprite only | number |
| set y to ( ) | `set_y(0)` | stack · sprite only | number |
| if on edge, bounce | `bounce` | stack · sprite only | — |
| set rotation style [rotStyle ▾] | `rotation_style("left-right")` | stack · sprite only | menu: rotStyle |
| x position | `x_pos` | reporter · sprite only | — |
| y position | `y_pos` | reporter · sprite only | — |
| direction | `direction` | reporter · sprite only | — |

## Looks

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| say [ ] for ( ) seconds | `say_for("Hello!", 2)` | stack · sprite only | text, number |
| say [ ] | `say("Hello!")` | stack · sprite only | text |
| think [ ] for ( ) seconds | `think_for("Hmm...", 2)` | stack · sprite only | text, number |
| think [ ] | `think("Hmm...")` | stack · sprite only | text |
| switch costume to [costume ▾] | `costume("")` | stack · sprite only | menu: costume |
| next costume | `next_costume` | stack · sprite only | — |
| switch backdrop to [backdrop ▾] | `backdrop("")` | stack | menu: backdrop |
| next backdrop | `next_backdrop` | stack | — |
| change size by ( ) | `change_size(10)` | stack · sprite only | number |
| set size to ( ) % | `set_size(100)` | stack · sprite only | number |
| change [effect ▾] effect by ( ) | `change_effect("color", 25)` | stack | menu: effect, number |
| set [effect ▾] effect to ( ) | `set_effect("ghost", 0)` | stack | menu: effect, number |
| clear graphic effects | `clear_effects` | stack | — |
| show | `show` | stack · sprite only | — |
| hide | `hide` | stack · sprite only | — |
| go to [frontBack ▾] layer | `layer("front")` | stack · sprite only | menu: frontBack |
| go [fwdBack ▾] ( ) layers | `move_layers("forward", 1)` | stack · sprite only | menu: fwdBack, number |
| costume [numName ▾] | `costume_of("number")` | reporter · sprite only | menu: numName |
| backdrop [numName ▾] | `backdrop_of("number")` | reporter | menu: numName |
| size | `size` | reporter · sprite only | — |

## Sound

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| play sound [sound ▾] until done | `play_sound_wait("pop")` | stack | menu: sound |
| start sound [sound ▾] | `play_sound("pop")` | stack | menu: sound |
| play note ( ) for ( ) beats | `note(60, 0.5)` | stack | number, number |
| play tone ( ) Hz for ( ) secs | `tone(440, 0.5)` | stack | number, number |
| set instrument to [wave ▾] | `instrument("square")` | stack | menu: wave |
| stop all sounds | `stop_sounds` | stack | — |
| change volume by ( ) | `change_volume(-10)` | stack | number |
| set volume to ( ) % | `set_volume(100)` | stack | number |
| set tempo to ( ) bpm | `set_tempo(90)` | stack | number |
| volume | `volume` | reporter | — |

## Control

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| wait ( ) seconds | `wait(1)` | stack | number |
| repeat ( ) | `repeat(10) { … }` | C | number |
| forever | `forever { … }` | C | — |
| if < > then | `if("false") { … }` | C | boolean |
| if < > then | `if("false") { … } else { … }` | C (if/else) | boolean |
| wait until < > | `wait_until("false")` | stack | boolean |
| repeat until < > | `repeat_until("false") { … }` | C | boolean |
| while < > | `while("false") { … }` | C | boolean |
| for each [var ▾] from 1 to ( ) | `for_each(@var, 10) { … }` | C | menu: var, number |
| stop [stopOpt ▾] | `stop("all")` | stack | menu: stopOpt |
| when I start as a clone | `on_clone { … }` | hat · sprite only | — |
| create clone of [cloneOf ▾] | `clone("_myself_")` | stack | menu: cloneOf |
| delete this clone | `delete_clone` | cap · sprite only | — |

## Sensing

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| touching [touch ▾] ? | `touching("_mouse_")` | boolean · sprite only | menu: touch |
| touching color (color) ? | `touching_color("#3DBE6A")` | boolean · sprite only | color "#rrggbb" |
| distance to [towards ▾] | `distance_to("_mouse_")` | reporter · sprite only | menu: towards |
| ask [ ] and wait | `ask("What's your name?")` | stack | text |
| answer | `answer` | reporter | — |
| key [key ▾] pressed? | `key_pressed("space")` | boolean | menu: key |
| mouse down? | `mouse_down` | boolean | — |
| mouse x | `mouse_x` | reporter | — |
| mouse y | `mouse_y` | reporter | — |
| timer | `timer` | reporter | — |
| reset timer | `reset_timer` | stack | — |
| [prop ▾] of [object ▾] | `prop_of("x position", "_stage_")` | reporter | menu: prop, menu: object |
| current [current ▾] | `current("year")` | reporter | menu: current |
| days since 2000 | `days_since_2000` | reporter | — |

## Operators

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| ( ) + ( ) | `a + b` | reporter | number, number |
| ( ) - ( ) | `a - b` | reporter | number, number |
| ( ) * ( ) | `a * b` | reporter | number, number |
| ( ) / ( ) | `a / b` | reporter | number, number |
| pick random ( ) to ( ) | `random(1, 10)` | reporter | number, number |
| [ ] > [ ] | `a > b` | boolean | text, text |
| [ ] < [ ] | `a < b` | boolean | text, text |
| [ ] = [ ] | `a = b` | boolean | text, text |
| < > and < > | `a and b` | boolean | boolean, boolean |
| < > or < > | `a or b` | boolean | boolean, boolean |
| not < > | `not a` | boolean | boolean |
| join [ ] [ ] | `join("apple ", "pie")` | reporter | text, text |
| letter ( ) of [ ] | `letter_of(1, "apple")` | reporter | number, text |
| length of [ ] | `length_of("apple")` | reporter | text |
| [ ] contains [ ] ? | `contains("apple", "a")` | boolean | text, text |
| ( ) mod ( ) | `a % b` | reporter | number, number |
| round ( ) | `round()` | reporter | number |
| [mathfn ▾] of ( ) | `math("abs", )` | reporter | menu: mathfn, number |

## Variables

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| set [var ▾] to [ ] | `set(@var, 0)` | stack | menu: var, text |
| change [var ▾] by ( ) | `change(@var, 1)` | stack | menu: var, number |
| show variable [var ▾] | `show_var(@var)` | stack | menu: var |
| hide variable [var ▾] | `hide_var(@var)` | stack | menu: var |

## Lists

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| add [ ] to [list ▾] | `list_add("thing", @@list)` | stack | text, menu: list |
| delete ( ) of [list ▾] | `list_delete(1, @@list)` | stack | number, menu: list |
| delete all of [list ▾] | `list_clear(@@list)` | stack | menu: list |
| insert [ ] at ( ) of [list ▾] | `list_insert("thing", 1, @@list)` | stack | text, number, menu: list |
| replace item ( ) of [list ▾] with [ ] | `list_replace(1, @@list, "thing")` | stack | number, menu: list, text |
| item ( ) of [list ▾] | `list_item(1, @@list)` | reporter | number, menu: list |
| item # of [ ] in [list ▾] | `list_index("thing", @@list)` | reporter | text, menu: list |
| length of [list ▾] | `list_length(@@list)` | reporter | menu: list |
| [list ▾] contains [ ] ? | `list_contains(@@list, "thing")` | boolean | menu: list, text |
| show list [list ▾] | `show_list(@@list)` | stack | menu: list |
| hide list [list ▾] | `hide_list(@@list)` | stack | menu: list |

## Pen

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| erase all | `pen_clear` | stack | — |
| stamp | `stamp` | stack · sprite only | — |
| pen down | `pen_down` | stack · sprite only | — |
| pen up | `pen_up` | stack · sprite only | — |
| set pen color to (color) | `pen_color("#4C7EF3")` | stack · sprite only | color "#rrggbb" |
| change pen hue by ( ) | `pen_hue(10)` | stack · sprite only | number |
| set pen size to ( ) | `pen_size(2)` | stack · sprite only | number |
| change pen size by ( ) | `change_pen_size(1)` | stack · sprite only | number |

## Console & UI

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| print [ ] | `print("Hello, world!")` | stack | text |
| clear console | `clear_console` | stack | — |
| add button [ ] text [ ] at x: ( ) y: ( ) | `ui_button("btn1", "Click me", 0, 0)` | stack | text, text, number, number |
| add label [ ] text [ ] at x: ( ) y: ( ) | `ui_label("label1", "Hello", 0, 120)` | stack | text, text, number, number |
| add text box [ ] at x: ( ) y: ( ) | `ui_textbox("input1", 0, -60)` | stack | text, number, number |
| add slider [ ] from ( ) to ( ) at x: ( ) y: ( ) | `ui_slider("slider1", 0, 100, 0, -120)` | stack | text, number, number, number, number |
| set text of widget [ ] to [ ] | `ui_set_text("label1", "Hi")` | stack | text, text |
| remove widget [ ] | `ui_remove("btn1")` | stack | text |
| remove all widgets | `ui_clear` | stack | — |
| value of widget [ ] | `ui_value("input1")` | reporter | text |
| when widget [ ] clicked | `on_widget_click("btn1") { … }` | hat | text |
| when widget [ ] changed | `on_widget_change("slider1") { … }` | hat | text |
| save [ ] = [ ] to project storage | `store_set("best", 0)` | stack | text, text |
| stored value [ ] | `store_get("best")` | reporter | text |

## Data

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| true | `true` | boolean | — |
| false | `false` | boolean | — |
| type of [ ] | `type_of(42)` | reporter | text |
| uppercase [ ] | `upper("hello")` | reporter | text |
| lowercase [ ] | `lower("HELLO")` | reporter | text |
| trim [ ] | `trim("  hi  ")` | reporter | text |
| replace [ ] with [ ] in [ ] | `replace("a", "o", "banana")` | reporter | text, text, text |
| letters ( ) to ( ) of [ ] | `substring(1, 3, "blocks")` | reporter | number, number, text |
| position of [ ] in [ ] | `index_of("c", "abc")` | reporter | text, text |
| split [ ] by [ ] into list [list ▾] | `split("a,b,c", ",", @@list)` | stack | text, text, menu: list |
| join list [list ▾] with [ ] | `join_list(@@list, ", ")` | reporter | menu: list, text |
| set [var ▾] to empty map | `new_map(@var)` | stack | menu: var |
| in map [var ▾] set [ ] to [ ] | `map_set(@var, "key", "value")` | stack | menu: var, text, text |
| item [ ] of map [var ▾] | `map_get("key", @var)` | reporter | text, menu: var |
| map [var ▾] has [ ] ? | `map_has(@var, "key")` | boolean | menu: var, text |
| delete [ ] from map [var ▾] | `map_delete("key", @var)` | stack | text, menu: var |
| put keys of map [var ▾] into list [list ▾] | `map_keys(@var, @@list)` | stack | menu: var, menu: list |
| size of map [var ▾] | `map_size(@var)` | reporter | menu: var |
| json of [var ▾] | `to_json(@var)` | reporter | menu: var |
| set [var ▾] to parsed json [ ] | `from_json(@var, "{"a": 1}")` | stack | menu: var, text |

## Game

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|
| every ( ) seconds | `every(1) { … }` | hat | number |
| when drawing (every frame) | `on_draw { … }` | hat | — |
| draw rect x: ( ) y: ( ) w: ( ) h: ( ) (color) | `draw_rect(0, 0, 60, 40, "#4C7EF3")` | stack | number, number, number, number, color "#rrggbb" |
| draw circle x: ( ) y: ( ) r: ( ) (color) | `draw_circle(0, 0, 20, "#FF5D73")` | stack | number, number, number, color "#rrggbb" |
| draw line ( ) , ( ) to ( ) , ( ) (color) | `draw_line(-50, 0, 50, 0, "#FFD23F")` | stack | number, number, number, number, color "#rrggbb" |
| draw text [ ] at x: ( ) y: ( ) (color) | `draw_text("Score", -200, 160, "#ffffff")` | stack | text, number, number, color "#rrggbb" |
| turn physics [onoff ▾] | `physics("on")` | stack · sprite only | menu: onoff |
| set velocity to x: ( ) y: ( ) | `set_velocity(3, 0)` | stack · sprite only | number, number |
| change velocity by x: ( ) y: ( ) | `change_velocity(0, 8)` | stack · sprite only | number, number |
| set speed ( ) in my direction | `set_speed(4)` | stack · sprite only | number |
| set gravity to ( ) | `set_gravity(0.5)` | stack · sprite only | number |
| set friction to ( ) | `set_friction(0.02)` | stack · sprite only | number |
| velocity x | `velocity_x` | reporter · sprite only | — |
| velocity y | `velocity_y` | reporter · sprite only | — |
| set camera to x: ( ) y: ( ) | `camera(0, 0)` | stack | number, number |
| change camera by x: ( ) y: ( ) | `change_camera(5, 0)` | stack | number, number |
| center camera on me | `camera_follow` | stack · sprite only | — |
| camera x | `camera_x` | reporter | — |
| camera y | `camera_y` | reporter | — |
| go to room [backdrop ▾] | `go_room("")` | stack | menu: backdrop |
| room name | `room_name` | reporter | — |

## My Blocks

| Block | Kindlr Script | Shape | Inputs |
|---|---|---|---|

## My Blocks

| Form | Kindlr Script |
|---|---|
| define a block | `define name(a, b) { … }` |
| define, run without screen refresh | `define! name(a, b) { … }` |
| call it | `name(1, "x")` |
| use an input inside the body | `a` (bare identifier) |

## Variables & lists

| Form | Kindlr Script |
|---|---|
| variable reporter | `@score` or `@"my score"` |
| list reporter | `@@items` or `@@"my items"` |
