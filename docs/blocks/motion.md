# Motion

[← All block categories](index.md)

Blocks in the **Motion** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [move … steps](#mo-move)
- [turn ↻ … degrees](#mo-turnr)
- [turn ↺ … degrees](#mo-turnl)
- [go to …](#mo-goto)
- [go to x: … y: …](#mo-gotoxy)
- [glide … secs to …](#mo-glideto)
- [glide … secs to x: … y: …](#mo-glide)
- [point in direction …](#mo-point)
- [point towards …](#mo-towards)
- [change x by …](#mo-chx)
- [set x to …](#mo-setx)
- [change y by …](#mo-chy)
- [set y to …](#mo-sety)
- [if on edge, bounce](#mo-bounce)
- [set rotation style …](#mo-rotstyle)
- [x position](#mo-x)
- [y position](#mo-y)
- [direction](#mo-dir)

<a id="mo-move"></a>
### move (10) steps

- **Kindlr Script:** `move(10)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `10`)

Moves the sprite forward in the direction it is pointing. Negative numbers move backwards.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
move (10) steps
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  move(10)
}
```

<a id="mo-turnr"></a>
### turn ↻ (15) degrees

- **Kindlr Script:** `turn_right(15)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `15`)

Turns the sprite clockwise by the given degrees.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
turn ↻ (90) degrees
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  turn_right(90)
}
```

<a id="mo-turnl"></a>
### turn ↺ (15) degrees

- **Kindlr Script:** `turn_left(15)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `15`)

Turns the sprite counter-clockwise by the given degrees.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
turn ↺ (90) degrees
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  turn_left(90)
}
```

<a id="mo-goto"></a>
### go to [_random_ ▾]

- **Kindlr Script:** `go_to("_random_")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `goto`
- **Menu values:** `goto`: `"_random_"`, `"_mouse_"`, or a sprite name

Jumps to a random spot (`"_random_"`), the mouse pointer (`"_mouse_"`) or another sprite (its name).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
go to [_random_ ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  go_to("_random_")
}
```

<a id="mo-gotoxy"></a>
### go to x: (0) y: (0)

- **Kindlr Script:** `go_xy(0, 0)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0`), number (default `0`)

Jumps to a point. The stage centre is (0, 0); x goes from -240 (left) to 240 (right), y from -180 (bottom) to 180 (top).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
go to x: (0) y: (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  go_xy(0, 0)
}
```

<a id="mo-glideto"></a>
### glide (1) secs to [_random_ ▾]

- **Kindlr Script:** `glide_to(1, "_random_")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `1`), menu `goto`
- **Menu values:** `goto`: `"_random_"`, `"_mouse_"`, or a sprite name

Slides smoothly to a random spot, the mouse or a sprite over the given seconds. The script waits until the glide is done.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
glide (1) secs to [_mouse_ ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  glide_to(1, "_mouse_")
}
```

<a id="mo-glide"></a>
### glide (1) secs to x: (0) y: (0)

- **Kindlr Script:** `glide_xy(1, 0, 0)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `1`), number (default `0`), number (default `0`)

Slides smoothly to a point over the given seconds. The script waits until the glide is done.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
glide (2) secs to x: (100) y: (50)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  glide_xy(2, 100, 50)
}
```

<a id="mo-point"></a>
### point in direction (90)

- **Kindlr Script:** `point(90)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `90`)

Points the sprite in a direction: 90 = right, -90 = left, 0 = up, 180 = down. Directions are kept between -179 and 180.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
point in direction (90)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  point(90)
}
```

<a id="mo-towards"></a>
### point towards [_mouse_ ▾]

- **Kindlr Script:** `point_towards("_mouse_")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `towards`
- **Menu values:** `towards`: `"_mouse_"` or a sprite name

Turns the sprite to face the mouse pointer (`"_mouse_"`) or another sprite.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
point towards [_mouse_ ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  point_towards("_mouse_")
}
```

<a id="mo-chx"></a>
### change x by (10)

- **Kindlr Script:** `change_x(10)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `10`)

Moves the sprite left or right by the number.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change x by (10)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_x(10)
}
```

<a id="mo-setx"></a>
### set x to (0)

- **Kindlr Script:** `set_x(0)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0`)

Sets the x position (left/right).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set x to (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_x(0)
}
```

<a id="mo-chy"></a>
### change y by (10)

- **Kindlr Script:** `change_y(10)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `10`)

Moves the sprite up or down by the number.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change y by (10)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_y(10)
}
```

<a id="mo-sety"></a>
### set y to (0)

- **Kindlr Script:** `set_y(0)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0`)

Sets the y position (up/down).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set y to (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_y(0)
}
```

<a id="mo-bounce"></a>
### if on edge, bounce

- **Kindlr Script:** `bounce`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

If the sprite touches the stage edge, it turns around so it moves away from the edge, and is pushed back inside.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
forever
    move (5) steps
    if on edge, bounce
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  forever {
    move(5)
    bounce
  }
}
```

<a id="mo-rotstyle"></a>
### set rotation style [left-right ▾]

- **Kindlr Script:** `rotation_style("left-right")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `rotStyle`
- **Menu values:** `rotStyle`: `"all around"`, `"left-right"`, `"don't rotate"`

How the costume turns with the direction: `"all around"` (rotates), `"left-right"` (only flips), `"don't rotate"`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set rotation style [left-right ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  rotation_style("left-right")
}
```

<a id="mo-x"></a>
### x position

- **Kindlr Script:** `x_pos`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The sprite's x position.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (x position)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(x_pos)
}
```

<a id="mo-y"></a>
### y position

- **Kindlr Script:** `y_pos`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The sprite's y position.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (y position)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(y_pos)
}
```

<a id="mo-dir"></a>
### direction

- **Kindlr Script:** `direction`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The direction the sprite points (-179…180).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (direction)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(direction)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
