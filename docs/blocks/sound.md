# Sound

[← All block categories](index.md)

Blocks in the **Sound** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [play sound … until done](#so-playwait)
- [start sound …](#so-play)
- [play note … for … beats](#so-note)
- [play tone … Hz for … secs](#so-tone)
- [set instrument to …](#so-inst)
- [stop all sounds](#so-stop)
- [change volume by …](#so-chvol)
- [set volume to … %](#so-setvol)
- [set tempo to … bpm](#so-tempo)
- [volume](#so-vol)

<a id="so-playwait"></a>
### play sound [pop ▾] until done

- **Kindlr Script:** `play_sound_wait("pop")`
- **Shape:** stack (a command)
- **Inputs:** menu `sound`
- **Menu values:** `sound`: `"pop"`, `"beep"`, `"coin"`, `"laser"`, `"boom"`, `"chirp"`, `"jump"`, `"win"`

Plays a built-in sound and waits until it ends. Sounds: pop, beep, coin, laser, boom, chirp, jump, win.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
play sound [win ▾] until done
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  play_sound_wait("win")
}
```

<a id="so-play"></a>
### start sound [pop ▾]

- **Kindlr Script:** `play_sound("pop")`
- **Shape:** stack (a command)
- **Inputs:** menu `sound`
- **Menu values:** `sound`: `"pop"`, `"beep"`, `"coin"`, `"laser"`, `"boom"`, `"chirp"`, `"jump"`, `"win"`

Starts a built-in sound and continues right away.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
start sound [coin ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  play_sound("coin")
}
```

<a id="so-note"></a>
### play note (60) for (0.5) beats

- **Kindlr Script:** `note(60, 0.5)`
- **Shape:** stack (a command)
- **Inputs:** number (default `60`), number (default `0.5`)

Plays a note (MIDI number, 60 = middle C) for some beats at the current tempo, with the current instrument. Waits until the note ends.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
play note (60) for (0.5) beats
play note (64) for (0.5) beats
play note (67) for (1) beats
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  note(60, 0.5)
  note(64, 0.5)
  note(67, 1)
}
```

<a id="so-tone"></a>
### play tone (440) Hz for (0.5) secs

- **Kindlr Script:** `tone(440, 0.5)`
- **Shape:** stack (a command)
- **Inputs:** number (default `440`), number (default `0.5`)

Plays a tone at a frequency in Hertz for some seconds. Waits until it ends.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
play tone (440) Hz for (0.5) secs
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  tone(440, 0.5)
}
```

<a id="so-inst"></a>
### set instrument to [square ▾]

- **Kindlr Script:** `instrument("square")`
- **Shape:** stack (a command)
- **Inputs:** menu `wave`
- **Menu values:** `wave`: `"sine"`, `"square"`, `"sawtooth"`, `"triangle"`

Sets the waveform used by `note` and `tone` for this sprite: sine, square, sawtooth, triangle.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set instrument to [sine ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  instrument("sine")
}
```

<a id="so-stop"></a>
### stop all sounds

- **Kindlr Script:** `stop_sounds`
- **Shape:** stack (a command)
- **Inputs:** none

Stops all sounds that are playing.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
stop all sounds
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  stop_sounds
}
```

<a id="so-chvol"></a>
### change volume by (-10)

- **Kindlr Script:** `change_volume(-10)`
- **Shape:** stack (a command)
- **Inputs:** number (default `-10`)

Changes this sprite's volume (0–100).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change volume by (-10)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change_volume(-10)
}
```

<a id="so-setvol"></a>
### set volume to (100) %

- **Kindlr Script:** `set_volume(100)`
- **Shape:** stack (a command)
- **Inputs:** number (default `100`)

Sets this sprite's volume in percent (0–100).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set volume to (50) %
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_volume(50)
}
```

<a id="so-tempo"></a>
### set tempo to (90) bpm

- **Kindlr Script:** `set_tempo(90)`
- **Shape:** stack (a command)
- **Inputs:** number (default `90`)

Sets the tempo for `note`, in beats per minute (20–500). The tempo is shared by the whole project.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set tempo to (120) bpm
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set_tempo(120)
}
```

<a id="so-vol"></a>
### volume

- **Kindlr Script:** `volume`
- **Shape:** reporter (gives a value)
- **Inputs:** none

This sprite's volume (0–100).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (volume)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(volume)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
