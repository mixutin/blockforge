# Operators

[← All block categories](index.md)

Blocks in the **Operators** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [… + …](#op-add)
- [… - …](#op-sub)
- [… * …](#op-mul)
- [… / …](#op-div)
- [pick random … to …](#op-random)
- [… > …](#op-gt)
- [… < …](#op-lt)
- [… = …](#op-eq)
- [… and …](#op-and)
- [… or …](#op-or)
- [not …](#op-not)
- [join … …](#op-join)
- [letter … of …](#op-letter)
- [length of …](#op-length)
- [… contains … ?](#op-contains)
- [… mod …](#op-mod)
- [round …](#op-round)
- [… of …](#op-math)

<a id="op-add"></a>
### () + ()

- **Kindlr Script:** `a + b`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``), number (default ``)

Adds two numbers. Text that is not a number counts as 0.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ((2) + (3))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(2 + 3)
}
```

<a id="op-sub"></a>
### () - ()

- **Kindlr Script:** `a - b`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``), number (default ``)

Subtracts the second number from the first.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ((10) - (4))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(10 - 4)
}
```

<a id="op-mul"></a>
### () * ()

- **Kindlr Script:** `a * b`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``), number (default ``)

Multiplies two numbers.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ((6) * (7))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(6 * 7)
}
```

<a id="op-div"></a>
### () / ()

- **Kindlr Script:** `a / b`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``), number (default ``)

Divides the first number by the second. Dividing by 0 gives `Infinity`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ((10) / (4))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(10 / 4)
}
```

<a id="op-random"></a>
### pick random (1) to (10)

- **Kindlr Script:** `random(1, 10)`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default `1`), number (default `10`)

A random number between the two values (both included). If both are whole numbers without a decimal point you get a whole number; otherwise a decimal number.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (pick random (1) to (6))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(random(1, 6))
}
```

<a id="op-gt"></a>
### [] > [50]

- **Kindlr Script:** `a > b`
- **Shape:** boolean (gives true or false)
- **Inputs:** text (default ``), text (default `50`)

True if the first value is greater. Numbers compare as numbers; other text compares alphabetically, ignoring upper/lower case.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(score) > [10]> then
    say [Great!]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if @score > 10 {
    say("Great!")
  }
}
```

<a id="op-lt"></a>
### [] < [50]

- **Kindlr Script:** `a < b`
- **Shape:** boolean (gives true or false)
- **Inputs:** text (default ``), text (default `50`)

True if the first value is smaller.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(y position) < [-170]> then
    say [Too low]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if y_pos < -170 {
    say("Too low")
  }
}
```

<a id="op-eq"></a>
### [] = [50]

- **Kindlr Script:** `a = b`
- **Shape:** boolean (gives true or false)
- **Inputs:** text (default ``), text (default `50`)

True if the values are equal. `"Apple" = "apple"` is true, and `"10" = 10.0` is true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(answer) = [yes]> then
    say [Yay]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if answer = "yes" {
    say("Yay")
  }
}
```

<a id="op-and"></a>
### < > and < >

- **Kindlr Script:** `a and b`
- **Shape:** boolean (gives true or false)
- **Inputs:** condition (default ``), condition (default ``)

True only if both conditions are true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <<mouse down?> and <touching [_mouse_ ▾] ?>> then
    say [Grabbed]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if mouse_down and touching("_mouse_") {
    say("Grabbed")
  }
}
```

<a id="op-or"></a>
### < > or < >

- **Kindlr Script:** `a or b`
- **Shape:** boolean (gives true or false)
- **Inputs:** condition (default ``), condition (default ``)

True if at least one condition is true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <<key [a ▾] pressed?> or <key [left arrow ▾] pressed?>> then
    change x by (-5)
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if key_pressed("a") or key_pressed("left arrow") {
    change_x(-5)
  }
}
```

<a id="op-not"></a>
### not < >

- **Kindlr Script:** `not(condition)`
- **Shape:** boolean (gives true or false)
- **Inputs:** condition (default ``)

True if the condition is false, and false if it is true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <not <touching [_edge_ ▾] ?>> then
    move (5) steps
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if not touching("_edge_") {
    move(5)
  }
}
```

<a id="op-join"></a>
### join [apple ] [pie]

- **Kindlr Script:** `join("apple ", "pie")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `apple `), text (default `pie`)

Joins two pieces of text together.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (join [Score: ] (score))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(join("Score: ", @score))
}
```

<a id="op-letter"></a>
### letter (1) of [apple]

- **Kindlr Script:** `letter_of(1, "apple")`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default `1`), text (default `apple`)

The letter at a position (1 = first). Empty text if the position is outside the text.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (letter (1) of [Kindlr])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(letter_of(1, "Kindlr"))
}
```

<a id="op-length"></a>
### length of [apple]

- **Kindlr Script:** `length_of("apple")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `apple`)

How many characters the text has.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (length of [Sparky])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(length_of("Sparky"))
}
```

<a id="op-contains"></a>
### [apple] contains [a] ?

- **Kindlr Script:** `contains("apple", "a")`
- **Shape:** boolean (gives true or false)
- **Inputs:** text (default `apple`), text (default `a`)

True if the first text contains the second (upper/lower case ignored).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <(answer) contains [yes] ?> then
    say [OK]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if contains(answer, "yes") {
    say("OK")
  }
}
```

<a id="op-mod"></a>
### () mod ()

- **Kindlr Script:** `a % b`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``), number (default ``)

The remainder after division. The result has the same sign as the second number: `7 % 3` is 1, `-1 % 3` is 2.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <((n) mod (2)) = [0]> then
    say [even]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if @n % 2 = 0 {
    say("even")
  }
}
```

<a id="op-round"></a>
### round ()

- **Kindlr Script:** `round(0)`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default ``)

Rounds to the nearest whole number (.5 rounds up: 2.5 → 3, -2.5 → -2).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (round (3.7))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(round(3.7))
}
```

<a id="op-math"></a>
### [abs ▾] of ()

- **Kindlr Script:** `math("abs", 0)`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `mathfn`, number (default ``)
- **Menu values:** `mathfn`: `"abs"`, `"floor"`, `"ceiling"`, `"sqrt"`, `"sin"`, `"cos"`, `"tan"`, `"asin"`, `"acos"`, `"atan"`, `"ln"`, `"log"`, `"e ^"`, `"10 ^"`

A maths function: abs, floor, ceiling, sqrt, sin, cos, tan, asin, acos, atan (angles in degrees), ln (natural log), log (base 10), e ^, 10 ^. Results are rounded to 10 decimals. Impossible results (e.g. `sqrt` of -1) give `NaN`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say ([sqrt ▾] of (16))
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(math("sqrt", 16))
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
