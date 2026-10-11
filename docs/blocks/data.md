# Data

[← All block categories](index.md)

Blocks in the **Data** category. Each block shows its shape, inputs, what it does, an example as blocks and the same example in Kindlr Script.

> **How to read the "As blocks" pictures:** `(10)` is a number slot, `[Hello]` is a text slot, `[space ▾]` is a dropdown menu, `< >` is a condition slot and `end` marks the bottom of a C block.

- [true](#dt-true)
- [false](#dt-false)
- [type of …](#dt-typeof)
- [uppercase …](#dt-upper)
- [lowercase …](#dt-lower)
- [trim …](#dt-trim)
- [replace … with … in …](#dt-replace)
- [letters … to … of …](#dt-sub)
- [position of … in …](#dt-index)
- [split … by … into list …](#dt-split)
- [join list … with …](#dt-joinlist)
- [set … to empty map](#dt-newmap)
- [in map … set … to …](#dt-mapset)
- [item … of map …](#dt-mapget)
- [map … has … ?](#dt-maphas)
- [delete … from map …](#dt-mapdel)
- [put keys of map … into list …](#dt-mapkeys)
- [size of map …](#dt-mapsize)
- [json of …](#dt-tojson)
- [set … to parsed json …](#dt-fromjson)

<a id="dt-true"></a>
### true

- **Kindlr Script:** `true`
- **Shape:** boolean (gives true or false)
- **Inputs:** none

The value true.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [ready ▾] to <true>
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set(@ready, true)
}
```

<a id="dt-false"></a>
### false

- **Kindlr Script:** `false`
- **Shape:** boolean (gives true or false)
- **Inputs:** none

The value false.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [ready ▾] to <false>
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  set(@ready, false)
}
```

<a id="dt-typeof"></a>
### type of [42]

- **Kindlr Script:** `type_of("42")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `42`)

The kind of a value: `"number"`, `"text"`, `"boolean"` or `"map"`. Text that looks like a number (like `"42"`) counts as a number.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (type of [hello])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(type_of("hello"))
}
```

<a id="dt-upper"></a>
### uppercase [hello]

- **Kindlr Script:** `upper("hello")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `hello`)

The text in UPPER CASE.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (uppercase [hello])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(upper("hello"))
}
```

<a id="dt-lower"></a>
### lowercase [HELLO]

- **Kindlr Script:** `lower("HELLO")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `HELLO`)

The text in lower case.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (lowercase [HELLO])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(lower("HELLO"))
}
```

<a id="dt-trim"></a>
### trim [ hi ]

- **Kindlr Script:** `trim("  hi  ")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `  hi  `)

The text without spaces at the start and end.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (trim [  hi  ])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(trim("  hi  "))
}
```

<a id="dt-replace"></a>
### replace [a] with [o] in [banana]

- **Kindlr Script:** `replace("a", "o", "banana")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `a`), text (default `o`), text (default `banana`)

Replaces every copy of the first text with the second, inside the third. Upper/lower case matters here.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (replace [a] with [o] in [banana])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(replace("a", "o", "banana"))
}
```

<a id="dt-sub"></a>
### letters (1) to (3) of [blocks]

- **Kindlr Script:** `substring(1, 3, "blocks")`
- **Shape:** reporter (gives a value)
- **Inputs:** number (default `1`), number (default `3`), text (default `blocks`)

The letters from one position to another (both included, 1 = first).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (letters (1) to (3) of [blocks])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(substring(1, 3, "blocks"))
}
```

<a id="dt-index"></a>
### position of [c] in [abc]

- **Kindlr Script:** `index_of("c", "abc")`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `c`), text (default `abc`)

Where the first text appears inside the second (1 = start), or 0 if not found. Upper/lower case ignored.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (position of [c] in [abc])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(index_of("c", "abc"))
}
```

<a id="dt-split"></a>
### split [a,b,c] by [,] into list [ ▾]

- **Kindlr Script:** `split("a,b,c", ",", @@mylist)`
- **Shape:** stack (a command)
- **Inputs:** text (default `a,b,c`), text (default `,`), menu `list`
- **Menu values:** `list`: a list, written `@@name`

Splits text at every separator and puts the pieces into a list (replacing what was in it). An empty separator splits into single characters.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
split [a,b,c] by [,] into list [parts ▾]
print (length of [parts ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  split("a,b,c", ",", @@parts)
  print(list_length(@@parts))
}
```

<a id="dt-joinlist"></a>
### join list [ ▾] with [, ]

- **Kindlr Script:** `join_list(@@mylist, ", ")`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `list`, text (default `, `)
- **Menu values:** `list`: a list, written `@@name`

All items of a list joined into one text with a separator between them.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (join list [parts ▾] with [ + ])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(join_list(@@parts, " + "))
}
```

<a id="dt-newmap"></a>
### set [ ▾] to empty map

- **Kindlr Script:** `new_map(@myvar)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`
- **Menu values:** `var`: a variable, written `@name`

Makes the variable an empty map. A map stores values under text keys (like a small dictionary).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [player ▾] to empty map
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  new_map(@player)
}
```

<a id="dt-mapset"></a>
### in map [ ▾] set [key] to [value]

- **Kindlr Script:** `map_set(@myvar, "key", "value")`
- **Shape:** stack (a command)
- **Inputs:** menu `var`, text (default `key`), text (default `value`)
- **Menu values:** `var`: a variable, written `@name`

Stores a value under a key in a map. If the variable is not a map yet, it becomes an empty map first. Up to 10 000 keys.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
in map [player ▾] set [name] to [Mika]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  map_set(@player, "name", "Mika")
}
```

<a id="dt-mapget"></a>
### item [key] of map [ ▾]

- **Kindlr Script:** `map_get("key", @myvar)`
- **Shape:** reporter (gives a value)
- **Inputs:** text (default `key`), menu `var`
- **Menu values:** `var`: a variable, written `@name`

The value stored under a key, or empty text if the key is missing.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (item [name] of map [player ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(map_get("name", @player))
}
```

<a id="dt-maphas"></a>
### map [ ▾] has [key] ?

- **Kindlr Script:** `map_has(@myvar, "key")`
- **Shape:** boolean (gives true or false)
- **Inputs:** menu `var`, text (default `key`)
- **Menu values:** `var`: a variable, written `@name`

True if the map has the key.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
if <map [player ▾] has [name] ?> then
    print [has a name]
end
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  if map_has(@player, "name") {
    print("has a name")
  }
}
```

<a id="dt-mapdel"></a>
### delete [key] from map [ ▾]

- **Kindlr Script:** `map_delete("key", @myvar)`
- **Shape:** stack (a command)
- **Inputs:** text (default `key`), menu `var`
- **Menu values:** `var`: a variable, written `@name`

Removes a key from a map.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
delete [name] from map [player ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  map_delete("name", @player)
}
```

<a id="dt-mapkeys"></a>
### put keys of map [ ▾] into list [ ▾]

- **Kindlr Script:** `map_keys(@myvar, @@mylist)`
- **Shape:** stack (a command)
- **Inputs:** menu `var`, menu `list`
- **Menu values:** `var`: a variable, written `@name`; `list`: a list, written `@@name`

Puts all keys of a map into a list (replacing what was in it).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
put keys of map [player ▾] into list [keys ▾]
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  map_keys(@player, @@keys)
}
```

<a id="dt-mapsize"></a>
### size of map [ ▾]

- **Kindlr Script:** `map_size(@myvar)`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `var`
- **Menu values:** `var`: a variable, written `@name`

How many keys the map has.

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (size of map [player ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(map_size(@player))
}
```

<a id="dt-tojson"></a>
### json of [ ▾]

- **Kindlr Script:** `to_json(@myvar)`
- **Shape:** reporter (gives a value)
- **Inputs:** menu `var`
- **Menu values:** `var`: a variable, written `@name`

The variable's value as JSON text (handy for maps).

**Example – As blocks:**

```text
when 🔥 Ignite pressed
print (json of [player ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  print(to_json(@player))
}
```

<a id="dt-fromjson"></a>
### set [ ▾] to parsed json [{"a": 1}]

- **Kindlr Script:** `from_json(@myvar, "{\"a\": 1}")`
- **Shape:** stack (a command)
- **Inputs:** menu `var`, text (default `{"a": 1}`)
- **Menu values:** `var`: a variable, written `@name`

Reads JSON text into a variable. A JSON object becomes a map; nested objects and arrays inside it are kept as JSON text. A JSON array becomes a map with keys "0", "1", … Invalid JSON stops the script with the error "Invalid JSON".

**Example – As blocks:**

```text
when 🔥 Ignite pressed
set [player ▾] to parsed json [{"hp": 3}]
print (item [hp] of map [player ▾])
```

**Example – Kindlr Script:**

```kindlr
on_ignite {
  from_json(@player, "{\"hp\": 3}")
  print(map_get("hp", @player))
}
```

> Try it: open the **Kindlr Script** tab, paste the example, press **Apply to blocks →**, then press 🔥 **Ignite**.
