# Pen

[← All block categories](index.md)

Blocks in the **Pen** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [erase all](#pe-clear)
- [stamp](#pe-stamp)
- [pen down](#pe-down)
- [pen up](#pe-up)
- [set pen color to …](#pe-color)
- [change pen hue by …](#pe-chhue)
- [set pen size to …](#pe-size)
- [change pen size by …](#pe-chsize)

<a id="pe-clear"></a>
### erase all

- **Kindlr Script:** `pen_clear`
- **Shape:** stack (a command)
- **Inputs:** none

Erases everything drawn with the pen and with `stamp`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
erase all
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_clear
}
```

<a id="pe-stamp"></a>
### stamp

- **Kindlr Script:** `stamp`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Prints a picture of the sprite onto the pen layer.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
repeat (6)
    stamp
    move (40) steps
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  repeat(6) {
    stamp
    move(40)
  }
}
```

<a id="pe-down"></a>
### pen down

- **Kindlr Script:** `pen_down`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Puts the pen down: from now on the sprite draws a line when it moves.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
pen down
move (100) steps
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_down
  move(100)
}
```

<a id="pe-up"></a>
### pen up

- **Kindlr Script:** `pen_up`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Lifts the pen so moving no longer draws.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
pen up
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_up
}
```

<a id="pe-color"></a>
### set pen color to (#4C7EF3)

- **Kindlr Script:** `pen_color("#4C7EF3")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** colour (default `#4C7EF3`)

Sets the pen colour, e.g. `"#FF5D73"`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set pen color to (#FF5D73)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_color("#FF5D73")
}
```

<a id="pe-chhue"></a>
### change pen hue by (10)

- **Kindlr Script:** `pen_hue(10)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `10`)

Shifts the pen colour around the colour wheel (200 = a full circle).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change pen hue by (10)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_hue(10)
}
```

<a id="pe-size"></a>
### set pen size to (2)

- **Kindlr Script:** `pen_size(2)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `2`)

Sets the pen thickness (1–200).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set pen size to (5)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  pen_size(5)
}
```

<a id="pe-chsize"></a>
### change pen size by (1)

- **Kindlr Script:** `change_pen_size(1)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `1`)

Changes the pen thickness (stays within 1–200).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change pen size by (1)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_pen_size(1)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
