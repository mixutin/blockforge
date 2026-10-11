# Console & UI

[← All block categories](index.md)

Blocks in the **Console & UI** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [print …](#pr-print)
- [clear console](#pr-clear)
- [add button … text … at x: … y: …](#ui-button)
- [add label … text … at x: … y: …](#ui-label)
- [add text box … at x: … y: …](#ui-textbox)
- [add slider … from … to … at x: … y: …](#ui-slider)
- [set text of widget … to …](#ui-settext)
- [remove widget …](#ui-remove)
- [remove all widgets](#ui-clear)
- [value of widget …](#ui-value)
- [when widget … clicked](#ui-clicked)
- [when widget … changed](#ui-changed)
- [save … = … to project storage](#st-set)
- [stored value …](#st-get)

<a id="pr-print"></a>
### print [Hello, world!]

- **Kindlr Script:** `print("Hello, world!")`
- **Shape:** stack (a command)
- **Inputs:** text (default `Hello, world!`)

Writes a line of text to the console under the stage. The console keeps the last 500 lines; each line shows at most 2000 characters.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print [Hello, world!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print("Hello, world!")
}
```

<a id="pr-clear"></a>
### clear console

- **Kindlr Script:** `clear_console`
- **Shape:** stack (a command)
- **Inputs:** none

Empties the console.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
clear console
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  clear_console
}
```

<a id="ui-button"></a>
### add button [btn1] text [Click me] at x: (0) y: (0)

- **Kindlr Script:** `ui_button("btn1", "Click me", 0, 0)`
- **Shape:** stack (a command)
- **Inputs:** text (default `btn1`), text (default `Click me`), number (default `0`), number (default `0`)

Adds a button widget with a name and a label at a stage position (the point is the widget's top-left corner). Using a name again replaces that widget. At most 100 widgets.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
add button [go] text [Click me] at x: (0) y: (0)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_button("go", "Click me", 0, 0)
}
```

<a id="ui-label"></a>
### add label [label1] text [Hello] at x: (0) y: (120)

- **Kindlr Script:** `ui_label("label1", "Hello", 0, 120)`
- **Shape:** stack (a command)
- **Inputs:** text (default `label1`), text (default `Hello`), number (default `0`), number (default `120`)

Adds a text label widget.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
add label [title] text [My app] at x: (-60) y: (150)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_label("title", "My app", -60, 150)
}
```

<a id="ui-textbox"></a>
### add text box [input1] at x: (0) y: (-60)

- **Kindlr Script:** `ui_textbox("input1", 0, -60)`
- **Shape:** stack (a command)
- **Inputs:** text (default `input1`), number (default `0`), number (default `-60`)

Adds a one-line text box (max 1000 characters). Read it with `ui_value`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
add text box [name] at x: (-60) y: (60)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_textbox("name", -60, 60)
}
```

<a id="ui-slider"></a>
### add slider [slider1] from (0) to (100) at x: (0) y: (-120)

- **Kindlr Script:** `ui_slider("slider1", 0, 100, 0, -120)`
- **Shape:** stack (a command)
- **Inputs:** text (default `slider1`), number (default `0`), number (default `100`), number (default `0`), number (default `-120`)

Adds a slider between two numbers. It starts at the lower number.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
add slider [speed] from (0) to (10) at x: (-60) y: (-100)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_slider("speed", 0, 10, -60, -100)
}
```

<a id="ui-settext"></a>
### set text of widget [label1] to [Hi]

- **Kindlr Script:** `ui_set_text("label1", "Hi")`
- **Shape:** stack (a command)
- **Inputs:** text (default `label1`), text (default `Hi`)

Changes the text of a widget. For labels and text boxes this also changes their value.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set text of widget [title] to [Done!]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_set_text("title", "Done!")
}
```

<a id="ui-remove"></a>
### remove widget [btn1]

- **Kindlr Script:** `ui_remove("btn1")`
- **Shape:** stack (a command)
- **Inputs:** text (default `btn1`)

Removes one widget by name.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
remove widget [go]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_remove("go")
}
```

<a id="ui-clear"></a>
### remove all widgets

- **Kindlr Script:** `ui_clear`
- **Shape:** stack (a command)
- **Inputs:** none

Removes all widgets.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
remove all widgets
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  ui_clear
}
```

<a id="ui-value"></a>
### value of widget [input1]

- **Kindlr Script:** `ui_value("input1")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `input1`)

The value of a widget: the typed text of a text box, the number of a slider, the text of a label. A button's value is empty. Empty text if there is no such widget.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (value of widget [name])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(ui_value("name"))
}
```

<a id="ui-clicked"></a>
### when widget [btn1] clicked

- **Kindlr Script:** `on_widget_click("btn1") { … }`
- **Shape:** hat (starts a script)
- **Inputs:** text (default `btn1`)

Runs when the button with this name is clicked.

**Example – As blocks:**

```text
when widget [go] clicked
print [Clicked!]
```

**Example – Kindlr Script:**

```kindlr
on_widget_click("go") {
  print("Clicked!")
}
```

<a id="ui-changed"></a>
### when widget [slider1] changed

- **Kindlr Script:** `on_widget_change("slider1") { … }`
- **Shape:** hat (starts a script)
- **Inputs:** text (default `slider1`)

Runs when a text box or slider with this name is changed. A text box reports a change when you press Enter or leave the box; a slider when you let go.

**Example – As blocks:**

```text
when widget [speed] changed
print (value of widget [speed])
```

**Example – Kindlr Script:**

```kindlr
on_widget_change("speed") {
  print(ui_value("speed"))
}
```

<a id="st-set"></a>
### save [best] = [0] to project storage

- **Kindlr Script:** `store_set("best", 0)`
- **Shape:** stack (a command)
- **Inputs:** text (default `best`), text (default `0`)

Saves a value under a key in the project's own storage. It is saved with the project, so it is still there next time. Up to 500 keys; keys are cut to 120 characters.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
save [best] = (score) to project storage
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  store_set("best", @score)
}
```

<a id="st-get"></a>
### stored value [best]

- **Kindlr Script:** `store_get("best")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `best`)

Reads a value from project storage. Empty text if the key does not exist.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (stored value [best])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(store_get("best"))
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
