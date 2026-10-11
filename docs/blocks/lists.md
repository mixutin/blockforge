# Lists

[← All block categories](index.md)

Blocks in the **Lists** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [add … to …](#li-add)
- [delete … of …](#li-delete)
- [delete all of …](#li-clear)
- [insert … at … of …](#li-insert)
- [replace item … of … with …](#li-replace)
- [item … of …](#li-item)
- [item # of … in …](#li-index)
- [length of …](#li-length)
- [… contains … ?](#li-contains)
- [show list …](#li-show)
- [hide list …](#li-hide)
- [list value](#list)

<a id="li-add"></a>
### add [thing] to [ ▾]

- **Kindlr Script:** `list_add("thing", @@mylist)`
- **Shape:** stack (a command)
- **Inputs:** text (default `thing`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

Adds an item to the end of a list. A list holds at most 200 000 items; more are ignored.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
add [apple] to [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  list_add("apple", @@basket)
}
```

<a id="li-delete"></a>
### delete (1) of [ ▾]

- **Kindlr Script:** `list_delete(1, @@mylist)`
- **Shape:** stack (a command)
- **Inputs:** number (default `1`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

Deletes the item at a position. Also accepts `"last"` and `"all"`.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
delete (1) of [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  list_delete(1, @@basket)
}
```

<a id="li-clear"></a>
### delete all of [ ▾]

- **Kindlr Script:** `list_clear(@@mylist)`
- **Shape:** stack (a command)
- **Inputs:** menu `list`
- **Menu values:** `list`: a list, written `@@name`

Deletes every item from the list.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
delete all of [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  list_clear(@@basket)
}
```

<a id="li-insert"></a>
### insert [thing] at (1) of [ ▾]

- **Kindlr Script:** `list_insert("thing", 1, @@mylist)`
- **Shape:** stack (a command)
- **Inputs:** text (default `thing`), number (default `1`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

Inserts an item at a position (1 = front). `"last"` adds to the end.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
insert [pear] at (1) of [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  list_insert("pear", 1, @@basket)
}
```

<a id="li-replace"></a>
### replace item (1) of [ ▾] with [thing]

- **Kindlr Script:** `list_replace(1, @@mylist, "thing")`
- **Shape:** stack (a command)
- **Inputs:** number (default `1`), menu `list`, text (default `thing`)
- **Menu values:** `list`: a list, written `@@name`

Replaces the item at a position (or `"last"`).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
replace item (1) of [basket ▾] with [banana]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  list_replace(1, @@basket, "banana")
}
```

<a id="li-item"></a>
### item (1) of [ ▾]

- **Kindlr Script:** `list_item(1, @@mylist)`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default `1`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

The item at a position. `"last"` and `"random"` work too. Empty text if there is no such item.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (item (1) of [basket ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(list_item(1, @@basket))
}
```

<a id="li-index"></a>
### item # of [thing] in [ ▾]

- **Kindlr Script:** `list_index("thing", @@mylist)`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `thing`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

The position of the first matching item (upper/lower case ignored), or 0 if it is not in the list.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (item # of [apple] in [basket ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(list_index("apple", @@basket))
}
```

<a id="li-length"></a>
### length of [ ▾]

- **Kindlr Script:** `list_length(@@mylist)`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `list`
- **Menu values:** `list`: a list, written `@@name`

How many items the list has.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (length of [basket ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(list_length(@@basket))
}
```

<a id="li-contains"></a>
### [ ▾] contains [thing] ?

- **Kindlr Script:** `list_contains(@@mylist, "thing")`
- **Shape:** boolean (gives true or false)
- **Inputs:** menu `list`, text (default `thing`)
- **Menu values:** `list`: a list, written `@@name`

True if the list has the item (upper/lower case ignored).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <[basket ▾] contains [apple] ?> then
    say [Yum]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if list_contains(@@basket, "apple") {
    say("Yum")
  }
}
```

<a id="li-show"></a>
### show list [ ▾]

- **Kindlr Script:** `show_list(@@mylist)`
- **Shape:** stack (a command)
- **Inputs:** menu `list`
- **Menu values:** `list`: a list, written `@@name`

Shows the list's monitor on the stage.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
show list [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  show_list(@@basket)
}
```

<a id="li-hide"></a>
### hide list [ ▾]

- **Kindlr Script:** `hide_list(@@mylist)`
- **Shape:** stack (a command)
- **Inputs:** menu `list`
- **Menu values:** `list`: a list, written `@@name`

Hides the list's monitor.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
hide list [basket ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  hide_list(@@basket)
}
```

<a id="list"></a>
### 

- **Kindlr Script:** `@@name`
- **Shape:** reporter (gives a value)
- **Inputs:** name

The whole list as text. Items are joined with spaces, or with nothing if every item is a single character.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
say (basket)
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  say(@@basket)
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
