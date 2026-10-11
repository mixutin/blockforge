# My Blocks

[← All block categories](index.md)

Blocks in the **My Blocks** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [define](#define)
- [call a custom block](#call)
- [input value](#param)

<a id="define"></a>
### define

- **Kindlr Script:** `define name(a) { }`
- **Shape:** hat (starts a script)
- **Inputs:** none

Defines your own block (a custom block, like a function). The inputs are names you can use inside the body. `define!` runs the body without refreshing the screen in between, which is much faster for drawing and maths.

**Example – As blocks:**

```text
define square (size)
repeat (4)
    move (size) steps
    turn ↻ (90) degrees
end

when 🔥 Ignite pressed
pen down
square [80]
```

**Example – Kindlr Script:**

```kindlr
define square(size) {
  repeat(4) {
    move(size)
    turn_right(90)
  }
}

on_ignite {
  pen_down
  square(80)
}
```

<a id="call"></a>
### call a custom block

- **Kindlr Script:** `name(args)`
- **Shape:** stack (a command)
- **Inputs:** none

Runs one of your own blocks with the given inputs. Custom blocks belong to one sprite: define them in the same sprite that uses them.

**Example – As blocks:**

```text
define greet (who)
say (join [Hi ] (who)) for (1) seconds

when 🔥 Ignite pressed
greet [Sparky]
```

**Example – Kindlr Script:**

```kindlr
define greet(who) {
  say_for(join("Hi ", who), 1)
}

on_ignite {
  greet("Sparky")
}
```

<a id="param"></a>
### 

- **Kindlr Script:** `name`
- **Shape:** reporter (gives a value)
- **Inputs:** name

The value of a custom block input, written as a bare name inside the `define` body (or `param("name")`). Outside its `define` it is empty text.

**Example – As blocks:**

```text
define double (n)
say ((n) * (2))

when 🔥 Ignite pressed
double [21]
```

**Example – Kindlr Script:**

```kindlr
define double(n) {
  say(n * 2)
}

on_ignite {
  double(21)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
