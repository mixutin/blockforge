# Variables

[← All block categories](index.md)

Blocks in the **Variables** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [set … to …](#va-set)
- [change … by …](#va-change)
- [show variable …](#va-show)
- [hide variable …](#va-hide)
- [variable value](#var)

<a id="va-set"></a>
### set [ ▾] to [0]

- **Kindlr Script:** `set(@myvar, 0)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`, text (default `0`)
- **Menu values:** `var`: a variable, written `@name`

Sets a variable to a value (number, text, true/false or a map).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [score ▾] to [0]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set(@score, 0)
}
```

<a id="va-change"></a>
### change [ ▾] by (1)

- **Kindlr Script:** `change(@myvar, 1)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`, number (default `1`)
- **Menu values:** `var`: a variable, written `@name`

Adds a number to a variable (use a negative number to subtract).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
change [score ▾] by (1)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  change(@score, 1)
}
```

<a id="va-show"></a>
### show variable [ ▾]

- **Kindlr Script:** `show_var(@myvar)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`
- **Menu values:** `var`: a variable, written `@name`

Shows the variable's monitor box on the stage.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
show variable [score ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  show_var(@score)
}
```

<a id="va-hide"></a>
### hide variable [ ▾]

- **Kindlr Script:** `hide_var(@myvar)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`
- **Menu values:** `var`: a variable, written `@name`

Hides the variable's monitor box.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
hide variable [score ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  hide_var(@score)
}
```

<a id="var"></a>
### 

- **Kindlr Script:** `@name`
- **Shape:** reporter (gives a value)
- **Inputs:** name

The value of a variable. Written `@name`, or `@"name with spaces"`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (score)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(@score)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
