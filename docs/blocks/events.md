# Events

[← All block categories](index.md)

Blocks in the **Events** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [when … Ignite pressed](#ev-ignite)
- [when … key pressed](#ev-key)
- [when this sprite clicked](#ev-click)
- [when stage clicked](#ev-stageclick)
- [when backdrop switches to …](#ev-backdrop)
- [when timer > …](#ev-timer)
- [when I receive …](#ev-receive)
- [broadcast …](#ev-broadcast)
- [broadcast … and wait](#ev-broadcastwait)

<a id="ev-ignite"></a>
### when 🔥 Ignite pressed

- **Kindlr Script:** `on_ignite { … }`
- **Shape:** hat (starts a script)
- **Inputs:** none

Starts this script when someone presses the 🔥 **Ignite** button. Ignite first stops everything, resets the timer, camera, physics and effects, then starts every `on_ignite` script in every sprite and the Stage.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say [Let's go!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say("Let's go!")
}
```

<a id="ev-key"></a>
### when [space ▾] key pressed

- **Kindlr Script:** `on_key("space") { … }`
- **Shape:** hat (starts a script)
- **Inputs:** menu `key`
- **Menu values:** `key`: `"space"`, `"up arrow"`, `"down arrow"`, `"left arrow"`, `"right arrow"`, `"any"`, `"a"`, `"b"`, `"c"`, `"d"`, `"e"`, `"f"`, `"g"`, `"h"`, `"i"`, `"j"`, `"k"`, `"l"`, `"m"`, `"n"`, `"o"`, `"p"`, `"q"`, `"r"`, `"s"`, `"t"`, `"u"`, `"v"`, `"w"`, `"x"`, `"y"`, `"z"`, `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`

Runs when a key is pressed. `"any"` matches every key. If the script is still running from the last press, holding the key does not restart it.

**Example – As blocks:**

```text
when [space ▾] key pressed
change y by (20)
wait (0.2) seconds
change y by (-20)
```

**Example – Kindlr Script:**

```kindlr
on_key("space") {
  change_y(20)
  wait(0.2)
  change_y(-20)
}
```

<a id="ev-click"></a>
### when this sprite clicked

- **Kindlr Script:** `on_click { … }`
- **Shape:** hat (starts a script) · sprite only
- **Inputs:** none

Runs when the user clicks this sprite on the stage (the top-most sprite under the pointer wins). Clicking again restarts the script.

**Example – As blocks:**

```text
when this sprite clicked
say [Ouch!] for (1) seconds
```

**Example – Kindlr Script:**

```kindlr
on_click {
  say_for("Ouch!", 1)
}
```

<a id="ev-stageclick"></a>
### when stage clicked

- **Kindlr Script:** `on_stage_click { … }`
- **Shape:** hat (starts a script) · Stage only
- **Inputs:** none

Runs on the Stage when the user clicks a part of the stage where no sprite is.

**Example – As blocks:**

```text
when stage clicked
next backdrop
```

**Example – Kindlr Script:**

```kindlr
on_stage_click {
  next_backdrop
}
```

<a id="ev-backdrop"></a>
### when backdrop switches to [ ▾]

- **Kindlr Script:** `on_backdrop("") { … }`
- **Shape:** hat (starts a script)
- **Inputs:** menu `backdrop`
- **Menu values:** `backdrop`: a backdrop name or number

Runs when the Stage switches to the backdrop with exactly this name (case-sensitive). Also fires for `go_room`.

**Example – As blocks:**

```text
when backdrop switches to [level 2 ▾]
say [Welcome to level 2!]
```

**Example – Kindlr Script:**

```kindlr
on_backdrop("level 2") {
  say("Welcome to level 2!")
}
```

<a id="ev-timer"></a>
### when timer > (10)

- **Kindlr Script:** `on_timer(10) { … }`
- **Shape:** hat (starts a script)
- **Inputs:** number (default `10`)

Runs once when the project timer goes above the number. `reset_timer` arms it again. Clones do not get this event.

**Example – As blocks:**

```text
when timer > (10)
say [10 seconds passed!]
```

**Example – Kindlr Script:**

```kindlr
on_timer(10) {
  say("10 seconds passed!")
}
```

<a id="ev-receive"></a>
### when I receive [message1 ▾]

- **Kindlr Script:** `on_message("message1") { … }`
- **Shape:** hat (starts a script)
- **Inputs:** menu `message`
- **Menu values:** `message`: any message name

Runs when this message is broadcast. Message names are matched without caring about upper/lower case. A new broadcast restarts a receiver that is still running.

**Example – As blocks:**

```text
when I receive [game over ▾]
say [Bye!]
```

**Example – Kindlr Script:**

```kindlr
on_message("game over") {
  say("Bye!")
}
```

<a id="ev-broadcast"></a>
### broadcast [message1 ▾]

- **Kindlr Script:** `broadcast("message1")`
- **Shape:** stack (a command)
- **Inputs:** menu `message`
- **Menu values:** `message`: any message name

Sends a message to every sprite and the Stage. Scripts that start with `on_message` with the same name start running. The sender does not wait.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
broadcast [start ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  broadcast("start")
}
```

<a id="ev-broadcastwait"></a>
### broadcast [message1 ▾] and wait

- **Kindlr Script:** `broadcast_wait("message1")`
- **Shape:** stack (a command)
- **Inputs:** menu `message`
- **Menu values:** `message`: any message name

Like `broadcast`, but waits until every script that received the message has finished.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
broadcast [setup ▾] and wait
say [Setup done]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  broadcast_wait("setup")
  say("Setup done")
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
