# Blocks ↔ Kindlr Script mapping

Every block, its Kindlr Script spelling, and its internal `op` name (the name used in `.kindlr` project JSON). Both forms build the same tree, so this table is exact in both directions.

## Special forms

| Block | Kindlr Script | op |
|---|---|---|
| variable reporter | `@score`, `@"high score"` | `var` |
| list reporter | `@@items`, `@@"my items"` | `list` |
| custom block input | `size` (bare name) or `param("size")` | `param` |
| define a block | `define name(a, b) { … }` / `define! name(a) { … }` | `define` |
| call a block | `name(1, "x")` | `call` |
| loose stack without hat | `script { … }` | – |
| a single reporter on its own | `script { eval(x_pos + 1) }` | – |
| `≠`, `≤`, `≥` | `a != b`, `a <= b`, `a >= b` | become `not (a = b)`, `not (a > b)`, `not (a < b)` |
| `if … else if …` | `if a { } else if b { } else { }` | nested `ct_ifelse` |
| negative | `-x` | `0 - x` (`op_sub`) |

## Events

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [when 🔥 Ignite pressed](blocks/events.md#ev-ignite) | `on_ignite { … }` | `ev_ignite` | hat |
| [when [space ▾] key pressed](blocks/events.md#ev-key) | `on_key("space") { … }` | `ev_key` | hat |
| [when this sprite clicked](blocks/events.md#ev-click) | `on_click { … }` | `ev_click` | hat, sprite |
| [when stage clicked](blocks/events.md#ev-stageclick) | `on_stage_click { … }` | `ev_stageclick` | hat, Stage |
| [when backdrop switches to [ ▾]](blocks/events.md#ev-backdrop) | `on_backdrop("") { … }` | `ev_backdrop` | hat |
| [when timer > (10)](blocks/events.md#ev-timer) | `on_timer(10) { … }` | `ev_timer` | hat |
| [when I receive [message1 ▾]](blocks/events.md#ev-receive) | `on_message("message1") { … }` | `ev_receive` | hat |
| [broadcast [message1 ▾]](blocks/events.md#ev-broadcast) | `broadcast("message1")` | `ev_broadcast` | stack |
| [broadcast [message1 ▾] and wait](blocks/events.md#ev-broadcastwait) | `broadcast_wait("message1")` | `ev_broadcastwait` | stack |

## Motion

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [move (10) steps](blocks/motion.md#mo-move) | `move(10)` | `mo_move` | stack, sprite |
| [turn ↻ (15) degrees](blocks/motion.md#mo-turnr) | `turn_right(15)` | `mo_turnr` | stack, sprite |
| [turn ↺ (15) degrees](blocks/motion.md#mo-turnl) | `turn_left(15)` | `mo_turnl` | stack, sprite |
| [go to [_random_ ▾]](blocks/motion.md#mo-goto) | `go_to("_random_")` | `mo_goto` | stack, sprite |
| [go to x: (0) y: (0)](blocks/motion.md#mo-gotoxy) | `go_xy(0, 0)` | `mo_gotoxy` | stack, sprite |
| [glide (1) secs to [_random_ ▾]](blocks/motion.md#mo-glideto) | `glide_to(1, "_random_")` | `mo_glideto` | stack, sprite |
| [glide (1) secs to x: (0) y: (0)](blocks/motion.md#mo-glide) | `glide_xy(1, 0, 0)` | `mo_glide` | stack, sprite |
| [point in direction (90)](blocks/motion.md#mo-point) | `point(90)` | `mo_point` | stack, sprite |
| [point towards [_mouse_ ▾]](blocks/motion.md#mo-towards) | `point_towards("_mouse_")` | `mo_towards` | stack, sprite |
| [change x by (10)](blocks/motion.md#mo-chx) | `change_x(10)` | `mo_chx` | stack, sprite |
| [set x to (0)](blocks/motion.md#mo-setx) | `set_x(0)` | `mo_setx` | stack, sprite |
| [change y by (10)](blocks/motion.md#mo-chy) | `change_y(10)` | `mo_chy` | stack, sprite |
| [set y to (0)](blocks/motion.md#mo-sety) | `set_y(0)` | `mo_sety` | stack, sprite |
| [if on edge, bounce](blocks/motion.md#mo-bounce) | `bounce` | `mo_bounce` | stack, sprite |
| [set rotation style [left-right ▾]](blocks/motion.md#mo-rotstyle) | `rotation_style("left-right")` | `mo_rotstyle` | stack, sprite |
| [x position](blocks/motion.md#mo-x) | `x_pos` | `mo_x` | reporter, sprite |
| [y position](blocks/motion.md#mo-y) | `y_pos` | `mo_y` | reporter, sprite |
| [direction](blocks/motion.md#mo-dir) | `direction` | `mo_dir` | reporter, sprite |

## Looks

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [say [Hello!] for (2) seconds](blocks/looks.md#lo-sayfor) | `say_for("Hello!", 2)` | `lo_sayfor` | stack, sprite |
| [say [Hello!]](blocks/looks.md#lo-say) | `say("Hello!")` | `lo_say` | stack, sprite |
| [think [Hmm...] for (2) seconds](blocks/looks.md#lo-thinkfor) | `think_for("Hmm...", 2)` | `lo_thinkfor` | stack, sprite |
| [think [Hmm...]](blocks/looks.md#lo-think) | `think("Hmm...")` | `lo_think` | stack, sprite |
| [switch costume to [ ▾]](blocks/looks.md#lo-costume) | `costume("")` | `lo_costume` | stack, sprite |
| [next costume](blocks/looks.md#lo-nextcostume) | `next_costume` | `lo_nextcostume` | stack, sprite |
| [switch backdrop to [ ▾]](blocks/looks.md#lo-backdrop) | `backdrop("")` | `lo_backdrop` | stack |
| [next backdrop](blocks/looks.md#lo-nextbackdrop) | `next_backdrop` | `lo_nextbackdrop` | stack |
| [change size by (10)](blocks/looks.md#lo-chsize) | `change_size(10)` | `lo_chsize` | stack, sprite |
| [set size to (100) %](blocks/looks.md#lo-setsize) | `set_size(100)` | `lo_setsize` | stack, sprite |
| [change [color ▾] effect by (25)](blocks/looks.md#lo-cheffect) | `change_effect("color", 25)` | `lo_cheffect` | stack |
| [set [ghost ▾] effect to (0)](blocks/looks.md#lo-seteffect) | `set_effect("ghost", 0)` | `lo_seteffect` | stack |
| [clear graphic effects](blocks/looks.md#lo-cleareffects) | `clear_effects` | `lo_cleareffects` | stack |
| [show](blocks/looks.md#lo-show) | `show` | `lo_show` | stack, sprite |
| [hide](blocks/looks.md#lo-hide) | `hide` | `lo_hide` | stack, sprite |
| [go to [front ▾] layer](blocks/looks.md#lo-front) | `layer("front")` | `lo_front` | stack, sprite |
| [go [forward ▾] (1) layers](blocks/looks.md#lo-layers) | `move_layers("forward", 1)` | `lo_layers` | stack, sprite |
| [costume [number ▾]](blocks/looks.md#lo-costumeof) | `costume_of("number")` | `lo_costumeof` | reporter, sprite |
| [backdrop [number ▾]](blocks/looks.md#lo-backdropof) | `backdrop_of("number")` | `lo_backdropof` | reporter |
| [size](blocks/looks.md#lo-size) | `size` | `lo_size` | reporter, sprite |

## Sound

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [play sound [pop ▾] until done](blocks/sound.md#so-playwait) | `play_sound_wait("pop")` | `so_playwait` | stack |
| [start sound [pop ▾]](blocks/sound.md#so-play) | `play_sound("pop")` | `so_play` | stack |
| [play note (60) for (0.5) beats](blocks/sound.md#so-note) | `note(60, 0.5)` | `so_note` | stack |
| [play tone (440) Hz for (0.5) secs](blocks/sound.md#so-tone) | `tone(440, 0.5)` | `so_tone` | stack |
| [set instrument to [square ▾]](blocks/sound.md#so-inst) | `instrument("square")` | `so_inst` | stack |
| [stop all sounds](blocks/sound.md#so-stop) | `stop_sounds` | `so_stop` | stack |
| [change volume by (-10)](blocks/sound.md#so-chvol) | `change_volume(-10)` | `so_chvol` | stack |
| [set volume to (100) %](blocks/sound.md#so-setvol) | `set_volume(100)` | `so_setvol` | stack |
| [set tempo to (90) bpm](blocks/sound.md#so-tempo) | `set_tempo(90)` | `so_tempo` | stack |
| [volume](blocks/sound.md#so-vol) | `volume` | `so_vol` | reporter |

## Control

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [wait (1) seconds](blocks/control.md#ct-wait) | `wait(1)` | `ct_wait` | stack |
| [repeat (10)](blocks/control.md#ct-repeat) | `repeat(10) { … }` | `ct_repeat` | c |
| [forever](blocks/control.md#ct-forever) | `forever { … }` | `ct_forever` | c |
| [if < > then](blocks/control.md#ct-if) | `if(condition) { … }` | `ct_if` | c |
| [if < > then](blocks/control.md#ct-ifelse) | `if condition { … } else { … }` | `ct_ifelse` | cc |
| [wait until < >](blocks/control.md#ct-waituntil) | `wait_until(condition)` | `ct_waituntil` | stack |
| [repeat until < >](blocks/control.md#ct-until) | `repeat_until(condition) { … }` | `ct_until` | c |
| [while < >](blocks/control.md#ct-while) | `while(condition) { … }` | `ct_while` | c |
| [for each [ ▾] from 1 to (10)](blocks/control.md#ct-for) | `for_each(@myvar, 10) { … }` | `ct_for` | c |
| [stop [all ▾]](blocks/control.md#ct-stop) | `stop("all")` | `ct_stop` | stack |
| [when I start as a clone](blocks/control.md#ct-cloned) | `on_clone { … }` | `ct_cloned` | hat, sprite |
| [create clone of [_myself_ ▾]](blocks/control.md#ct-clone) | `clone("_myself_")` | `ct_clone` | stack |
| [delete this clone](blocks/control.md#ct-delclone) | `delete_clone` | `ct_delclone` | cap, sprite |

## Sensing

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [touching [_mouse_ ▾] ?](blocks/sensing.md#se-touching) | `touching("_mouse_")` | `se_touching` | boolean, sprite |
| [touching color (#3DBE6A) ?](blocks/sensing.md#se-touchcolor) | `touching_color("#3DBE6A")` | `se_touchcolor` | boolean, sprite |
| [distance to [_mouse_ ▾]](blocks/sensing.md#se-distance) | `distance_to("_mouse_")` | `se_distance` | reporter, sprite |
| [ask [What's your name?] and wait](blocks/sensing.md#se-ask) | `ask("What's your name?")` | `se_ask` | stack |
| [answer](blocks/sensing.md#se-answer) | `answer` | `se_answer` | reporter |
| [key [space ▾] pressed?](blocks/sensing.md#se-key) | `key_pressed("space")` | `se_key` | boolean |
| [mouse down?](blocks/sensing.md#se-mousedown) | `mouse_down` | `se_mousedown` | boolean |
| [mouse x](blocks/sensing.md#se-mousex) | `mouse_x` | `se_mousex` | reporter |
| [mouse y](blocks/sensing.md#se-mousey) | `mouse_y` | `se_mousey` | reporter |
| [timer](blocks/sensing.md#se-timer) | `timer` | `se_timer` | reporter |
| [reset timer](blocks/sensing.md#se-resettimer) | `reset_timer` | `se_resettimer` | stack |
| [[x position ▾] of [_stage_ ▾]](blocks/sensing.md#se-of) | `prop_of("x position", "_stage_")` | `se_of` | reporter |
| [current [year ▾]](blocks/sensing.md#se-current) | `current("year")` | `se_current` | reporter |
| [days since 2000](blocks/sensing.md#se-days) | `days_since_2000` | `se_days` | reporter |

## Operators

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [() + ()](blocks/operators.md#op-add) | `a + b` | `op_add` | reporter |
| [() - ()](blocks/operators.md#op-sub) | `a - b` | `op_sub` | reporter |
| [() * ()](blocks/operators.md#op-mul) | `a * b` | `op_mul` | reporter |
| [() / ()](blocks/operators.md#op-div) | `a / b` | `op_div` | reporter |
| [pick random (1) to (10)](blocks/operators.md#op-random) | `random(1, 10)` | `op_random` | reporter |
| [[] > [50]](blocks/operators.md#op-gt) | `a > b` | `op_gt` | boolean |
| [[] < [50]](blocks/operators.md#op-lt) | `a < b` | `op_lt` | boolean |
| [[] = [50]](blocks/operators.md#op-eq) | `a = b` | `op_eq` | boolean |
| [< > and < >](blocks/operators.md#op-and) | `a and b` | `op_and` | boolean |
| [< > or < >](blocks/operators.md#op-or) | `a or b` | `op_or` | boolean |
| [not < >](blocks/operators.md#op-not) | `not(condition)` | `op_not` | boolean |
| [join [apple ] [pie]](blocks/operators.md#op-join) | `join("apple ", "pie")` | `op_join` | reporter |
| [letter (1) of [apple]](blocks/operators.md#op-letter) | `letter_of(1, "apple")` | `op_letter` | reporter |
| [length of [apple]](blocks/operators.md#op-length) | `length_of("apple")` | `op_length` | reporter |
| [[apple] contains [a] ?](blocks/operators.md#op-contains) | `contains("apple", "a")` | `op_contains` | boolean |
| [() mod ()](blocks/operators.md#op-mod) | `a % b` | `op_mod` | reporter |
| [round ()](blocks/operators.md#op-round) | `round(0)` | `op_round` | reporter |
| [[abs ▾] of ()](blocks/operators.md#op-math) | `math("abs", 0)` | `op_math` | reporter |

## Variables

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [set [ ▾] to [0]](blocks/variables.md#va-set) | `set(@myvar, 0)` | `va_set` | stack |
| [change [ ▾] by (1)](blocks/variables.md#va-change) | `change(@myvar, 1)` | `va_change` | stack |
| [show variable [ ▾]](blocks/variables.md#va-show) | `show_var(@myvar)` | `va_show` | stack |
| [hide variable [ ▾]](blocks/variables.md#va-hide) | `hide_var(@myvar)` | `va_hide` | stack |
| [](blocks/variables.md#var) | `@name` | `var` | reporter |

## Lists

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [add [thing] to [ ▾]](blocks/lists.md#li-add) | `list_add("thing", @@mylist)` | `li_add` | stack |
| [delete (1) of [ ▾]](blocks/lists.md#li-delete) | `list_delete(1, @@mylist)` | `li_delete` | stack |
| [delete all of [ ▾]](blocks/lists.md#li-clear) | `list_clear(@@mylist)` | `li_clear` | stack |
| [insert [thing] at (1) of [ ▾]](blocks/lists.md#li-insert) | `list_insert("thing", 1, @@mylist)` | `li_insert` | stack |
| [replace item (1) of [ ▾] with [thing]](blocks/lists.md#li-replace) | `list_replace(1, @@mylist, "thing")` | `li_replace` | stack |
| [item (1) of [ ▾]](blocks/lists.md#li-item) | `list_item(1, @@mylist)` | `li_item` | reporter |
| [item # of [thing] in [ ▾]](blocks/lists.md#li-index) | `list_index("thing", @@mylist)` | `li_index` | reporter |
| [length of [ ▾]](blocks/lists.md#li-length) | `list_length(@@mylist)` | `li_length` | reporter |
| [[ ▾] contains [thing] ?](blocks/lists.md#li-contains) | `list_contains(@@mylist, "thing")` | `li_contains` | boolean |
| [show list [ ▾]](blocks/lists.md#li-show) | `show_list(@@mylist)` | `li_show` | stack |
| [hide list [ ▾]](blocks/lists.md#li-hide) | `hide_list(@@mylist)` | `li_hide` | stack |
| [](blocks/lists.md#list) | `@@name` | `list` | reporter |

## Pen

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [erase all](blocks/pen.md#pe-clear) | `pen_clear` | `pe_clear` | stack |
| [stamp](blocks/pen.md#pe-stamp) | `stamp` | `pe_stamp` | stack, sprite |
| [pen down](blocks/pen.md#pe-down) | `pen_down` | `pe_down` | stack, sprite |
| [pen up](blocks/pen.md#pe-up) | `pen_up` | `pe_up` | stack, sprite |
| [set pen color to (#4C7EF3)](blocks/pen.md#pe-color) | `pen_color("#4C7EF3")` | `pe_color` | stack, sprite |
| [change pen hue by (10)](blocks/pen.md#pe-chhue) | `pen_hue(10)` | `pe_chhue` | stack, sprite |
| [set pen size to (2)](blocks/pen.md#pe-size) | `pen_size(2)` | `pe_size` | stack, sprite |
| [change pen size by (1)](blocks/pen.md#pe-chsize) | `change_pen_size(1)` | `pe_chsize` | stack, sprite |

## Console & UI

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [print [Hello, world!]](blocks/program.md#pr-print) | `print("Hello, world!")` | `pr_print` | stack |
| [clear console](blocks/program.md#pr-clear) | `clear_console` | `pr_clear` | stack |
| [add button [btn1] text [Click me] at x: (0) y: (0)](blocks/program.md#ui-button) | `ui_button("btn1", "Click me", 0, 0)` | `ui_button` | stack |
| [add label [label1] text [Hello] at x: (0) y: (120)](blocks/program.md#ui-label) | `ui_label("label1", "Hello", 0, 120)` | `ui_label` | stack |
| [add text box [input1] at x: (0) y: (-60)](blocks/program.md#ui-textbox) | `ui_textbox("input1", 0, -60)` | `ui_textbox` | stack |
| [add slider [slider1] from (0) to (100) at x: (0) y: (-120)](blocks/program.md#ui-slider) | `ui_slider("slider1", 0, 100, 0, -120)` | `ui_slider` | stack |
| [set text of widget [label1] to [Hi]](blocks/program.md#ui-settext) | `ui_set_text("label1", "Hi")` | `ui_settext` | stack |
| [remove widget [btn1]](blocks/program.md#ui-remove) | `ui_remove("btn1")` | `ui_remove` | stack |
| [remove all widgets](blocks/program.md#ui-clear) | `ui_clear` | `ui_clear` | stack |
| [value of widget [input1]](blocks/program.md#ui-value) | `ui_value("input1")` | `ui_value` | reporter |
| [when widget [btn1] clicked](blocks/program.md#ui-clicked) | `on_widget_click("btn1") { … }` | `ui_clicked` | hat |
| [when widget [slider1] changed](blocks/program.md#ui-changed) | `on_widget_change("slider1") { … }` | `ui_changed` | hat |
| [save [best] = [0] to project storage](blocks/program.md#st-set) | `store_set("best", 0)` | `st_set` | stack |
| [stored value [best]](blocks/program.md#st-get) | `store_get("best")` | `st_get` | reporter |

## Data

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [true](blocks/data.md#dt-true) | `true` | `dt_true` | boolean |
| [false](blocks/data.md#dt-false) | `false` | `dt_false` | boolean |
| [type of [42]](blocks/data.md#dt-typeof) | `type_of("42")` | `dt_typeof` | reporter |
| [uppercase [hello]](blocks/data.md#dt-upper) | `upper("hello")` | `dt_upper` | reporter |
| [lowercase [HELLO]](blocks/data.md#dt-lower) | `lower("HELLO")` | `dt_lower` | reporter |
| [trim [  hi  ]](blocks/data.md#dt-trim) | `trim("  hi  ")` | `dt_trim` | reporter |
| [replace [a] with [o] in [banana]](blocks/data.md#dt-replace) | `replace("a", "o", "banana")` | `dt_replace` | reporter |
| [letters (1) to (3) of [blocks]](blocks/data.md#dt-sub) | `substring(1, 3, "blocks")` | `dt_sub` | reporter |
| [position of [c] in [abc]](blocks/data.md#dt-index) | `index_of("c", "abc")` | `dt_index` | reporter |
| [split [a,b,c] by [,] into list [ ▾]](blocks/data.md#dt-split) | `split("a,b,c", ",", @@mylist)` | `dt_split` | stack |
| [join list [ ▾] with [, ]](blocks/data.md#dt-joinlist) | `join_list(@@mylist, ", ")` | `dt_joinlist` | reporter |
| [set [ ▾] to empty map](blocks/data.md#dt-newmap) | `new_map(@myvar)` | `dt_newmap` | stack |
| [in map [ ▾] set [key] to [value]](blocks/data.md#dt-mapset) | `map_set(@myvar, "key", "value")` | `dt_mapset` | stack |
| [item [key] of map [ ▾]](blocks/data.md#dt-mapget) | `map_get("key", @myvar)` | `dt_mapget` | reporter |
| [map [ ▾] has [key] ?](blocks/data.md#dt-maphas) | `map_has(@myvar, "key")` | `dt_maphas` | boolean |
| [delete [key] from map [ ▾]](blocks/data.md#dt-mapdel) | `map_delete("key", @myvar)` | `dt_mapdel` | stack |
| [put keys of map [ ▾] into list [ ▾]](blocks/data.md#dt-mapkeys) | `map_keys(@myvar, @@mylist)` | `dt_mapkeys` | stack |
| [size of map [ ▾]](blocks/data.md#dt-mapsize) | `map_size(@myvar)` | `dt_mapsize` | reporter |
| [json of [ ▾]](blocks/data.md#dt-tojson) | `to_json(@myvar)` | `dt_tojson` | reporter |
| [set [ ▾] to parsed json [{"a": 1}]](blocks/data.md#dt-fromjson) | `from_json(@myvar, "{\"a\": 1}")` | `dt_fromjson` | stack |

## Game

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [every (1) seconds](blocks/game.md#ev-every) | `every(1) { … }` | `ev_every` | hat |
| [when drawing (every frame)](blocks/game.md#ga-draw) | `on_draw { … }` | `ga_draw` | hat |
| [draw rect x: (0) y: (0) w: (60) h: (40) (#4C7EF3)](blocks/game.md#ga-rect) | `draw_rect(0, 0, 60, 40, "#4C7EF3")` | `ga_rect` | stack |
| [draw circle x: (0) y: (0) r: (20) (#FF5D73)](blocks/game.md#ga-circle) | `draw_circle(0, 0, 20, "#FF5D73")` | `ga_circle` | stack |
| [draw line (-50) , (0) to (50) , (0) (#FFD23F)](blocks/game.md#ga-line) | `draw_line(-50, 0, 50, 0, "#FFD23F")` | `ga_line` | stack |
| [draw text [Score] at x: (-200) y: (160) (#ffffff)](blocks/game.md#ga-text) | `draw_text("Score", -200, 160, "#ffffff")` | `ga_text` | stack |
| [turn physics [on ▾]](blocks/game.md#ga-physics) | `physics("on")` | `ga_physics` | stack, sprite |
| [set velocity to x: (3) y: (0)](blocks/game.md#ga-setvel) | `set_velocity(3, 0)` | `ga_setvel` | stack, sprite |
| [change velocity by x: (0) y: (8)](blocks/game.md#ga-chvel) | `change_velocity(0, 8)` | `ga_chvel` | stack, sprite |
| [set speed (4) in my direction](blocks/game.md#ga-speed) | `set_speed(4)` | `ga_speed` | stack, sprite |
| [set gravity to (0.5)](blocks/game.md#ga-gravity) | `set_gravity(0.5)` | `ga_gravity` | stack, sprite |
| [set friction to (0.02)](blocks/game.md#ga-friction) | `set_friction(0.02)` | `ga_friction` | stack, sprite |
| [velocity x](blocks/game.md#ga-vx) | `velocity_x` | `ga_vx` | reporter, sprite |
| [velocity y](blocks/game.md#ga-vy) | `velocity_y` | `ga_vy` | reporter, sprite |
| [set camera to x: (0) y: (0)](blocks/game.md#ga-camera) | `camera(0, 0)` | `ga_camera` | stack |
| [change camera by x: (5) y: (0)](blocks/game.md#ga-chcamera) | `change_camera(5, 0)` | `ga_chcamera` | stack |
| [center camera on me](blocks/game.md#ga-follow) | `camera_follow` | `ga_follow` | stack, sprite |
| [camera x](blocks/game.md#ga-camx) | `camera_x` | `ga_camx` | reporter |
| [camera y](blocks/game.md#ga-camy) | `camera_y` | `ga_camy` | reporter |
| [go to room [ ▾]](blocks/game.md#ga-room) | `go_room("")` | `ga_room` | stack |
| [room name](blocks/game.md#ga-roomname) | `room_name` | `ga_roomname` | reporter |

## My Blocks

| Block | Kindlr Script | op | Shape |
|---|---|---|---|
| [define](blocks/myblocks.md#define) | `define name(a) { }` | `define` | hat |
| [call](blocks/myblocks.md#call) | `name(args)` | `call` | stack |
| [](blocks/myblocks.md#param) | `name` | `param` | reporter |

