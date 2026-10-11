# Kindlr Script reference

Kindlr Script is the text form of Kindlr Blocks. Every line of text is one block. This page explains the whole language. For every built-in command see [Built-in functions](builtins.md); for the block ↔ text table see [Mapping](../mapping.md).

## 1. Programs and scripts

A sprite (or the Stage) has a list of **scripts**. Every script starts with a **hat** and has a body in `{ }`:

```kindlr
on_ignite {
  say("Hello!")
}
```

Hats (events):

| Hat | Runs when… |
|---|---|
| `on_ignite { }` | 🔥 Ignite is pressed |
| `on_key("space") { }` | a key is pressed (`"any"`, `"up arrow"`, `"a"`, `"5"` …) |
| `on_click { }` | this sprite is clicked (sprites) |
| `on_stage_click { }` | the stage is clicked where no sprite is (Stage) |
| `on_message("name") { }` | a message is broadcast |
| `on_clone { }` | a new clone starts |
| `on_backdrop("name") { }` | the backdrop (room) switches to this name |
| `on_timer(10) { }` | the timer passes 10 seconds |
| `every(0.5) { }` | every 0.5 seconds |
| `on_draw { }` | every frame (for `draw_*`) |
| `on_widget_click("btn") { }` / `on_widget_change("box") { }` | a widget is used |
| `define name(a, b) { }` | defines your own block (see §8) |
| `script { }` | a loose stack with no hat (runs when you click it) |

Each file (`.kls`) holds the scripts of **one** sprite. Scripts can be in any order.

## 2. Lexical rules

- **Comments** start with `//` and go to the end of the line.
- **Whitespace** (spaces, tabs, new lines) only separates things. You may put two statements on one line: `move(10) bounce`.
- **Names** (identifiers): letters, digits and `_`, not starting with a digit: `turn_right`, `score2`.
- **Numbers**: `10`, `3.5`, `.5`, `1e3`. A minus in front is an operator: `-5`.
- **Text** (strings): double quotes only: `"hello"`. Escapes: `\n` is a new line, `\"` is a quote, `\\` is a backslash. Any other `\x` just gives `x` (so `\t` is a plain `t`).
- **Variables**: `@score`, or with spaces `@"high score"`. **Lists**: `@@items`, `@@"my items"`.
- **Reserved words**: `define`, `script`, `else`, `and`, `or`, `not`, `eval`, `param`, `true`, `false`, plus every built-in name.
- The names `__proto__`, `constructor` and `prototype` can't be used for variables, lists, blocks or inputs.

## 3. Statements

A statement is a block name, then its arguments in `( )`. Blocks with no arguments can drop the brackets:

```kindlr
on_ignite {
  move(10)
  say_for("Hi", 2)
  next_costume
  pen_down()
}
```

Giving too many arguments is an error. Missing arguments get the block's default value (for example `move()` moves 10).

## 4. Values and types

Kindlr has four kinds of value:

| Type | Examples | Notes |
|---|---|---|
| number | `10`, `-3.5`, `1e3` | shown with at most 10 decimals: `0.1 + 0.2` shows `0.3` |
| text | `"hello"` | up to 100 000 characters |
| boolean | `true`, `false` | |
| map | made with `new_map` / `from_json` | text keys → plain values (see §7) |

Lists are not values. They live in list variables (`@@name`).

Kindlr is **forgiving** about types:

- In maths, text that is not a number counts as `0`.
- Numbers become text when needed: `join("Score: ", 5)`.
- **False** means: `false`, `0`, empty text `""`, `"0"` or `"false"` (any case). Everything else is true (even `"0.0"`).
- `type_of(v)` tells you `"number"`, `"text"`, `"boolean"` or `"map"`. Text that looks like a number, like `"42"`, counts as a number.

## 5. Operators and precedence

From lowest to highest:

| Level | Operators | Meaning |
|---|---|---|
| 1 | `or` | at least one is true |
| 2 | `and` | both are true |
| 3 | `not` | the opposite |
| 4 | `<` `>` `=` `==` `!=` `<=` `>=` | compare |
| 5 | `+` `-` | add, subtract |
| 6 | `*` `/` `%` | multiply, divide, remainder |
| 7 | `-` (in front) | negative |

