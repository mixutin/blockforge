# Control

[← All block categories](index.md)

Blocks in the **Control** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [wait … seconds](#ct-wait)
- [repeat …](#ct-repeat)
- [forever](#ct-forever)
- [if … then](#ct-if)
- [if … then … else](#ct-ifelse)
- [wait until …](#ct-waituntil)
- [repeat until …](#ct-until)
- [while …](#ct-while)
- [for each … from 1 to …](#ct-for)
- [stop …](#ct-stop)
- [when I start as a clone](#ct-cloned)
- [create clone of …](#ct-clone)
- [delete this clone](#ct-delclone)

<a id="ct-wait"></a>
### wait (1) seconds

- **Kindlr Script:** `wait(1)`
- **Shape:** stack (a command)
- **Inputs:** number (default `1`)

Pauses this script for some seconds. Other scripts keep running.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say [Wait for it...]
wait (2) seconds
say [Ta-da!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say("Wait for it...")
  wait(2)
  say("Ta-da!")
}
```

<a id="ct-repeat"></a>
### repeat (10)

- **Kindlr Script:** `repeat(10) { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** number (default `10`)

Runs the blocks inside a number of times (the number is rounded).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
repeat (4)
    move (50) steps
    turn ↻ (90) degrees
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  repeat(4) {
    move(50)
    turn_right(90)
  }
}
```

<a id="ct-forever"></a>
### forever

- **Kindlr Script:** `forever { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** none

Runs the blocks inside again and again until the project stops. Nothing can come after it.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
forever
    turn ↻ (3) degrees
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  forever {
    turn_right(3)
  }
}
```

<a id="ct-if"></a>
### if < > then

- **Kindlr Script:** `if(condition) { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** condition (default ``)

Runs the blocks inside only if the condition is true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <touching [_edge_ ▾] ?> then
    say [Edge!]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if touching("_edge_") {
    say("Edge!")
  }
}
```

<a id="ct-ifelse"></a>
### if < > then … else

- **Kindlr Script:** `if condition { … } else { … }`
- **Shape:** C block with else
- **Inputs:** condition (default ``)

Runs the first part if the condition is true, otherwise the `else` part. In Kindlr Script you can chain `else if`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(x position) > [0]> then
    say [Right side]
else
    say [Left side]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if x_pos > 0 {
    say("Right side")
  } else {
    say("Left side")
  }
}
```

<a id="ct-waituntil"></a>
### wait until < >

- **Kindlr Script:** `wait_until(condition)`
- **Shape:** stack (a command)
- **Inputs:** condition (default ``)

Pauses this script until the condition becomes true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
wait until <key [space ▾] pressed?>
say [You pressed space!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  wait_until(key_pressed("space"))
  say("You pressed space!")
}
```

<a id="ct-until"></a>
### repeat until < >

- **Kindlr Script:** `repeat_until(condition) { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** condition (default ``)

Repeats the blocks inside until the condition becomes true. The condition is checked before each round.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
repeat until <touching [_edge_ ▾] ?>
    move (5) steps
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  repeat_until(touching("_edge_")) {
    move(5)
  }
}
```

<a id="ct-while"></a>
### while < >

- **Kindlr Script:** `while(condition) { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** condition (default ``)

Repeats the blocks inside as long as the condition is true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
while <mouse down?>
    change size by (1)
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  while(mouse_down) {
    change_size(1)
  }
}
```

<a id="ct-for"></a>
### for each [ ▾] from 1 to (10)

- **Kindlr Script:** `for_each(@myvar, 10) { … }`
- **Shape:** C block (wraps other blocks)
- **Inputs:** menu `var`, number (default `10`)
- **Menu values:** `var`: a variable, written `@name`

Counts a variable from 1 up to the number, running the blocks inside once for each value.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
for each [i ▾] from 1 to (5)
    print (i)
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  for_each(@i, 5) {
    print(@i)
  }
}
```

<a id="ct-stop"></a>
### stop [all ▾]

- **Kindlr Script:** `stop("all")`
- **Shape:** stack (a command)
- **Inputs:** menu `stopOpt`
- **Menu values:** `stopOpt`: `"all"`, `"this script"`, `"other scripts in sprite"`

`"all"` stops the whole project, `"this script"` ends this script, `"other scripts in sprite"` stops the sprite's other scripts and keeps going.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(lives) < [1]> then
    stop [all ▾]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if @lives < 1 {
    stop("all")
  }
}
```

<a id="ct-cloned"></a>
### when I start as a clone

- **Kindlr Script:** `on_clone { … }`
- **Shape:** hat (starts a script) · sprite only
- **Inputs:** none

Runs in a new clone right after it is created. Clones share the original's scripts and costumes.

**Example – As blocks:**

```text
when I start as a clone
go to [_random_ ▾]
show
```

**Example – Kindlr Script:**

```kindlr
on_clone {
  go_to("_random_")
  show
}
```

<a id="ct-clone"></a>
### create clone of [_myself_ ▾]

- **Kindlr Script:** `clone("_myself_")`
- **Shape:** stack (a command)
- **Inputs:** menu `cloneOf`
- **Menu values:** `cloneOf`: `"_myself_"` or a sprite name

Creates a copy (clone) of this sprite (`"_myself_"`) or of another sprite. At most 300 clones can exist at once; extra requests are ignored.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
repeat (5)
    create clone of [_myself_ ▾]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  repeat(5) {
    clone("_myself_")
  }
}
```

<a id="ct-delclone"></a>
### delete this clone

- **Kindlr Script:** `delete_clone`
- **Shape:** cap (ends a script) · sprite only
- **Inputs:** none

Removes this clone and stops its scripts. Does nothing in the original sprite.

**Example – As blocks:**

```text
when I start as a clone
wait (2) seconds
delete this clone
```

**Example – Kindlr Script:**

```kindlr
on_clone {
  wait(2)
  delete_clone
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
