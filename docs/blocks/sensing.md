# Sensing

[← All block categories](index.md)

Blocks in the **Sensing** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [touching … ?](#se-touching)
- [touching color … ?](#se-touchcolor)
- [distance to …](#se-distance)
- [ask … and wait](#se-ask)
- [answer](#se-answer)
- [key … pressed?](#se-key)
- [mouse down?](#se-mousedown)
- [mouse x](#se-mousex)
- [mouse y](#se-mousey)
- [timer](#se-timer)
- [reset timer](#se-resettimer)
- [… of …](#se-of)
- [current …](#se-current)
- [days since 2000](#se-days)

<a id="se-touching"></a>
### touching [_mouse_ ▾] ?

- **Kindlr Script:** `touching("_mouse_")`
- **Shape:** boolean (gives true or false) · sprite only
- **Inputs:** menu `touch`
- **Menu values:** `touch`: `"_mouse_"`, `"_edge_"`, or a sprite name

True if this sprite touches the mouse pointer (`"_mouse_"`), the edge (`"_edge_"`) or another sprite (by name; its clones count too). Hidden sprites never touch anything.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <touching [Star ▾] ?> then
    say [Got it!]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if touching("Star") {
    say("Got it!")
  }
}
```

<a id="se-touchcolor"></a>
### touching color (#3DBE6A) ?

- **Kindlr Script:** `touching_color("#3DBE6A")`
- **Shape:** boolean (gives true or false) · sprite only
- **Inputs:** colour (default `#3DBE6A`)

True if this sprite overlaps something with this colour (give it as `"#RRGGBB"`).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <touching color (#3DBE6A) ?> then
    say [Grass!]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if touching_color("#3DBE6A") {
    say("Grass!")
  }
}
```

<a id="se-distance"></a>
### distance to [_mouse_ ▾]

- **Kindlr Script:** `distance_to("_mouse_")`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** menu `towards`
- **Menu values:** `towards`: `"_mouse_"` or a sprite name

Distance in steps to the mouse pointer or a sprite. Returns 10000 if the sprite does not exist.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (round (distance to [_mouse_ ▾]))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(round(distance_to("_mouse_")))
}
```

<a id="se-ask"></a>
### ask [What's your name?] and wait

- **Kindlr Script:** `ask("What's your name?")`
- **Shape:** stack (a command)
- **Inputs:** text (default `What's your name?`)

Asks a question and waits until the user types an answer and presses Enter. A visible sprite shows the question in a speech bubble; otherwise it is shown in the input box. Only one question is open at a time.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
ask [What is your name?] and wait
say (join [Hi, ] (answer))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ask("What is your name?")
  say(join("Hi, ", answer))
}
```

<a id="se-answer"></a>
### answer

- **Kindlr Script:** `answer`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The text typed for the most recent `ask`. It is shared by the whole project.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
ask [Favourite colour?] and wait
print (answer)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ask("Favourite colour?")
  print(answer)
}
```

<a id="se-key"></a>
### key [space ▾] pressed?

- **Kindlr Script:** `key_pressed("space")`
- **Shape:** boolean (gives true or false)
- **Inputs:** menu `key`
- **Menu values:** `key`: `"space"`, `"up arrow"`, `"down arrow"`, `"left arrow"`, `"right arrow"`, `"any"`, `"a"`, `"b"`, `"c"`, `"d"`, `"e"`, `"f"`, `"g"`, `"h"`, `"i"`, `"j"`, `"k"`, `"l"`, `"m"`, `"n"`, `"o"`, `"p"`, `"q"`, `"r"`, `"s"`, `"t"`, `"u"`, `"v"`, `"w"`, `"x"`, `"y"`, `"z"`, `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`

True while the key is held down. `"any"` is true if any key is down.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
forever
    if <key [right arrow ▾] pressed?> then
        change x by (5)
    end
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  forever {
    if key_pressed("right arrow") {
      change_x(5)
    }
  }
}
```

<a id="se-mousedown"></a>
### mouse down?

- **Kindlr Script:** `mouse_down`
- **Shape:** boolean (gives true or false)
- **Inputs:** none

True while the mouse button is pressed.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
wait until <mouse down?>
say [Click!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  wait_until(mouse_down)
  say("Click!")
}
```

<a id="se-mousex"></a>
### mouse x

- **Kindlr Script:** `mouse_x`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The mouse pointer's x position on the stage (rounded).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
forever
    set x to (mouse x)
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  forever {
    set_x(mouse_x)
  }
}
```

<a id="se-mousey"></a>
### mouse y

- **Kindlr Script:** `mouse_y`
- **Shape:** reporter (gives a value)
- **Inputs:** none

The mouse pointer's y position on the stage (rounded).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (mouse y)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(mouse_y)
}
```

<a id="se-timer"></a>
### timer

- **Kindlr Script:** `timer`
- **Shape:** reporter (gives a value)
- **Inputs:** none

Seconds since Ignite or the last `reset_timer`, with two decimals.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (timer)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(timer)
}
```

<a id="se-resettimer"></a>
### reset timer

- **Kindlr Script:** `reset_timer`
- **Shape:** stack (a command)
- **Inputs:** none

Sets the timer back to 0.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
reset timer
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  reset_timer
}
```

<a id="se-of"></a>
### [x position ▾] of [_stage_ ▾]

- **Kindlr Script:** `prop_of("x position", "_stage_")`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `prop`, menu `object`
- **Menu values:** `prop`: `"x position"`, `"y position"`, `"direction"`, `"costume #"`, `"costume name"`, `"size"`, `"volume"`, `"backdrop #"`, `"backdrop name"`; `object`: `"_stage_"` or a sprite name

Reads a property of another sprite or the Stage (`"_stage_"`): x position, y position, direction, costume #, costume name, size, volume (sprites); backdrop #, backdrop name, volume (Stage). Any other name reads that target's own variable. Returns 0 if the sprite does not exist.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ([x position ▾] of [Sparky ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(prop_of("x position", "Sparky"))
}
```

<a id="se-current"></a>
### current [year ▾]

- **Kindlr Script:** `current("year")`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `current`
- **Menu values:** `current`: `"year"`, `"month"`, `"date"`, `"day of week"`, `"hour"`, `"minute"`, `"second"`

Part of the current local date/time: year, month, date, day of week (1 = Sunday), hour, minute, second.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (join [Year ] (current [year ▾]))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(join("Year ", current("year")))
}
```

<a id="se-days"></a>
### days since 2000

- **Kindlr Script:** `days_since_2000`
- **Shape:** reporter (gives a value)
- **Inputs:** none

Days (with fractions) since 1 January 2000 (UTC).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (round (days since 2000))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(round(days_since_2000))
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
