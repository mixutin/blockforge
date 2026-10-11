# Looks

[← All block categories](index.md)

Blocks in the **Looks** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [say … for … seconds](#lo-sayfor)
- [say …](#lo-say)
- [think … for … seconds](#lo-thinkfor)
- [think …](#lo-think)
- [switch costume to …](#lo-costume)
- [next costume](#lo-nextcostume)
- [switch backdrop to …](#lo-backdrop)
- [next backdrop](#lo-nextbackdrop)
- [change size by …](#lo-chsize)
- [set size to … %](#lo-setsize)
- [change … effect by …](#lo-cheffect)
- [set … effect to …](#lo-seteffect)
- [clear graphic effects](#lo-cleareffects)
- [show](#lo-show)
- [hide](#lo-hide)
- [go to … layer](#lo-front)
- [go … … layers](#lo-layers)
- [costume …](#lo-costumeof)
- [backdrop …](#lo-backdropof)
- [size](#lo-size)

<a id="lo-sayfor"></a>
### say [Hello!] for (2) seconds

- **Kindlr Script:** `say_for("Hello!", 2)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** text (default `Hello!`), number (default `2`)

Shows a speech bubble for some seconds, then removes it. The script waits.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say [Hello!] for (2) seconds
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say_for("Hello!", 2)
}
```

<a id="lo-say"></a>
### say [Hello!]

- **Kindlr Script:** `say("Hello!")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** text (default `Hello!`)

Shows a speech bubble until something else replaces it. `say("")` removes the bubble.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say [Hello!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say("Hello!")
}
```

<a id="lo-thinkfor"></a>
### think [Hmm...] for (2) seconds

- **Kindlr Script:** `think_for("Hmm...", 2)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** text (default `Hmm...`), number (default `2`)

Shows a thought bubble for some seconds. The script waits.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
think [Hmm...] for (2) seconds
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  think_for("Hmm...", 2)
}
```

<a id="lo-think"></a>
### think [Hmm...]

- **Kindlr Script:** `think("Hmm...")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** text (default `Hmm...`)

Shows a thought bubble until something replaces it.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
think [Hmm...]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  think("Hmm...")
}
```

<a id="lo-costume"></a>
### switch costume to [ ▾]

- **Kindlr Script:** `costume("")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `costume`
- **Menu values:** `costume`: a costume name or number

Switches to a costume by name or by number (1 = first). `"next costume"` and `"previous costume"` also work.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
switch costume to [2 ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  costume(2)
}
```

<a id="lo-nextcostume"></a>
### next costume

- **Kindlr Script:** `next_costume`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Switches to the next costume, going back to the first after the last one.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
repeat (10)
    next costume
    wait (0.1) seconds
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  repeat(10) {
    next_costume
    wait(0.1)
  }
}
```

<a id="lo-backdrop"></a>
### switch backdrop to [ ▾]

- **Kindlr Script:** `backdrop("")`
- **Shape:** stack (a command)
- **Inputs:** menu `backdrop`
- **Menu values:** `backdrop`: a backdrop name or number

Switches the Stage backdrop by name or number. Also accepts `"next backdrop"`, `"previous backdrop"` and `"random backdrop"`. Starts matching `on_backdrop` scripts.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
switch backdrop to [night sky ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  backdrop("night sky")
}
```

<a id="lo-nextbackdrop"></a>
### next backdrop

- **Kindlr Script:** `next_backdrop`
- **Shape:** stack (a command)
- **Inputs:** none

Switches to the next backdrop.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
next backdrop
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  next_backdrop
}
```

<a id="lo-chsize"></a>
### change size by (10)

- **Kindlr Script:** `change_size(10)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `10`)

Changes the size by the number (percent points). Size stays between 5 % and 500 %.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change size by (10)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_size(10)
}
```

<a id="lo-setsize"></a>
### set size to (100) %

- **Kindlr Script:** `set_size(100)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** number (default `100`)

Sets the size in percent (100 = normal). Size stays between 5 % and 500 %.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set size to (50) %
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_size(50)
}
```

<a id="lo-cheffect"></a>
### change [color ▾] effect by (25)

- **Kindlr Script:** `change_effect("color", 25)`
- **Shape:** stack (a command)
- **Inputs:** menu `effect`, number (default `25`)
- **Menu values:** `effect`: `"color"`, `"ghost"`, `"brightness"`, `"saturation"`

Changes a graphic effect: `"color"` (hue shift, 200 = full circle), `"ghost"` (0 = solid, 100 = invisible), `"brightness"`, `"saturation"` (-100…).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change [color ▾] effect by (25)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_effect("color", 25)
}
```

<a id="lo-seteffect"></a>
### set [ghost ▾] effect to (0)

- **Kindlr Script:** `set_effect("ghost", 0)`
- **Shape:** stack (a command)
- **Inputs:** menu `effect`, number (default `0`)
- **Menu values:** `effect`: `"color"`, `"ghost"`, `"brightness"`, `"saturation"`

Sets a graphic effect to a value. See `change_effect` for the effects.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [ghost ▾] effect to (50)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_effect("ghost", 50)
}
```

<a id="lo-cleareffects"></a>
### clear graphic effects

- **Kindlr Script:** `clear_effects`
- **Shape:** stack (a command)
- **Inputs:** none

Removes all graphic effects.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
clear graphic effects
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  clear_effects
}
```

<a id="lo-show"></a>
### show

- **Kindlr Script:** `show`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Makes the sprite visible.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
show
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  show
}
```

<a id="lo-hide"></a>
### hide

- **Kindlr Script:** `hide`
- **Shape:** stack (a command) · sprite only
- **Inputs:** none

Hides the sprite. Hidden sprites are never "touching" anything.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
hide
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  hide
}
```

<a id="lo-front"></a>
### go to [front ▾] layer

- **Kindlr Script:** `layer("front")`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `frontBack`
- **Menu values:** `frontBack`: `"front"`, `"back"`

Moves the sprite in front of (`"front"`) or behind (`"back"`) all other sprites.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
go to [front ▾] layer
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  layer("front")
}
```

<a id="lo-layers"></a>
### go [forward ▾] (1) layers

- **Kindlr Script:** `move_layers("forward", 1)`
- **Shape:** stack (a command) · sprite only
- **Inputs:** menu `fwdBack`, number (default `1`)
- **Menu values:** `fwdBack`: `"forward"`, `"backward"`

Moves the sprite forward or backward by some layers.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
go [backward ▾] (1) layers
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  move_layers("backward", 1)
}
```

<a id="lo-costumeof"></a>
### costume [number ▾]

- **Kindlr Script:** `costume_of("number")`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** menu `numName`
- **Menu values:** `numName`: `"number"`, `"name"`

The current costume's number (`"number"`) or name (`"name"`).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (costume [name ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(costume_of("name"))
}
```

<a id="lo-backdropof"></a>
### backdrop [number ▾]

- **Kindlr Script:** `backdrop_of("number")`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `numName`
- **Menu values:** `numName`: `"number"`, `"name"`

The current backdrop's number or name.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (backdrop [number ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(backdrop_of("number"))
}
```

<a id="lo-size"></a>
### size

- **Kindlr Script:** `size`
- **Shape:** reporter (gives a value) · sprite only
- **Inputs:** none

The sprite's size in percent, rounded.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (size)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(size)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
