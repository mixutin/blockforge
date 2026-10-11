# Game

[← All block categories](index.md)

Blocks in the **Game** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [every … seconds](#ev-every)
- [when drawing (every frame)](#ga-draw)
- [draw rect x: … y: … w: … h: … …](#ga-rect)
- [draw circle x: … y: … r: … …](#ga-circle)
- [draw line … , … to … , … …](#ga-line)
- [draw text … at x: … y: … …](#ga-text)
- [turn physics …](#ga-physics)
- [set velocity to x: … y: …](#ga-setvel)
- [change velocity by x: … y: …](#ga-chvel)
- [set speed … in my direction](#ga-speed)
- [set gravity to …](#ga-gravity)
- [set friction to …](#ga-friction)
- [velocity x](#ga-vx)
- [velocity y](#ga-vy)
- [set camera to x: … y: …](#ga-camera)
- [change camera by x: … y: …](#ga-chcamera)
- [center camera on me](#ga-follow)
- [camera x](#ga-camx)
- [camera y](#ga-camy)
- [go to room …](#ga-room)
- [room name](#ga-roomname)

<a id="ev-every"></a>
### every (1) seconds

- **Kindlr Script:** `every(1) { … }`
- **Shape:** hat (starts a script)
- **Inputs:** number (default `1`)

Runs again and again, every so many seconds (at least 0.02 s), while the project runs. If the previous run is still going, that tick is skipped. Clones do not get this event.

**Example – As blocks:**

```text
every (1) seconds
change [seconds ▾] by (1)
```

**Example – Kindlr Script:**

```kindlr
every(1) {
  change(@seconds, 1)
}
```

<a id="ga-draw"></a>
### when drawing (every frame)

- **Kindlr Script:** `on_draw { … }`
- **Shape:** hat (starts a script)
- **Inputs:** none

Runs once every frame (about 60 times a second). Shapes drawn with `draw_*` are cleared at the start of each frame, so draw them here. This script runs at full speed (no screen refresh in between), like a `define!` block.

**Example – As blocks:**

```text
when drawing (every frame)
draw circle x: (mouse x) y: (mouse y) r: (10) (#FFD23F)
```

**Example – Kindlr Script:**

```kindlr
on_draw {
  draw_circle(mouse_x, mouse_y, 10, "#FFD23F")
}
```

<a id="ga-rect"></a>
### draw rect x: (0) y: (0) w: (60) h: (40) (#4C7EF3)

- **Kindlr Script:** `draw_rect(0, 0, 60, 40, "#4C7EF3")`
- **Shape:** stack (a command)
- **Inputs:** number (default `0`), number (default `0`), number (default `60`), number (default `40`), colour (default `#4C7EF3`)

Draws a filled rectangle for this frame. x and y are the bottom-left corner.

**Example – As blocks:**

```text
when drawing (every frame)
draw rect x: (-240) y: (-180) w: (480) h: (20) (#5BAF4E)
```

**Example – Kindlr Script:**

```kindlr
on_draw {
  draw_rect(-240, -180, 480, 20, "#5BAF4E")
}
```

<a id="ga-circle"></a>
### draw circle x: (0) y: (0) r: (20) (#FF5D73)

- **Kindlr Script:** `draw_circle(0, 0, 20, "#FF5D73")`
- **Shape:** stack (a command)
- **Inputs:** number (default `0`), number (default `0`), number (default `20`), colour (default `#FF5D73`)

Draws a filled circle for this frame. x and y are the centre.

**Example – As blocks:**

```text
when drawing (every frame)
draw circle x: (0) y: (0) r: (30) (#FF5D73)
```

**Example – Kindlr Script:**

```kindlr
on_draw {
  draw_circle(0, 0, 30, "#FF5D73")
}
```

<a id="ga-line"></a>
### draw line (-50) , (0) to (50) , (0) (#FFD23F)

- **Kindlr Script:** `draw_line(-50, 0, 50, 0, "#FFD23F")`
- **Shape:** stack (a command)
- **Inputs:** number (default `-50`), number (default `0`), number (default `50`), number (default `0`), colour (default `#FFD23F`)

Draws a line (2 px wide) from one point to another for this frame.

**Example – As blocks:**

```text
when drawing (every frame)
draw line (-100) , (0) to (100) , (0) (#FFD23F)
```

**Example – Kindlr Script:**

```kindlr
on_draw {
  draw_line(-100, 0, 100, 0, "#FFD23F")
}
```

<a id="ga-text"></a>
### draw text [Score] at x: (-200) y: (160) (#ffffff)

- **Kindlr Script:** `draw_text("Score", -200, 160, "#ffffff")`
- **Shape:** stack (a command)
- **Inputs:** text (default `Score`), number (default `-200`), number (default `160`), colour (default `#ffffff`)

Draws text for this frame. x and y are the left end of the text's baseline. At most 500 characters.

**Example – As blocks:**

```text
when drawing (every frame)
draw text (join [Score ] (score)) at x: (-230) y: (160) (#ffffff)
```

**Example – Kindlr Script:**

```kindlr
on_draw {
  draw_text(join("Score ", @score), -230, 160, "#ffffff")
}
```

<a id="ga-physics"></a>
### turn physics [on ▾]

- **Kindlr Script:** `physics("on")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `onoff`
- **Menu values:** `onoff`: `"on"`, `"off"`

Turns simple physics on or off for this sprite. When on, each frame: velocity y goes down by gravity, both velocities shrink by friction, and the sprite moves by its velocity. There is no automatic collision.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
turn physics [on ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  physics("on")
}
```

<a id="ga-setvel"></a>
### set velocity to x: (3) y: (0)

- **Kindlr Script:** `set_velocity(3, 0)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `3`), number (default `0`)

Sets the sprite's velocity (steps per frame).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set velocity to x: (3) y: (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_velocity(3, 0)
}
```

<a id="ga-chvel"></a>
### change velocity by x: (0) y: (8)

- **Kindlr Script:** `change_velocity(0, 8)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0`), number (default `8`)

Adds to the sprite's velocity. Great for jumps.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change velocity by x: (0) y: (8)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_velocity(0, 8)
}
```

<a id="ga-speed"></a>
### set speed (4) in my direction

- **Kindlr Script:** `set_speed(4)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `4`)

Sets the velocity to a speed in the direction the sprite points.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
point in direction (45)
set speed (4) in my direction
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  point(45)
  set_speed(4)
}
```

<a id="ga-gravity"></a>
### set gravity to (0.5)

- **Kindlr Script:** `set_gravity(0.5)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0.5`)

Sets this sprite's gravity: how much velocity y drops every frame.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set gravity to (0.5)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_gravity(0.5)
}
```

<a id="ga-friction"></a>
### set friction to (0.02)

- **Kindlr Script:** `set_friction(0.02)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `0.02`)

Sets friction from 0 (none) to 1 (stops at once). Each frame both velocities are multiplied by (1 - friction).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set friction to (0.02)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_friction(0.02)
}
```

<a id="ga-vx"></a>
### velocity x

- **Kindlr Script:** `velocity_x`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The sprite's velocity x.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (round (velocity x))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(round(velocity_x))
}
```

<a id="ga-vy"></a>
### velocity y

- **Kindlr Script:** `velocity_y`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The sprite's velocity y.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (round (velocity y))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(round(velocity_y))
}
```

<a id="ga-camera"></a>
### set camera to x: (0) y: (0)

- **Kindlr Script:** `camera(0, 0)`
- **Shape:** stack (a command)
- **Inputs:** number (default `0`), number (default `0`)

Moves the camera. The camera shifts what you see: sprites, pen drawings, shapes and bubbles (not the backdrop or widgets).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set camera to x: (100) y: (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  camera(100, 0)
}
```

<a id="ga-chcamera"></a>
### change camera by x: (5) y: (0)

- **Kindlr Script:** `change_camera(5, 0)`
- **Shape:** stack (a command)
- **Inputs:** number (default `5`), number (default `0`)

Moves the camera by an amount.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change camera by x: (5) y: (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_camera(5, 0)
}
```

<a id="ga-follow"></a>
### center camera on me

- **Kindlr Script:** `camera_follow`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Centres the camera on this sprite.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
forever
    center camera on me
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  forever {
    camera_follow
  }
}
```

<a id="ga-camx"></a>
### camera x

- **Kindlr Script:** `camera_x`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The camera's x position.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (camera x)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(camera_x)
}
```

<a id="ga-camy"></a>
### camera y

- **Kindlr Script:** `camera_y`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The camera's y position.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (camera y)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(camera_y)
}
```

<a id="ga-room"></a>
### go to room [ ▾]

- **Kindlr Script:** `go_room("")`
- **Shape:** stack (a command)
- **Inputs:** menu `backdrop`
- **Menu values:** `backdrop`: a backdrop name or number

Goes to a "room". Rooms are backdrops, so this works like `backdrop` and starts `on_backdrop` scripts.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
go to room [level 2 ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  go_room("level 2")
}
```

<a id="ga-roomname"></a>
### room name

- **Kindlr Script:** `room_name`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The name of the current room (backdrop).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (room name)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(room_name)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