- Use `( )` to change the order: `(2 + 3) * 4` is 20.
- `=` and `==` are the same. `!=`, `<=`, `>=` are turned into `not` + `=`, `>` or `<` blocks.
- **Comparing:** if both sides look like numbers they compare as numbers (`"10" > "9"` is true). Otherwise they compare as text, alphabetically, **ignoring upper/lower case** (`"Apple" = "apple"` is true).
- `/` by 0 gives `Infinity`. `%` follows the sign of the right side: `-1 % 3` is `2`.
- Text functions like `join`, `contains`, `letter_of` are normal calls, not operators.

## 6. Variables and scope

```kindlr
on_ignite {
  set(@score, 0)
  change(@score, 1)
  say(@score)
}
```

There are three places a value can live:

| Kind | How you make it | Who sees it |
|---|---|---|
| **Global** variable | **+ Make a Variable** → "For all sprites", or just use it in Kindlr Script | every sprite and the Stage (stored on the Stage) |
| **Sprite** variable | **+ Make a Variable** → "For this sprite only" | only that sprite. Each **clone gets its own copy**, taken when the clone is made |
| **Block input** | `define jump(height) { … }` | only inside that `define`, read-only |

Rules:

- When a sprite uses `@name`, Kindlr first looks for the sprite's own variable, then for a global one.
- If neither exists, a global variable is created (starting at `0`, or an empty list). **Apply to blocks** also creates missing variables as globals.
- There are **no local variables** inside scripts. Use block inputs, or a sprite variable.
- Lists work the same way with `@@name`.

## 7. Lists and maps

```kindlr
on_ignite {
  list_clear(@@basket)
  list_add("apple", @@basket)
  list_add("pear", @@basket)
  say(list_item(1, @@basket))
  new_map(@player)
  map_set(@player, "name", "Mika")
  map_set(@player, "hp", 3)
  print(to_json(@player))
}
```

- List positions start at **1**. `"last"` works for most list blocks; `list_item` also takes `"random"`.
- `@@basket` used as a value gives the whole list as text (items joined by spaces).
- A map is stored in a normal variable. Map values are plain (no nested maps). `from_json` keeps nested objects as JSON text.

## 8. Control flow

```kindlr
on_ignite {
  repeat(3) {
    move(10)
  }
  if x_pos > 100 {
    say("right")
  } else if x_pos < -100 {
    say("left")
  } else {
    say("middle")
  }
  repeat_until(touching("_edge_")) {
    move(5)
  }
  while(key_pressed("space")) {
    change_size(1)
  }
  for_each(@i, 5) {
    print(@i)
  }
  wait_until(mouse_down)
  forever {
    turn_right(2)
  }
}
```

- Conditions may have brackets or not: `if (x_pos > 1) { }` and `if x_pos > 1 { }` are the same.
- `for_each(@i, n)` sets `@i` to 1, 2, … n.
- `stop("all")`, `stop("this script")`, `stop("other scripts in sprite")`.
- **Speed:** a loop that changes something on screen runs **one round per frame** (about 60 per second), so animations are smooth. A loop that changes nothing visible runs many rounds per frame.

## 9. Custom blocks (functions)

```kindlr
define square(size) {
  repeat(4) {
    move(size)
    turn_right(90)
  }
}

on_ignite {
  pen_down
  square(50)
  square(100)
}
```

- Inputs are **bare names** inside the body (`size`), or `param("size")`.
- `define!` (with `!`) runs the whole block without redrawing the screen in between. Use it for drawing and maths: it is much faster.
- Custom blocks are **commands**: they don't return a value. To give back a result, set a variable: `set(@result, …)`.
- A custom block belongs to the sprite it is defined in.
- Blocks can call themselves (recursion), up to 400 levels deep.

> **Watch out:** a bare unknown name like `scroe` is read as a block input. Outside a `define` it is just empty text, so a typo here does not give an error. Write variables with `@`.

