# Built-in function reference

Every built-in command, reporter and event of Kindlr Script, sorted A–Z. A **command** is a statement on its own line. A **reporter** gives back a value you can use inside other expressions. An **event** (hat) starts a script.

Argument types: *number*, *text*, *condition* (true/false), *colour* (`"#RRGGBB"`), `@variable`, `@@list`, or a **menu** (a text value from a fixed list, see the block page).

**Errors:** most built-ins never fail. Wrong types are converted (text that is not a number counts as 0; numbers become text when needed). The only runtime errors are listed in [Error messages](errors.md). Giving too many arguments is a parse error: `'move' takes 1 argument(s) but got 2`. Missing arguments use the block's default value.

| Function | Kind | Block |
|---|---|---|
| [`answer`](#answer) | reporter → number/text | [Sensing](../blocks/sensing.md#se-answer) |
| [`ask`](#ask) | command | [Sensing](../blocks/sensing.md#se-ask) |
| [`backdrop`](#backdrop) | command | [Looks](../blocks/looks.md#lo-backdrop) |
| [`backdrop_of`](#backdrop-of) | reporter → number/text | [Looks](../blocks/looks.md#lo-backdropof) |
| [`bounce`](#bounce) | command | [Motion](../blocks/motion.md#mo-bounce) |
| [`broadcast`](#broadcast) | command | [Events](../blocks/events.md#ev-broadcast) |
| [`broadcast_wait`](#broadcast-wait) | command | [Events](../blocks/events.md#ev-broadcastwait) |
| [`camera`](#camera) | command | [Game](../blocks/game.md#ga-camera) |
| [`camera_follow`](#camera-follow) | command | [Game](../blocks/game.md#ga-follow) |
| [`camera_x`](#camera-x) | reporter → number/text | [Game](../blocks/game.md#ga-camx) |
| [`camera_y`](#camera-y) | reporter → number/text | [Game](../blocks/game.md#ga-camy) |
| [`change`](#change) | command | [Variables](../blocks/variables.md#va-change) |
| [`change_camera`](#change-camera) | command | [Game](../blocks/game.md#ga-chcamera) |
| [`change_effect`](#change-effect) | command | [Looks](../blocks/looks.md#lo-cheffect) |
| [`change_pen_size`](#change-pen-size) | command | [Pen](../blocks/pen.md#pe-chsize) |
| [`change_size`](#change-size) | command | [Looks](../blocks/looks.md#lo-chsize) |
| [`change_velocity`](#change-velocity) | command | [Game](../blocks/game.md#ga-chvel) |
| [`change_volume`](#change-volume) | command | [Sound](../blocks/sound.md#so-chvol) |
| [`change_x`](#change-x) | command | [Motion](../blocks/motion.md#mo-chx) |
| [`change_y`](#change-y) | command | [Motion](../blocks/motion.md#mo-chy) |
| [`clear_console`](#clear-console) | command | [Console & UI](../blocks/program.md#pr-clear) |
| [`clear_effects`](#clear-effects) | command | [Looks](../blocks/looks.md#lo-cleareffects) |
| [`clone`](#clone) | command | [Control](../blocks/control.md#ct-clone) |
| [`contains`](#contains) | reporter → true/false | [Operators](../blocks/operators.md#op-contains) |
| [`costume`](#costume) | command | [Looks](../blocks/looks.md#lo-costume) |
| [`costume_of`](#costume-of) | reporter → number/text | [Looks](../blocks/looks.md#lo-costumeof) |
| [`current`](#current) | reporter → number/text | [Sensing](../blocks/sensing.md#se-current) |
| [`days_since_2000`](#days-since-2000) | reporter → number/text | [Sensing](../blocks/sensing.md#se-days) |
| [`delete_clone`](#delete-clone) | command | [Control](../blocks/control.md#ct-delclone) |
| [`direction`](#direction) | reporter → number/text | [Motion](../blocks/motion.md#mo-dir) |
| [`distance_to`](#distance-to) | reporter → number/text | [Sensing](../blocks/sensing.md#se-distance) |
| [`draw_circle`](#draw-circle) | command | [Game](../blocks/game.md#ga-circle) |
| [`draw_line`](#draw-line) | command | [Game](../blocks/game.md#ga-line) |
| [`draw_rect`](#draw-rect) | command | [Game](../blocks/game.md#ga-rect) |
| [`draw_text`](#draw-text) | command | [Game](../blocks/game.md#ga-text) |
| [`every`](#every) | event | [Game](../blocks/game.md#ev-every) |
| [`for_each`](#for-each) | command | [Control](../blocks/control.md#ct-for) |
| [`forever`](#forever) | command | [Control](../blocks/control.md#ct-forever) |
| [`from_json`](#from-json) | command | [Data](../blocks/data.md#dt-fromjson) |
| [`glide_to`](#glide-to) | command | [Motion](../blocks/motion.md#mo-glideto) |
| [`glide_xy`](#glide-xy) | command | [Motion](../blocks/motion.md#mo-glide) |
| [`go_room`](#go-room) | command | [Game](../blocks/game.md#ga-room) |
| [`go_to`](#go-to) | command | [Motion](../blocks/motion.md#mo-goto) |
| [`go_xy`](#go-xy) | command | [Motion](../blocks/motion.md#mo-gotoxy) |
| [`hide`](#hide) | command | [Looks](../blocks/looks.md#lo-hide) |
| [`hide_list`](#hide-list) | command | [Lists](../blocks/lists.md#li-hide) |
| [`hide_var`](#hide-var) | command | [Variables](../blocks/variables.md#va-hide) |
| [`if`](#if) | command | [Control](../blocks/control.md#ct-if) |
| [`if`](#if) | command | [Control](../blocks/control.md#ct-ifelse) |
| [`index_of`](#index-of) | reporter → number/text | [Data](../blocks/data.md#dt-index) |
| [`instrument`](#instrument) | command | [Sound](../blocks/sound.md#so-inst) |
| [`join`](#join) | reporter → number/text | [Operators](../blocks/operators.md#op-join) |
| [`join_list`](#join-list) | reporter → number/text | [Data](../blocks/data.md#dt-joinlist) |
| [`key_pressed`](#key-pressed) | reporter → true/false | [Sensing](../blocks/sensing.md#se-key) |
| [`layer`](#layer) | command | [Looks](../blocks/looks.md#lo-front) |
| [`length_of`](#length-of) | reporter → number/text | [Operators](../blocks/operators.md#op-length) |
| [`letter_of`](#letter-of) | reporter → number/text | [Operators](../blocks/operators.md#op-letter) |
| [`list_add`](#list-add) | command | [Lists](../blocks/lists.md#li-add) |
| [`list_clear`](#list-clear) | command | [Lists](../blocks/lists.md#li-clear) |
| [`list_contains`](#list-contains) | reporter → true/false | [Lists](../blocks/lists.md#li-contains) |
| [`list_delete`](#list-delete) | command | [Lists](../blocks/lists.md#li-delete) |
| [`list_index`](#list-index) | reporter → number/text | [Lists](../blocks/lists.md#li-index) |
| [`list_insert`](#list-insert) | command | [Lists](../blocks/lists.md#li-insert) |
| [`list_item`](#list-item) | reporter → number/text | [Lists](../blocks/lists.md#li-item) |
| [`list_length`](#list-length) | reporter → number/text | [Lists](../blocks/lists.md#li-length) |
| [`list_replace`](#list-replace) | command | [Lists](../blocks/lists.md#li-replace) |
| [`lower`](#lower) | reporter → number/text | [Data](../blocks/data.md#dt-lower) |
| [`map_delete`](#map-delete) | command | [Data](../blocks/data.md#dt-mapdel) |
| [`map_get`](#map-get) | reporter → number/text | [Data](../blocks/data.md#dt-mapget) |
| [`map_has`](#map-has) | reporter → true/false | [Data](../blocks/data.md#dt-maphas) |
| [`map_keys`](#map-keys) | command | [Data](../blocks/data.md#dt-mapkeys) |
| [`map_set`](#map-set) | command | [Data](../blocks/data.md#dt-mapset) |
| [`map_size`](#map-size) | reporter → number/text | [Data](../blocks/data.md#dt-mapsize) |
| [`math`](#math) | reporter → number/text | [Operators](../blocks/operators.md#op-math) |
| [`mouse_down`](#mouse-down) | reporter → true/false | [Sensing](../blocks/sensing.md#se-mousedown) |
| [`mouse_x`](#mouse-x) | reporter → number/text | [Sensing](../blocks/sensing.md#se-mousex) |
| [`mouse_y`](#mouse-y) | reporter → number/text | [Sensing](../blocks/sensing.md#se-mousey) |
| [`move`](#move) | command | [Motion](../blocks/motion.md#mo-move) |
| [`move_layers`](#move-layers) | command | [Looks](../blocks/looks.md#lo-layers) |
| [`new_map`](#new-map) | command | [Data](../blocks/data.md#dt-newmap) |
| [`next_backdrop`](#next-backdrop) | command | [Looks](../blocks/looks.md#lo-nextbackdrop) |
| [`next_costume`](#next-costume) | command | [Looks](../blocks/looks.md#lo-nextcostume) |
| [`note`](#note) | command | [Sound](../blocks/sound.md#so-note) |
| [`on_backdrop`](#on-backdrop) | event | [Events](../blocks/events.md#ev-backdrop) |
| [`on_click`](#on-click) | event | [Events](../blocks/events.md#ev-click) |
| [`on_clone`](#on-clone) | event | [Control](../blocks/control.md#ct-cloned) |
| [`on_draw`](#on-draw) | event | [Game](../blocks/game.md#ga-draw) |
| [`on_ignite`](#on-ignite) | event | [Events](../blocks/events.md#ev-ignite) |
| [`on_key`](#on-key) | event | [Events](../blocks/events.md#ev-key) |
| [`on_message`](#on-message) | event | [Events](../blocks/events.md#ev-receive) |
| [`on_stage_click`](#on-stage-click) | event | [Events](../blocks/events.md#ev-stageclick) |
| [`on_timer`](#on-timer) | event | [Events](../blocks/events.md#ev-timer) |
| [`on_widget_change`](#on-widget-change) | event | [Console & UI](../blocks/program.md#ui-changed) |
| [`on_widget_click`](#on-widget-click) | event | [Console & UI](../blocks/program.md#ui-clicked) |
| [`pen_clear`](#pen-clear) | command | [Pen](../blocks/pen.md#pe-clear) |
| [`pen_color`](#pen-color) | command | [Pen](../blocks/pen.md#pe-color) |
| [`pen_down`](#pen-down) | command | [Pen](../blocks/pen.md#pe-down) |
| [`pen_hue`](#pen-hue) | command | [Pen](../blocks/pen.md#pe-chhue) |
| [`pen_size`](#pen-size) | command | [Pen](../blocks/pen.md#pe-size) |
| [`pen_up`](#pen-up) | command | [Pen](../blocks/pen.md#pe-up) |
| [`physics`](#physics) | command | [Game](../blocks/game.md#ga-physics) |
| [`play_sound`](#play-sound) | command | [Sound](../blocks/sound.md#so-play) |
| [`play_sound_wait`](#play-sound-wait) | command | [Sound](../blocks/sound.md#so-playwait) |
| [`point`](#point) | command | [Motion](../blocks/motion.md#mo-point) |
| [`point_towards`](#point-towards) | command | [Motion](../blocks/motion.md#mo-towards) |
| [`print`](#print) | command | [Console & UI](../blocks/program.md#pr-print) |
| [`prop_of`](#prop-of) | reporter → number/text | [Sensing](../blocks/sensing.md#se-of) |
| [`random`](#random) | reporter → number/text | [Operators](../blocks/operators.md#op-random) |
| [`repeat`](#repeat) | command | [Control](../blocks/control.md#ct-repeat) |
| [`repeat_until`](#repeat-until) | command | [Control](../blocks/control.md#ct-until) |
| [`replace`](#replace) | reporter → number/text | [Data](../blocks/data.md#dt-replace) |
| [`reset_timer`](#reset-timer) | command | [Sensing](../blocks/sensing.md#se-resettimer) |
| [`room_name`](#room-name) | reporter → number/text | [Game](../blocks/game.md#ga-roomname) |
| [`rotation_style`](#rotation-style) | command | [Motion](../blocks/motion.md#mo-rotstyle) |
| [`round`](#round) | reporter → number/text | [Operators](../blocks/operators.md#op-round) |
| [`say`](#say) | command | [Looks](../blocks/looks.md#lo-say) |
| [`say_for`](#say-for) | command | [Looks](../blocks/looks.md#lo-sayfor) |
| [`set`](#set) | command | [Variables](../blocks/variables.md#va-set) |
| [`set_effect`](#set-effect) | command | [Looks](../blocks/looks.md#lo-seteffect) |
| [`set_friction`](#set-friction) | command | [Game](../blocks/game.md#ga-friction) |
| [`set_gravity`](#set-gravity) | command | [Game](../blocks/game.md#ga-gravity) |
| [`set_size`](#set-size) | command | [Looks](../blocks/looks.md#lo-setsize) |
| [`set_speed`](#set-speed) | command | [Game](../blocks/game.md#ga-speed) |
| [`set_tempo`](#set-tempo) | command | [Sound](../blocks/sound.md#so-tempo) |
| [`set_velocity`](#set-velocity) | command | [Game](../blocks/game.md#ga-setvel) |
| [`set_volume`](#set-volume) | command | [Sound](../blocks/sound.md#so-setvol) |
| [`set_x`](#set-x) | command | [Motion](../blocks/motion.md#mo-setx) |
| [`set_y`](#set-y) | command | [Motion](../blocks/motion.md#mo-sety) |
| [`show`](#show) | command | [Looks](../blocks/looks.md#lo-show) |
| [`show_list`](#show-list) | command | [Lists](../blocks/lists.md#li-show) |
| [`show_var`](#show-var) | command | [Variables](../blocks/variables.md#va-show) |
| [`size`](#size) | reporter → number/text | [Looks](../blocks/looks.md#lo-size) |
| [`split`](#split) | command | [Data](../blocks/data.md#dt-split) |
| [`stamp`](#stamp) | command | [Pen](../blocks/pen.md#pe-stamp) |
| [`stop`](#stop) | command | [Control](../blocks/control.md#ct-stop) |
| [`stop_sounds`](#stop-sounds) | command | [Sound](../blocks/sound.md#so-stop) |
| [`store_get`](#store-get) | reporter → number/text | [Console & UI](../blocks/program.md#st-get) |
| [`store_set`](#store-set) | command | [Console & UI](../blocks/program.md#st-set) |
| [`substring`](#substring) | reporter → number/text | [Data](../blocks/data.md#dt-sub) |
| [`think`](#think) | command | [Looks](../blocks/looks.md#lo-think) |
| [`think_for`](#think-for) | command | [Looks](../blocks/looks.md#lo-thinkfor) |
| [`timer`](#timer) | reporter → number/text | [Sensing](../blocks/sensing.md#se-timer) |
| [`to_json`](#to-json) | reporter → number/text | [Data](../blocks/data.md#dt-tojson) |
| [`tone`](#tone) | command | [Sound](../blocks/sound.md#so-tone) |
| [`touching`](#touching) | reporter → true/false | [Sensing](../blocks/sensing.md#se-touching) |
| [`touching_color`](#touching-color) | reporter → true/false | [Sensing](../blocks/sensing.md#se-touchcolor) |
| [`trim`](#trim) | reporter → number/text | [Data](../blocks/data.md#dt-trim) |
| [`turn_left`](#turn-left) | command | [Motion](../blocks/motion.md#mo-turnl) |
| [`turn_right`](#turn-right) | command | [Motion](../blocks/motion.md#mo-turnr) |
| [`type_of`](#type-of) | reporter → number/text | [Data](../blocks/data.md#dt-typeof) |
| [`ui_button`](#ui-button) | command | [Console & UI](../blocks/program.md#ui-button) |
| [`ui_clear`](#ui-clear) | command | [Console & UI](../blocks/program.md#ui-clear) |
| [`ui_label`](#ui-label) | command | [Console & UI](../blocks/program.md#ui-label) |
| [`ui_remove`](#ui-remove) | command | [Console & UI](../blocks/program.md#ui-remove) |
| [`ui_set_text`](#ui-set-text) | command | [Console & UI](../blocks/program.md#ui-settext) |
| [`ui_slider`](#ui-slider) | command | [Console & UI](../blocks/program.md#ui-slider) |
| [`ui_textbox`](#ui-textbox) | command | [Console & UI](../blocks/program.md#ui-textbox) |
| [`ui_value`](#ui-value) | reporter → number/text | [Console & UI](../blocks/program.md#ui-value) |
| [`upper`](#upper) | reporter → number/text | [Data](../blocks/data.md#dt-upper) |
| [`velocity_x`](#velocity-x) | reporter → number/text | [Game](../blocks/game.md#ga-vx) |
| [`velocity_y`](#velocity-y) | reporter → number/text | [Game](../blocks/game.md#ga-vy) |
| [`volume`](#volume) | reporter → number/text | [Sound](../blocks/sound.md#so-vol) |
| [`wait`](#wait) | command | [Control](../blocks/control.md#ct-wait) |
| [`wait_until`](#wait-until) | command | [Control](../blocks/control.md#ct-waituntil) |
| [`while`](#while) | command | [Control](../blocks/control.md#ct-while) |
| [`x_pos`](#x-pos) | reporter → number/text | [Motion](../blocks/motion.md#mo-x) |
| [`y_pos`](#y-pos) | reporter → number/text | [Motion](../blocks/motion.md#mo-y) |

<a id="answer"></a>
### answer

`answer`

- **Kind:** reporter → number/text

The text typed for the most recent `ask`. It is shared by the whole project.

```kindlr
on_ignite {
  ask("Favourite colour?")
  print(answer)
}
```

<a id="ask"></a>
### ask

`ask(text)`

- **Kind:** command

Asks a question and waits until the user types an answer and presses Enter. A visible sprite shows the question in a speech bubble; otherwise it is shown in the input box. Only one question is open at a time.

```kindlr
on_ignite {
  ask("What is your name?")
  say(join("Hi, ", answer))
}
```

<a id="backdrop"></a>
### backdrop

`backdrop(backdrop)`

- **Kind:** command
- **Menu values:** `backdrop`: a backdrop name or number

Switches the Stage backdrop by name or number. Also accepts `"next backdrop"`, `"previous backdrop"` and `"random backdrop"`. Starts matching `on_backdrop` scripts.

```kindlr
on_ignite {
  backdrop("night sky")
}
```

<a id="backdrop-of"></a>
### backdrop_of

`backdrop_of(numName)`

- **Kind:** reporter → number/text
- **Menu values:** `numName`: `"number"`, `"name"`

The current backdrop's number or name.

```kindlr
on_ignite {
  say(backdrop_of("number"))
}
```

<a id="bounce"></a>
### bounce

`bounce`

- **Kind:** command · sprite only

If the sprite touches the stage edge, it turns around so it moves away from the edge, and is pushed back inside.

```kindlr
on_ignite {
  forever {
    move(5)
    bounce
  }
}
```

<a id="broadcast"></a>
### broadcast

`broadcast(message)`

- **Kind:** command
- **Menu values:** `message`: any message name

Sends a message to every sprite and the Stage. Scripts that start with `on_message` with the same name start running. The sender does not wait.

```kindlr
on_ignite {
  broadcast("start")
}
```

<a id="broadcast-wait"></a>
### broadcast_wait

`broadcast_wait(message)`

- **Kind:** command
- **Menu values:** `message`: any message name

Like `broadcast`, but waits until every script that received the message has finished.

```kindlr
on_ignite {
  broadcast_wait("setup")
  say("Setup done")
}
```

<a id="camera"></a>
### camera

`camera(number, number)`

- **Kind:** command

Moves the camera. The camera shifts what you see: sprites, pen drawings, shapes and bubbles (not the backdrop or widgets).

```kindlr
on_ignite {
  camera(100, 0)
}
```

<a id="camera-follow"></a>
### camera_follow

`camera_follow`

- **Kind:** command · sprite only

Centres the camera on this sprite.

```kindlr
on_ignite {
  forever {
    camera_follow
  }
}
```

<a id="camera-x"></a>
### camera_x

`camera_x`

- **Kind:** reporter → number/text

The camera's x position.

```kindlr
on_ignite {
  print(camera_x)
}
```

<a id="camera-y"></a>
### camera_y

`camera_y`

- **Kind:** reporter → number/text

The camera's y position.

```kindlr
on_ignite {
  print(camera_y)
}
```

<a id="change"></a>
### change

`change(@variable, number)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Adds a number to a variable (use a negative number to subtract).

```kindlr
on_ignite {
  change(@score, 1)
}
```

<a id="change-camera"></a>
### change_camera

`change_camera(number, number)`

- **Kind:** command

Moves the camera by an amount.

```kindlr
on_ignite {
  change_camera(5, 0)
}
```

<a id="change-effect"></a>
### change_effect

`change_effect(effect, number)`

- **Kind:** command
- **Menu values:** `effect`: `"color"`, `"ghost"`, `"brightness"`, `"saturation"`

Changes a graphic effect: `"color"` (hue shift, 200 = full circle), `"ghost"` (0 = solid, 100 = invisible), `"brightness"`, `"saturation"` (-100…).

```kindlr
on_ignite {
  change_effect("color", 25)
}
```

<a id="change-pen-size"></a>
### change_pen_size

`change_pen_size(number)`

- **Kind:** command · sprite only

Changes the pen thickness (stays within 1–200).

```kindlr
on_ignite {
  change_pen_size(1)
}
```

<a id="change-size"></a>
### change_size

`change_size(number)`

- **Kind:** command · sprite only

Changes the size by the number (percent points). Size stays between 5 % and 500 %.

```kindlr
on_ignite {
  change_size(10)
}
```

<a id="change-velocity"></a>
### change_velocity

`change_velocity(number, number)`

- **Kind:** command · sprite only

Adds to the sprite's velocity. Great for jumps.

```kindlr
on_ignite {
  change_velocity(0, 8)
}
```

<a id="change-volume"></a>
### change_volume

`change_volume(number)`

- **Kind:** command

Changes this sprite's volume (0–100).

```kindlr
on_ignite {
  change_volume(-10)
}
```

<a id="change-x"></a>
### change_x

`change_x(number)`

- **Kind:** command · sprite only

Moves the sprite left or right by the number.

```kindlr
on_ignite {
  change_x(10)
}
```

<a id="change-y"></a>
### change_y

`change_y(number)`

- **Kind:** command · sprite only

Moves the sprite up or down by the number.

```kindlr
on_ignite {
  change_y(10)
}
```

<a id="clear-console"></a>
### clear_console

`clear_console`

- **Kind:** command

Empties the console.

```kindlr
on_ignite {
  clear_console
}
```

<a id="clear-effects"></a>
### clear_effects

`clear_effects`

- **Kind:** command

Removes all graphic effects.

```kindlr
on_ignite {
  clear_effects
}
```

<a id="clone"></a>
### clone

`clone(cloneOf)`

- **Kind:** command
- **Menu values:** `cloneOf`: `"_myself_"` or a sprite name

Creates a copy (clone) of this sprite (`"_myself_"`) or of another sprite. At most 300 clones can exist at once; extra requests are ignored.

```kindlr
on_ignite {
  repeat(5) {
    clone("_myself_")
  }
}
```

<a id="contains"></a>
### contains

`contains(text, text)`

- **Kind:** reporter → true/false

True if the first text contains the second (upper/lower case ignored).

```kindlr
on_ignite {
  if contains(answer, "yes") {
    say("OK")
  }
}
```

<a id="costume"></a>
### costume

`costume(costume)`

- **Kind:** command · sprite only
- **Menu values:** `costume`: a costume name or number

Switches to a costume by name or by number (1 = first). `"next costume"` and `"previous costume"` also work.

```kindlr
on_ignite {
  costume(2)
}
```

<a id="costume-of"></a>
### costume_of

`costume_of(numName)`

- **Kind:** reporter → number/text · sprite only
- **Menu values:** `numName`: `"number"`, `"name"`

The current costume's number (`"number"`) or name (`"name"`).

```kindlr
on_ignite {
  say(costume_of("name"))
}
```

<a id="current"></a>
### current

`current(current)`

- **Kind:** reporter → number/text
- **Menu values:** `current`: `"year"`, `"month"`, `"date"`, `"day of week"`, `"hour"`, `"minute"`, `"second"`

Part of the current local date/time: year, month, date, day of week (1 = Sunday), hour, minute, second.

```kindlr
on_ignite {
  say(join("Year ", current("year")))
}
```

<a id="days-since-2000"></a>
### days_since_2000

`days_since_2000`

- **Kind:** reporter → number/text

Days (with fractions) since 1 January 2000 (UTC).

```kindlr
on_ignite {
  print(round(days_since_2000))
}
```

<a id="delete-clone"></a>
### delete_clone

`delete_clone`

- **Kind:** command · sprite only

Removes this clone and stops its scripts. Does nothing in the original sprite.

```kindlr
on_clone {
  wait(2)
  delete_clone
}
```

<a id="direction"></a>
### direction

`direction`

- **Kind:** reporter → number/text · sprite only

The direction the sprite points (-179…180).

```kindlr
on_ignite {
  say(direction)
}
```

<a id="distance-to"></a>
### distance_to

`distance_to(towards)`

- **Kind:** reporter → number/text · sprite only
- **Menu values:** `towards`: `"_mouse_"` or a sprite name

Distance in steps to the mouse pointer or a sprite. Returns 10000 if the sprite does not exist.

```kindlr
on_ignite {
  say(round(distance_to("_mouse_")))
}
```

<a id="draw-circle"></a>
### draw_circle

`draw_circle(number, number, number, colour)`

- **Kind:** command

Draws a filled circle for this frame. x and y are the centre.

```kindlr
on_draw {
  draw_circle(0, 0, 30, "#FF5D73")
}
```

<a id="draw-line"></a>
### draw_line

`draw_line(number, number, number, number, colour)`

- **Kind:** command

Draws a line (2 px wide) from one point to another for this frame.

```kindlr
on_draw {
  draw_line(-100, 0, 100, 0, "#FFD23F")
}
```

<a id="draw-rect"></a>
### draw_rect

`draw_rect(number, number, number, number, colour)`

- **Kind:** command

Draws a filled rectangle for this frame. x and y are the bottom-left corner.

```kindlr
on_draw {
  draw_rect(-240, -180, 480, 20, "#5BAF4E")
}
```

<a id="draw-text"></a>
### draw_text

`draw_text(text, number, number, colour)`

- **Kind:** command

Draws text for this frame. x and y are the left end of the text's baseline. At most 500 characters.

```kindlr
on_draw {
  draw_text(join("Score ", @score), -230, 160, "#ffffff")
}
```

<a id="every"></a>
### every

`every(number)` { … }

- **Kind:** event

Runs again and again, every so many seconds (at least 0.02 s), while the project runs. If the previous run is still going, that tick is skipped. Clones do not get this event.

```kindlr
every(1) {
  change(@seconds, 1)
}
```

<a id="for-each"></a>
### for_each

`for_each(@variable, number)` { … }

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Counts a variable from 1 up to the number, running the blocks inside once for each value.

```kindlr
on_ignite {
  for_each(@i, 5) {
    print(@i)
  }
}
```

<a id="forever"></a>
### forever

`forever` { … }

- **Kind:** command

Runs the blocks inside again and again until the project stops. Nothing can come after it.

```kindlr
on_ignite {
  forever {
    turn_right(3)
  }
}
```

<a id="from-json"></a>
### from_json

`from_json(@variable, text)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Reads JSON text into a variable. A JSON object becomes a map; nested objects and arrays inside it are kept as JSON text. A JSON array becomes a map with keys "0", "1", … Invalid JSON stops the script with the error "Invalid JSON".

```kindlr
on_ignite {
  from_json(@player, "{\"hp\": 3}")
  print(map_get("hp", @player))
}
```

<a id="glide-to"></a>
### glide_to

`glide_to(number, goto)`

- **Kind:** command · sprite only
- **Menu values:** `goto`: `"_random_"`, `"_mouse_"`, or a sprite name

Slides smoothly to a random spot, the mouse or a sprite over the given seconds. The script waits until the glide is done.

```kindlr
on_ignite {
  glide_to(1, "_mouse_")
}
```

<a id="glide-xy"></a>
### glide_xy

`glide_xy(number, number, number)`

- **Kind:** command · sprite only

Slides smoothly to a point over the given seconds. The script waits until the glide is done.

```kindlr
on_ignite {
  glide_xy(2, 100, 50)
}
```

<a id="go-room"></a>
### go_room

`go_room(backdrop)`

- **Kind:** command
- **Menu values:** `backdrop`: a backdrop name or number

Goes to a "room". Rooms are backdrops, so this works like `backdrop` and starts `on_backdrop` scripts.

```kindlr
on_ignite {
  go_room("level 2")
}
```

<a id="go-to"></a>
### go_to

`go_to(goto)`

- **Kind:** command · sprite only
- **Menu values:** `goto`: `"_random_"`, `"_mouse_"`, or a sprite name

Jumps to a random spot (`"_random_"`), the mouse pointer (`"_mouse_"`) or another sprite (its name).

```kindlr
on_ignite {
  go_to("_random_")
}
```

<a id="go-xy"></a>
### go_xy

`go_xy(number, number)`

- **Kind:** command · sprite only

Jumps to a point. The stage centre is (0, 0); x goes from -240 (left) to 240 (right), y from -180 (bottom) to 180 (top).

```kindlr
on_ignite {
  go_xy(0, 0)
}
```

<a id="hide"></a>
### hide

`hide`

- **Kind:** command · sprite only

Hides the sprite. Hidden sprites are never "touching" anything.

```kindlr
on_ignite {
  hide
}
```

<a id="hide-list"></a>
### hide_list

`hide_list(@@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Hides the list's monitor.

```kindlr
on_ignite {
  hide_list(@@basket)
}
```

<a id="hide-var"></a>
### hide_var

`hide_var(@variable)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Hides the variable's monitor box.

```kindlr
on_ignite {
  hide_var(@score)
}
```

<a id="if"></a>
### if

`if(condition)` { … }

- **Kind:** command

Runs the blocks inside only if the condition is true.

```kindlr
on_ignite {
  if touching("_edge_") {
    say("Edge!")
  }
}
```

<a id="if"></a>
### if

`if(condition)`

- **Kind:** command

Runs the first part if the condition is true, otherwise the `else` part. In Kindlr Script you can chain `else if`.

```kindlr
on_ignite {
  if x_pos > 0 {
    say("Right side")
  } else {
    say("Left side")
  }
}
```

<a id="index-of"></a>
### index_of

`index_of(text, text)`

- **Kind:** reporter → number/text

Where the first text appears inside the second (1 = start), or 0 if not found. Upper/lower case ignored.

```kindlr
on_ignite {
  print(index_of("c", "abc"))
}
```

<a id="instrument"></a>
### instrument

`instrument(wave)`

- **Kind:** command
- **Menu values:** `wave`: `"sine"`, `"square"`, `"sawtooth"`, `"triangle"`

Sets the waveform used by `note` and `tone` for this sprite: sine, square, sawtooth, triangle.

```kindlr
on_ignite {
  instrument("sine")
}
```

<a id="join"></a>
### join

`join(text, text)`

- **Kind:** reporter → number/text

Joins two pieces of text together.

```kindlr
on_ignite {
  say(join("Score: ", @score))
}
```

<a id="join-list"></a>
### join_list

`join_list(@@list, text)`

- **Kind:** reporter → number/text
- **Menu values:** `list`: a list, written `@@name`

All items of a list joined into one text with a separator between them.

```kindlr
on_ignite {
  print(join_list(@@parts, " + "))
}
```

<a id="key-pressed"></a>
### key_pressed

`key_pressed(key)`

- **Kind:** reporter → true/false
- **Menu values:** `key`: `"space"`, `"up arrow"`, `"down arrow"`, `"left arrow"`, `"right arrow"`, `"any"`, `"a"`, `"b"`, `"c"`, `"d"`, `"e"`, `"f"`, `"g"`, `"h"`, `"i"`, `"j"`, `"k"`, `"l"`, `"m"`, `"n"`, `"o"`, `"p"`, `"q"`, `"r"`, `"s"`, `"t"`, `"u"`, `"v"`, `"w"`, `"x"`, `"y"`, `"z"`, `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`

True while the key is held down. `"any"` is true if any key is down.

```kindlr
on_ignite {
  forever {
    if key_pressed("right arrow") {
      change_x(5)
    }
  }
}
```

<a id="layer"></a>
### layer

`layer(frontBack)`

- **Kind:** command · sprite only
- **Menu values:** `frontBack`: `"front"`, `"back"`

Moves the sprite in front of (`"front"`) or behind (`"back"`) all other sprites.

```kindlr
on_ignite {
  layer("front")
}
```

<a id="length-of"></a>
### length_of

`length_of(text)`

- **Kind:** reporter → number/text

How many characters the text has.

```kindlr
on_ignite {
  say(length_of("Sparky"))
}
```

<a id="letter-of"></a>
### letter_of

`letter_of(number, text)`

- **Kind:** reporter → number/text

The letter at a position (1 = first). Empty text if the position is outside the text.

```kindlr
on_ignite {
  say(letter_of(1, "Kindlr"))
}
```

<a id="list-add"></a>
### list_add

`list_add(text, @@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Adds an item to the end of a list. A list holds at most 200 000 items; more are ignored.

```kindlr
on_ignite {
  list_add("apple", @@basket)
}
```

<a id="list-clear"></a>
### list_clear

`list_clear(@@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Deletes every item from the list.

```kindlr
on_ignite {
  list_clear(@@basket)
}
```

<a id="list-contains"></a>
### list_contains

`list_contains(@@list, text)`

- **Kind:** reporter → true/false
- **Menu values:** `list`: a list, written `@@name`

True if the list has the item (upper/lower case ignored).

```kindlr
on_ignite {
  if list_contains(@@basket, "apple") {
    say("Yum")
  }
}
```

<a id="list-delete"></a>
### list_delete

`list_delete(number, @@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Deletes the item at a position. Also accepts `"last"` and `"all"`.

```kindlr
on_ignite {
  list_delete(1, @@basket)
}
```

<a id="list-index"></a>
### list_index

`list_index(text, @@list)`

- **Kind:** reporter → number/text
- **Menu values:** `list`: a list, written `@@name`

The position of the first matching item (upper/lower case ignored), or 0 if it is not in the list.

```kindlr
on_ignite {
  say(list_index("apple", @@basket))
}
```

<a id="list-insert"></a>
### list_insert

`list_insert(text, number, @@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Inserts an item at a position (1 = front). `"last"` adds to the end.

```kindlr
on_ignite {
  list_insert("pear", 1, @@basket)
}
```

<a id="list-item"></a>
### list_item

`list_item(number, @@list)`

- **Kind:** reporter → number/text
- **Menu values:** `list`: a list, written `@@name`

The item at a position. `"last"` and `"random"` work too. Empty text if there is no such item.

```kindlr
on_ignite {
  say(list_item(1, @@basket))
}
```

<a id="list-length"></a>
### list_length

`list_length(@@list)`

- **Kind:** reporter → number/text
- **Menu values:** `list`: a list, written `@@name`

How many items the list has.

```kindlr
on_ignite {
  say(list_length(@@basket))
}
```

<a id="list-replace"></a>
### list_replace

`list_replace(number, @@list, text)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Replaces the item at a position (or `"last"`).

```kindlr
on_ignite {
  list_replace(1, @@basket, "banana")
}
```

<a id="lower"></a>
### lower

`lower(text)`

- **Kind:** reporter → number/text

The text in lower case.

```kindlr
on_ignite {
  print(lower("HELLO"))
}
```

<a id="map-delete"></a>
### map_delete

`map_delete(text, @variable)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Removes a key from a map.

```kindlr
on_ignite {
  map_delete("name", @player)
}
```

<a id="map-get"></a>
### map_get

`map_get(text, @variable)`

- **Kind:** reporter → number/text
- **Menu values:** `var`: a variable, written `@name`

The value stored under a key, or empty text if the key is missing.

```kindlr
on_ignite {
  print(map_get("name", @player))
}
```

<a id="map-has"></a>
### map_has

`map_has(@variable, text)`

- **Kind:** reporter → true/false
- **Menu values:** `var`: a variable, written `@name`

True if the map has the key.

```kindlr
on_ignite {
  if map_has(@player, "name") {
    print("has a name")
  }
}
```

<a id="map-keys"></a>
### map_keys

`map_keys(@variable, @@list)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`; `list`: a list, written `@@name`

Puts all keys of a map into a list (replacing what was in it).

```kindlr
on_ignite {
  map_keys(@player, @@keys)
}
```

<a id="map-set"></a>
### map_set

`map_set(@variable, text, text)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Stores a value under a key in a map. If the variable is not a map yet, it becomes an empty map first. Up to 10 000 keys.

```kindlr
on_ignite {
  map_set(@player, "name", "Mika")
}
```

<a id="map-size"></a>
### map_size

`map_size(@variable)`

- **Kind:** reporter → number/text
- **Menu values:** `var`: a variable, written `@name`

How many keys the map has.

```kindlr
on_ignite {
  print(map_size(@player))
}
```

<a id="math"></a>
### math

`math(mathfn, number)`

- **Kind:** reporter → number/text
- **Menu values:** `mathfn`: `"abs"`, `"floor"`, `"ceiling"`, `"sqrt"`, `"sin"`, `"cos"`, `"tan"`, `"asin"`, `"acos"`, `"atan"`, `"ln"`, `"log"`, `"e ^"`, `"10 ^"`

A maths function: abs, floor, ceiling, sqrt, sin, cos, tan, asin, acos, atan (angles in degrees), ln (natural log), log (base 10), e ^, 10 ^. Results are rounded to 10 decimals. Impossible results (e.g. `sqrt` of -1) give `NaN`.

```kindlr
on_ignite {
  say(math("sqrt", 16))
}
```

<a id="mouse-down"></a>
### mouse_down

`mouse_down`

- **Kind:** reporter → true/false

True while the mouse button is pressed.

```kindlr
on_ignite {
  wait_until(mouse_down)
  say("Click!")
}
```

<a id="mouse-x"></a>
### mouse_x

`mouse_x`

- **Kind:** reporter → number/text

The mouse pointer's x position on the stage (rounded).

```kindlr
on_ignite {
  forever {
    set_x(mouse_x)
  }
}
```

<a id="mouse-y"></a>
### mouse_y

`mouse_y`

- **Kind:** reporter → number/text

The mouse pointer's y position on the stage (rounded).

```kindlr
on_ignite {
  say(mouse_y)
}
```

<a id="move"></a>
### move

`move(number)`

- **Kind:** command · sprite only

Moves the sprite forward in the direction it is pointing. Negative numbers move backwards.

```kindlr
on_ignite {
  move(10)
}
```

<a id="move-layers"></a>
### move_layers

`move_layers(fwdBack, number)`

- **Kind:** command · sprite only
- **Menu values:** `fwdBack`: `"forward"`, `"backward"`

Moves the sprite forward or backward by some layers.

```kindlr
on_ignite {
  move_layers("backward", 1)
}
```

<a id="new-map"></a>
### new_map

`new_map(@variable)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Makes the variable an empty map. A map stores values under text keys (like a small dictionary).

```kindlr
on_ignite {
  new_map(@player)
}
```

<a id="next-backdrop"></a>
### next_backdrop

`next_backdrop`

- **Kind:** command

Switches to the next backdrop.

```kindlr
on_ignite {
  next_backdrop
}
```

<a id="next-costume"></a>
### next_costume

`next_costume`

- **Kind:** command · sprite only

Switches to the next costume, going back to the first after the last one.

```kindlr
on_ignite {
  repeat(10) {
    next_costume
    wait(0.1)
  }
}
```

<a id="note"></a>
### note

`note(number, number)`

- **Kind:** command

Plays a note (MIDI number, 60 = middle C) for some beats at the current tempo, with the current instrument. Waits until the note ends.

```kindlr
on_ignite {
  note(60, 0.5)
  note(64, 0.5)
  note(67, 1)
}
```

<a id="on-backdrop"></a>
### on_backdrop

`on_backdrop(backdrop)` { … }

- **Kind:** event
- **Menu values:** `backdrop`: a backdrop name or number

Runs when the Stage switches to the backdrop with exactly this name (case-sensitive). Also fires for `go_room`.

```kindlr
on_backdrop("level 2") {
  say("Welcome to level 2!")
}
```

<a id="on-click"></a>
### on_click

`on_click` { … }

- **Kind:** event · sprite only

Runs when the user clicks this sprite on the stage (the top-most sprite under the pointer wins). Clicking again restarts the script.

```kindlr
on_click {
  say_for("Ouch!", 1)
}
```

<a id="on-clone"></a>
### on_clone

`on_clone` { … }

- **Kind:** event · sprite only

Runs in a new clone right after it is created. Clones share the original's scripts and costumes.

```kindlr
on_clone {
  go_to("_random_")
  show
}
```

<a id="on-draw"></a>
### on_draw

`on_draw` { … }

- **Kind:** event

Runs once every frame (about 60 times a second). Shapes drawn with `draw_*` are cleared at the start of each frame, so draw them here. This script runs at full speed (no screen refresh in between), like a `define!` block.

```kindlr
on_draw {
  draw_circle(mouse_x, mouse_y, 10, "#FFD23F")
}
```

<a id="on-ignite"></a>
### on_ignite

`on_ignite` { … }

- **Kind:** event

Starts this script when someone presses the 🔥 **Ignite** button. Ignite first stops everything, resets the timer, camera, physics and effects, then starts every `on_ignite` script in every sprite and the Stage.

```kindlr
on_ignite {
  say("Let's go!")
}
```

<a id="on-key"></a>
### on_key

`on_key(key)` { … }

- **Kind:** event
- **Menu values:** `key`: `"space"`, `"up arrow"`, `"down arrow"`, `"left arrow"`, `"right arrow"`, `"any"`, `"a"`, `"b"`, `"c"`, `"d"`, `"e"`, `"f"`, `"g"`, `"h"`, `"i"`, `"j"`, `"k"`, `"l"`, `"m"`, `"n"`, `"o"`, `"p"`, `"q"`, `"r"`, `"s"`, `"t"`, `"u"`, `"v"`, `"w"`, `"x"`, `"y"`, `"z"`, `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`

Runs when a key is pressed. `"any"` matches every key. If the script is still running from the last press, holding the key does not restart it.

```kindlr
on_key("space") {
  change_y(20)
  wait(0.2)
  change_y(-20)
}
```

<a id="on-message"></a>
### on_message

`on_message(message)` { … }

- **Kind:** event
- **Menu values:** `message`: any message name

Runs when this message is broadcast. Message names are matched without caring about upper/lower case. A new broadcast restarts a receiver that is still running.

```kindlr
on_message("game over") {
  say("Bye!")
}
```

<a id="on-stage-click"></a>
### on_stage_click

`on_stage_click` { … }

- **Kind:** event · Stage only

Runs on the Stage when the user clicks a part of the stage where no sprite is.

```kindlr
on_stage_click {
  next_backdrop
}
```

<a id="on-timer"></a>
### on_timer

`on_timer(number)` { … }

- **Kind:** event

Runs once when the project timer goes above the number. `reset_timer` arms it again. Clones do not get this event.

```kindlr
on_timer(10) {
  say("10 seconds passed!")
}
```

<a id="on-widget-change"></a>
### on_widget_change

`on_widget_change(text)` { … }

- **Kind:** event

Runs when a text box or slider with this name is changed. A text box reports a change when you press Enter or leave the box; a slider when you let go.

```kindlr
on_widget_change("speed") {
  print(ui_value("speed"))
}
```

<a id="on-widget-click"></a>
### on_widget_click

`on_widget_click(text)` { … }

- **Kind:** event

Runs when the button with this name is clicked.

```kindlr
on_widget_click("go") {
  print("Clicked!")
}
```

<a id="pen-clear"></a>
### pen_clear

`pen_clear`

- **Kind:** command

Erases everything drawn with the pen and with `stamp`.

```kindlr
on_ignite {
  pen_clear
}
```

<a id="pen-color"></a>
### pen_color

`pen_color(colour)`

- **Kind:** command · sprite only

Sets the pen colour, e.g. `"#FF5D73"`.

```kindlr
on_ignite {
  pen_color("#FF5D73")
}
```

<a id="pen-down"></a>
### pen_down

`pen_down`

- **Kind:** command · sprite only

Puts the pen down: from now on the sprite draws a line when it moves.

```kindlr
on_ignite {
  pen_down
  move(100)
}
```

<a id="pen-hue"></a>
### pen_hue

`pen_hue(number)`

- **Kind:** command · sprite only

Shifts the pen colour around the colour wheel (200 = a full circle).

```kindlr
on_ignite {
  pen_hue(10)
}
```

<a id="pen-size"></a>
### pen_size

`pen_size(number)`

- **Kind:** command · sprite only

Sets the pen thickness (1–200).

```kindlr
on_ignite {
  pen_size(5)
}
```

<a id="pen-up"></a>
### pen_up

`pen_up`

- **Kind:** command · sprite only

Lifts the pen so moving no longer draws.

```kindlr
on_ignite {
  pen_up
}
```

<a id="physics"></a>
### physics

`physics(onoff)`

- **Kind:** command · sprite only
- **Menu values:** `onoff`: `"on"`, `"off"`

Turns simple physics on or off for this sprite. When on, each frame: velocity y goes down by gravity, both velocities shrink by friction, and the sprite moves by its velocity. There is no automatic collision.

```kindlr
on_ignite {
  physics("on")
}
```

<a id="play-sound"></a>
### play_sound

`play_sound(sound)`

- **Kind:** command
- **Menu values:** `sound`: `"pop"`, `"beep"`, `"coin"`, `"laser"`, `"boom"`, `"chirp"`, `"jump"`, `"win"`

Starts a built-in sound and continues right away.

```kindlr
on_ignite {
  play_sound("coin")
}
```

<a id="play-sound-wait"></a>
### play_sound_wait

`play_sound_wait(sound)`

- **Kind:** command
- **Menu values:** `sound`: `"pop"`, `"beep"`, `"coin"`, `"laser"`, `"boom"`, `"chirp"`, `"jump"`, `"win"`

Plays a built-in sound and waits until it ends. Sounds: pop, beep, coin, laser, boom, chirp, jump, win.

```kindlr
on_ignite {
  play_sound_wait("win")
}
```

<a id="point"></a>
### point

`point(number)`

- **Kind:** command · sprite only

Points the sprite in a direction: 90 = right, -90 = left, 0 = up, 180 = down. Directions are kept between -179 and 180.

```kindlr
on_ignite {
  point(90)
}
```

<a id="point-towards"></a>
### point_towards

`point_towards(towards)`

- **Kind:** command · sprite only
- **Menu values:** `towards`: `"_mouse_"` or a sprite name

Turns the sprite to face the mouse pointer (`"_mouse_"`) or another sprite.

```kindlr
on_ignite {
  point_towards("_mouse_")
}
```

<a id="print"></a>
### print

`print(text)`

- **Kind:** command

Writes a line of text to the console under the stage. The console keeps the last 500 lines; each line shows at most 2000 characters.

```kindlr
on_ignite {
  print("Hello, world!")
}
```

<a id="prop-of"></a>
### prop_of

`prop_of(prop, object)`

- **Kind:** reporter → number/text
- **Menu values:** `prop`: `"x position"`, `"y position"`, `"direction"`, `"costume #"`, `"costume name"`, `"size"`, `"volume"`, `"backdrop #"`, `"backdrop name"`; `object`: `"_stage_"` or a sprite name

Reads a property of another sprite or the Stage (`"_stage_"`): x position, y position, direction, costume #, costume name, size, volume (sprites); backdrop #, backdrop name, volume (Stage). Any other name reads that target's own variable. Returns 0 if the sprite does not exist.

```kindlr
on_ignite {
  say(prop_of("x position", "Sparky"))
}
```

<a id="random"></a>
### random

`random(number, number)`

- **Kind:** reporter → number/text

A random number between the two values (both included). If both are whole numbers without a decimal point you get a whole number; otherwise a decimal number.

```kindlr
on_ignite {
  say(random(1, 6))
}
```

<a id="repeat"></a>
### repeat

`repeat(number)` { … }

- **Kind:** command

Runs the blocks inside a number of times (the number is rounded).

```kindlr
on_ignite {
  repeat(4) {
    move(50)
    turn_right(90)
  }
}
```

<a id="repeat-until"></a>
### repeat_until

`repeat_until(condition)` { … }

- **Kind:** command

Repeats the blocks inside until the condition becomes true. The condition is checked before each round.

```kindlr
on_ignite {
  repeat_until(touching("_edge_")) {
    move(5)
  }
}
```

<a id="replace"></a>
### replace

`replace(text, text, text)`

- **Kind:** reporter → number/text

Replaces every copy of the first text with the second, inside the third. Upper/lower case matters here.

```kindlr
on_ignite {
  print(replace("a", "o", "banana"))
}
```

<a id="reset-timer"></a>
### reset_timer

`reset_timer`

- **Kind:** command

Sets the timer back to 0.

```kindlr
on_ignite {
  reset_timer
}
```

<a id="room-name"></a>
### room_name

`room_name`

- **Kind:** reporter → number/text

The name of the current room (backdrop).

```kindlr
on_ignite {
  say(room_name)
}
```

<a id="rotation-style"></a>
### rotation_style

`rotation_style(rotStyle)`

- **Kind:** command · sprite only
- **Menu values:** `rotStyle`: `"all around"`, `"left-right"`, `"don't rotate"`

How the costume turns with the direction: `"all around"` (rotates), `"left-right"` (only flips), `"don't rotate"`.

```kindlr
on_ignite {
  rotation_style("left-right")
}
```

<a id="round"></a>
### round

`round(number)`

- **Kind:** reporter → number/text

Rounds to the nearest whole number (.5 rounds up: 2.5 → 3, -2.5 → -2).

```kindlr
on_ignite {
  say(round(3.7))
}
```

<a id="say"></a>
### say

`say(text)`

- **Kind:** command · sprite only

Shows a speech bubble until something else replaces it. `say("")` removes the bubble.

```kindlr
on_ignite {
  say("Hello!")
}
```

<a id="say-for"></a>
### say_for

`say_for(text, number)`

- **Kind:** command · sprite only

Shows a speech bubble for some seconds, then removes it. The script waits.

```kindlr
on_ignite {
  say_for("Hello!", 2)
}
```

<a id="set"></a>
### set

`set(@variable, text)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Sets a variable to a value (number, text, true/false or a map).

```kindlr
on_ignite {
  set(@score, 0)
}
```

<a id="set-effect"></a>
### set_effect

`set_effect(effect, number)`

- **Kind:** command
- **Menu values:** `effect`: `"color"`, `"ghost"`, `"brightness"`, `"saturation"`

Sets a graphic effect to a value. See `change_effect` for the effects.

```kindlr
on_ignite {
  set_effect("ghost", 50)
}
```

<a id="set-friction"></a>
### set_friction

`set_friction(number)`

- **Kind:** command · sprite only

Sets friction from 0 (none) to 1 (stops at once). Each frame both velocities are multiplied by (1 - friction).

```kindlr
on_ignite {
  set_friction(0.02)
}
```

<a id="set-gravity"></a>
### set_gravity

`set_gravity(number)`

- **Kind:** command · sprite only

Sets this sprite's gravity: how much velocity y drops every frame.

```kindlr
on_ignite {
  set_gravity(0.5)
}
```

<a id="set-size"></a>
### set_size

`set_size(number)`

- **Kind:** command · sprite only

Sets the size in percent (100 = normal). Size stays between 5 % and 500 %.

```kindlr
on_ignite {
  set_size(50)
}
```

<a id="set-speed"></a>
### set_speed

`set_speed(number)`

- **Kind:** command · sprite only

Sets the velocity to a speed in the direction the sprite points.

```kindlr
on_ignite {
  point(45)
  set_speed(4)
}
```

<a id="set-tempo"></a>
### set_tempo

`set_tempo(number)`

- **Kind:** command

Sets the tempo for `note`, in beats per minute (20–500). The tempo is shared by the whole project.

```kindlr
on_ignite {
  set_tempo(120)
}
```

<a id="set-velocity"></a>
### set_velocity

`set_velocity(number, number)`

- **Kind:** command · sprite only

Sets the sprite's velocity (steps per frame).

```kindlr
on_ignite {
  set_velocity(3, 0)
}
```

<a id="set-volume"></a>
### set_volume

`set_volume(number)`

- **Kind:** command

Sets this sprite's volume in percent (0–100).

```kindlr
on_ignite {
  set_volume(50)
}
```

<a id="set-x"></a>
### set_x

`set_x(number)`

- **Kind:** command · sprite only

Sets the x position (left/right).

```kindlr
on_ignite {
  set_x(0)
}
```

<a id="set-y"></a>
### set_y

`set_y(number)`

- **Kind:** command · sprite only

Sets the y position (up/down).

```kindlr
on_ignite {
  set_y(0)
}
```

<a id="show"></a>
### show

`show`

- **Kind:** command · sprite only

Makes the sprite visible.

```kindlr
on_ignite {
  show
}
```

<a id="show-list"></a>
### show_list

`show_list(@@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Shows the list's monitor on the stage.

```kindlr
on_ignite {
  show_list(@@basket)
}
```

<a id="show-var"></a>
### show_var

`show_var(@variable)`

- **Kind:** command
- **Menu values:** `var`: a variable, written `@name`

Shows the variable's monitor box on the stage.

```kindlr
on_ignite {
  show_var(@score)
}
```

<a id="size"></a>
### size

`size`

- **Kind:** reporter → number/text · sprite only

The sprite's size in percent, rounded.

```kindlr
on_ignite {
  say(size)
}
```

<a id="split"></a>
### split

`split(text, text, @@list)`

- **Kind:** command
- **Menu values:** `list`: a list, written `@@name`

Splits text at every separator and puts the pieces into a list (replacing what was in it). An empty separator splits into single characters.

```kindlr
on_ignite {
  split("a,b,c", ",", @@parts)
  print(list_length(@@parts))
}
```

<a id="stamp"></a>
### stamp

`stamp`

- **Kind:** command · sprite only

Prints a picture of the sprite onto the pen layer.

```kindlr
on_ignite {
  repeat(6) {
    stamp
    move(40)
  }
}
```

<a id="stop"></a>
### stop

`stop(stopOpt)`

- **Kind:** command
- **Menu values:** `stopOpt`: `"all"`, `"this script"`, `"other scripts in sprite"`

`"all"` stops the whole project, `"this script"` ends this script, `"other scripts in sprite"` stops the sprite's other scripts and keeps going.

```kindlr
on_ignite {
  if @lives < 1 {
    stop("all")
  }
}
```

<a id="stop-sounds"></a>
### stop_sounds

`stop_sounds`

- **Kind:** command

Stops all sounds that are playing.

```kindlr
on_ignite {
  stop_sounds
}
```

<a id="store-get"></a>
### store_get

`store_get(text)`

- **Kind:** reporter → number/text

Reads a value from project storage. Empty text if the key does not exist.

```kindlr
on_ignite {
  say(store_get("best"))
}
```

<a id="store-set"></a>
### store_set

`store_set(text, text)`

- **Kind:** command

Saves a value under a key in the project's own storage. It is saved with the project, so it is still there next time. Up to 500 keys; keys are cut to 120 characters.

```kindlr
on_ignite {
  store_set("best", @score)
}
```

<a id="substring"></a>
### substring

`substring(number, number, text)`

- **Kind:** reporter → number/text

The letters from one position to another (both included, 1 = first).

```kindlr
on_ignite {
  print(substring(1, 3, "blocks"))
}
```

<a id="think"></a>
### think

`think(text)`

- **Kind:** command · sprite only

Shows a thought bubble until something replaces it.

```kindlr
on_ignite {
  think("Hmm...")
}
```

<a id="think-for"></a>
### think_for

`think_for(text, number)`

- **Kind:** command · sprite only

Shows a thought bubble for some seconds. The script waits.

```kindlr
on_ignite {
  think_for("Hmm...", 2)
}
```

<a id="timer"></a>
### timer

`timer`

- **Kind:** reporter → number/text

Seconds since Ignite or the last `reset_timer`, with two decimals.

```kindlr
on_ignite {
  say(timer)
}
```

<a id="to-json"></a>
### to_json

`to_json(@variable)`

- **Kind:** reporter → number/text
- **Menu values:** `var`: a variable, written `@name`

The variable's value as JSON text (handy for maps).

```kindlr
on_ignite {
  print(to_json(@player))
}
```

<a id="tone"></a>
### tone

`tone(number, number)`

- **Kind:** command

Plays a tone at a frequency in Hertz for some seconds. Waits until it ends.

```kindlr
on_ignite {
  tone(440, 0.5)
}
```

<a id="touching"></a>
### touching

`touching(touch)`

- **Kind:** reporter → true/false · sprite only
- **Menu values:** `touch`: `"_mouse_"`, `"_edge_"`, or a sprite name

True if this sprite touches the mouse pointer (`"_mouse_"`), the edge (`"_edge_"`) or another sprite (by name; its clones count too). Hidden sprites never touch anything.

```kindlr
on_ignite {
  if touching("Star") {
    say("Got it!")
  }
}
```

<a id="touching-color"></a>
### touching_color

`touching_color(colour)`

- **Kind:** reporter → true/false · sprite only

True if this sprite overlaps something with this colour (give it as `"#RRGGBB"`).

```kindlr
on_ignite {
  if touching_color("#3DBE6A") {
    say("Grass!")
  }
}
```

<a id="trim"></a>
### trim

`trim(text)`

- **Kind:** reporter → number/text

The text without spaces at the start and end.

```kindlr
on_ignite {
  print(trim("  hi  "))
}
```

<a id="turn-left"></a>
### turn_left

`turn_left(number)`

- **Kind:** command · sprite only

Turns the sprite counter-clockwise by the given degrees.

```kindlr
on_ignite {
  turn_left(90)
}
```

<a id="turn-right"></a>
### turn_right

`turn_right(number)`

- **Kind:** command · sprite only

Turns the sprite clockwise by the given degrees.

```kindlr
on_ignite {
  turn_right(90)
}
```

<a id="type-of"></a>
### type_of

`type_of(text)`

- **Kind:** reporter → number/text

The kind of a value: `"number"`, `"text"`, `"boolean"` or `"map"`. Text that looks like a number (like `"42"`) counts as a number.

```kindlr
on_ignite {
  print(type_of("hello"))
}
```

<a id="ui-button"></a>
### ui_button

`ui_button(text, text, number, number)`

- **Kind:** command

Adds a button widget with a name and a label at a stage position (the point is the widget's top-left corner). Using a name again replaces that widget. At most 100 widgets.

```kindlr
on_ignite {
  ui_button("go", "Click me", 0, 0)
}
```

<a id="ui-clear"></a>
### ui_clear

`ui_clear`

- **Kind:** command

Removes all widgets.

```kindlr
on_ignite {
  ui_clear
}
```

<a id="ui-label"></a>
### ui_label

`ui_label(text, text, number, number)`

- **Kind:** command

Adds a text label widget.

```kindlr
on_ignite {
  ui_label("title", "My app", -60, 150)
}
```

<a id="ui-remove"></a>
### ui_remove

`ui_remove(text)`

- **Kind:** command

Removes one widget by name.

```kindlr
on_ignite {
  ui_remove("go")
}
```

<a id="ui-set-text"></a>
### ui_set_text

`ui_set_text(text, text)`

- **Kind:** command

Changes the text of a widget. For labels and text boxes this also changes their value.

```kindlr
on_ignite {
  ui_set_text("title", "Done!")
}
```

<a id="ui-slider"></a>
### ui_slider

`ui_slider(text, number, number, number, number)`

- **Kind:** command

Adds a slider between two numbers. It starts at the lower number.

```kindlr
on_ignite {
  ui_slider("speed", 0, 10, -60, -100)
}
```

<a id="ui-textbox"></a>
### ui_textbox

`ui_textbox(text, number, number)`

- **Kind:** command

Adds a one-line text box (max 1000 characters). Read it with `ui_value`.

```kindlr
on_ignite {
  ui_textbox("name", -60, 60)
}
```

<a id="ui-value"></a>
### ui_value

`ui_value(text)`

- **Kind:** reporter → number/text

The value of a widget: the typed text of a text box, the number of a slider, the text of a label. A button's value is empty. Empty text if there is no such widget.

```kindlr
on_ignite {
  print(ui_value("name"))
}
```

<a id="upper"></a>
### upper

`upper(text)`

- **Kind:** reporter → number/text

The text in UPPER CASE.

```kindlr
on_ignite {
  print(upper("hello"))
}
```

<a id="velocity-x"></a>
### velocity_x

`velocity_x`

- **Kind:** reporter → number/text · sprite only

The sprite's velocity x.

```kindlr
on_ignite {
  say(round(velocity_x))
}
```

<a id="velocity-y"></a>
### velocity_y

`velocity_y`

- **Kind:** reporter → number/text · sprite only

The sprite's velocity y.

```kindlr
on_ignite {
  say(round(velocity_y))
}
```

<a id="volume"></a>
### volume

`volume`

- **Kind:** reporter → number/text

This sprite's volume (0–100).

```kindlr
on_ignite {
  say(volume)
}
```

<a id="wait"></a>
### wait

`wait(number)`

- **Kind:** command

Pauses this script for some seconds. Other scripts keep running.

```kindlr
on_ignite {
  say("Wait for it...")
  wait(2)
  say("Ta-da!")
}
```

<a id="wait-until"></a>
### wait_until

`wait_until(condition)`

- **Kind:** command

Pauses this script until the condition becomes true.

```kindlr
on_ignite {
  wait_until(key_pressed("space"))
  say("You pressed space!")
}
```

<a id="while"></a>
### while

`while(condition)` { … }

- **Kind:** command

Repeats the blocks inside as long as the condition is true.

```kindlr
on_ignite {
  while(mouse_down) {
    change_size(1)
  }
}
```

<a id="x-pos"></a>
### x_pos

`x_pos`

- **Kind:** reporter → number/text · sprite only

The sprite's x position.

```kindlr
on_ignite {
  say(x_pos)
}
```

<a id="y-pos"></a>
### y_pos

`y_pos`

- **Kind:** reporter → number/text · sprite only

The sprite's y position.

```kindlr
on_ignite {
  say(y_pos)
}
```