## 10. Events, messages, clones and rooms

```kindlr
on_ignite {
  broadcast("start")
  hide
  repeat(5) {
    clone("_myself_")
  }
}

on_clone {
  go_to("_random_")
  show
  wait(2)
  delete_clone
}

on_message("start") {
  say_for("Go!", 1)
}
```

- `broadcast("name")` starts every `on_message("name")` script in all sprites. Names ignore case. A receiver that is still running starts again from the top.
- `broadcast_wait` waits until all receivers are done.
- `on_key` scripts don't restart while still running; other hats do.
- **Clones** share the scripts and costumes of the original. At most **300** clones. All clones disappear on Stop and Ignite. `delete_clone` does nothing in the original.
- **Rooms** are backdrops: `go_room("level 2")`, `room_name`, `on_backdrop("level 2") { }`.
- `on_timer(n)` fires once when the timer passes n; `reset_timer` arms it again.
- `every(s)` repeats every s seconds (minimum 0.02).

## 11. Console, widgets and storage (program mode)

You can build apps, not only games:

```kindlr
on_ignite {
  clear_console
  ui_clear
  ui_textbox("name", -100, 60)
  ui_button("hello", "Say hello", -100, 0)
}

on_widget_click("hello") {
  print(join("Hello, ", ui_value("name")))
  store_set("last_name", ui_value("name"))
}
```

- `print` writes to the console under the stage (last 500 lines are kept).
- Widgets: button, label, text box, slider. The x, y point is the widget's **top-left** corner, in stage coordinates. At most 100 widgets. Widgets are removed on Stop and Ignite.
- `ask("question")` waits for typed input; `answer` holds it.
- `store_set(key, value)` / `store_get(key)` keep values **inside the project file**, so they are still there next time (max 500 keys). In a shared project played by someone else, saving only lasts for that visit.

## 12. Drawing, physics and camera (game toolkit)

```kindlr
on_ignite {
  set_gravity(0.5)
  physics("on")
}

on_key("space") {
  change_velocity(0, 10)
}

on_draw {
  draw_rect(-240, -180, 480, 20, "#5BAF4E")
  draw_text(join("vy ", round(velocity_y)), -230, 160, "#1d2333")
}
```

- **Pen** (`pen_down`, `stamp`…) draws lines that stay until `pen_clear`.
- **Shapes** (`draw_rect`, `draw_circle`, `draw_line`, `draw_text`) last one frame. Draw them in `on_draw`. At most 5000 shapes per frame.
- **Physics** per sprite: every frame velocity y drops by gravity, both velocities shrink by friction, then the sprite moves. There are no automatic collisions; check them with `touching` or positions.
- **Camera** (`camera`, `change_camera`, `camera_follow`) shifts sprites, pen, shapes and bubbles; not the backdrop or widgets. Note that sprites are still kept near the 480 × 360 stage area.
- Coordinates: centre (0, 0), x from -240 to 240, y from -180 (bottom) to 180 (top). Directions: 0 up, 90 right, 180 down, -90 left.

## 13. Showing one value: `eval`

A script can be a single reporter, useful to test an expression by clicking it:

```kindlr
script {
  eval(round(10 / 3))
}
```

`eval` only wraps a reporter block. It never runs text as code.

## 14. Grammar (EBNF)

```text
program     = { script } ;
script      = hat_call body
            | "define" [ "!" ] NAME "(" [ NAME { "," NAME } ] ")" body
            | "script" body ;
hat_call    = HAT_NAME [ "(" [ expr { "," expr } ] ")" ] ;
body        = "{" { statement } "}" ;
statement   = "eval" "(" expr ")"                      (* only alone in script { } *)
            | "if" condition body [ "else" ( body | statement_if ) ]
            | C_NAME ( "(" args ")" | args ) body      (* repeat, forever, while, repeat_until, for_each *)
            | CUSTOM_NAME [ "(" args ")" ]
            | CMD_NAME [ "(" args ")" ] ;
condition   = "(" expr ")" | expr ;
args        = [ expr { "," expr } ] ;
expr        = or_expr ;
or_expr     = and_expr { "or" and_expr } ;
and_expr    = not_expr { "and" not_expr } ;
not_expr    = "not" not_expr | cmp_expr ;
cmp_expr    = add_expr { ( "<" | ">" | "=" | "==" | "!=" | "<=" | ">=" ) add_expr } ;
add_expr    = mul_expr { ( "+" | "-" ) mul_expr } ;
mul_expr    = unary { ( "*" | "/" | "%" ) unary } ;
unary       = "-" unary | primary ;
primary     = NUMBER | STRING | "true" | "false"
            | "@" ( NAME | STRING ) | "@@" ( NAME | STRING )
            | "param" "(" expr ")"
            | REPORTER_NAME [ "(" args ")" ]
            | NAME                                     (* a custom-block input *)
            | "(" expr ")" ;
NAME        = letter_or_underscore { letter | digit | "_" } ;
NUMBER      = digits [ "." digits ] [ ("e"|"E") ["+"|"-"] digits ] | "." digits ;
STRING      = '"' { char | "\" any_char } '"' ;
COMMENT     = "//" { any_char_except_newline } ;
```

`HAT_NAME`, `CMD_NAME`, `C_NAME` and `REPORTER_NAME` are the built-in names in [Built-in functions](builtins.md). `CUSTOM_NAME` is any name defined with `define` in the same text.

## 15. Error messages

**Parse errors** appear under the editor when you click **Apply to blocks**:

| Message | What it means |
|---|---|
| `Line 2: unknown block 'mvoe'` | A typo in a command name, or a custom block that isn't defined. |
| `Line 3: unknown reporter 'x_poss'` | A typo in a reporter name that has `( )`. |
| `'move' takes 1 argument(s) but got 2` | Too many arguments. |
| `expected ) but found }` | A bracket is missing. |
| `missing }` | A `{` was never closed. |
| `unterminated string` | A `"` was never closed. |
| `unexpected character '#'` | A character Kindlr doesn't use (outside a string). |
| `expected a name after @` | `@` must be followed by a name or `"…"`. |
| `'move' cannot start a script — use a hat like on_ignite { }…` | Statements must be inside a hat. |
| `expected a script (e.g. on_ignite { ... }) but found }` | An extra `}`. |
| `expected id but found 1` | A line starts with a value, not a block name. |
| `argument 1 of 'set' must be a plain value` | Menu/variable slots can't hold calculations. |
| `a reporter (eval) can only stand alone in its own script { }` | A reporter was used as a statement. |
| `eval() needs a reporter block` | `eval()` is empty or holds a plain value. |
| `nesting deeper than 64` / `More than 20000 blocks` | The program is too big (see Limits). |
| `“__proto__” is a reserved name…` | Pick another name. |

**Runtime errors** stop only the script that failed and show a message:

| Message | What it means |
|---|---|
| `Runtime error: Invalid JSON` | `from_json` got text that is not JSON. |
| `Runtime error: Custom block recursion deeper than 400` | A custom block called itself too many times. |
| `Too many scripts running` | More than 2000 scripts at once. |
| `Watchdog: project stopped (a script ran too long without pausing)` | One step took over 1 second. |

## 16. Limits

| Limit | Value |
|---|---|
| Script text | 1 MB |
| Project file | 5 MB |
| Nesting depth | 64 |
| Blocks per project | 20 000 |
| Sprites | 100 |
| Variables + lists per sprite | 1000 |
| List length | 200 000 items |
| Text length | 100 000 characters |
| Map size | 10 000 keys |
| Clones | 300 |
| Scripts running at once | 2000 |
| Recursion depth | 400 |
| Block steps per frame | 100 000 (then the frame ends) |
| `define!` burst | 500 ms, then it pauses one frame |
| Watchdog | a single step over 1 s stops the project |
| Project storage | 500 keys |

**Speed tips:** use `define!` for heavy loops; draw in `on_draw` rather than with many clones; avoid `touching_color` in tight loops (it reads pixels).
