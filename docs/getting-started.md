# Getting started

In 10 minutes you will make Sparky talk and dance. No experience needed.

## 1. Open the editor

Open Kindlr in your browser. You see the editor:

| Part | Where | What it does |
|---|---|---|
| Top bar | top | **New**, **Open**, **Download**, **Examples**, **My projects**, project name, **Share**, **Sign in**, language (**FI/EN**), theme |
| 🔥 **Ignite** / ⏺ **Stop** | top right | start and stop your project |
| Categories | far left | coloured dots: Events, Motion, Looks… |
| Palette | left | the blocks of the chosen category |
| Tabs | middle top | **Blocks**, **Kindlr Script**, **Costumes** |
| Workspace | middle | where you build scripts |
| Stage | right top | where the project runs |
| Console | under the stage | text from `print` appears here |
| Sprite info | under the console | name, x, y, size, direction of the selected sprite |
| Sprite list | bottom right | all sprites; **+** adds one. The **Stage** tile is next to it |

> **Tip:** **Examples** has five ready projects. Open "Hello Sparky" and press 🔥 Ignite to see what Kindlr can do.

## 2. Start a new project

Click **New** (the first button). You get an empty workspace and Sparky on a white stage.

## 3. Your first script, with blocks

1. Click the yellow **Events** dot. Drag **when 🔥 Ignite pressed** into the workspace.
2. Click **Looks**. Drag **say [Hello!] for (2) seconds** and snap it under the hat. Click the text and type `Hi! I'm Sparky.`
3. Click **Control**. Drag **repeat (10)** under it. Change 10 to `36`.
4. Click **Motion**. Drag **turn ↻ (15) degrees** *inside* the repeat. Change 15 to `10`.
5. Drag **move (10) steps** inside the repeat too, under the turn. Change 10 to `5`.
6. Click **Looks** and put **say [Hello!]** under the repeat. Type `Done!`.

Your script looks like this:

```text
when 🔥 Ignite pressed
say [Hi! I'm Sparky.] for (2) seconds
repeat (36)
    turn ↻ (10) degrees
    move (5) steps
end
say [Done!]
```

**Try it:** press 🔥 **Ignite**. Sparky talks, walks in a circle and says "Done!".

## 4. The same script as text

Click the **Kindlr Script** tab. You see:

```kindlr
on_ignite {
  say_for("Hi! I'm Sparky.", 2)
  repeat(36) {
    turn_right(10)
    move(5)
  }
  say("Done!")
}
```

Each block became one line. `{ }` means "the blocks inside".

**Try it:** change `36` to `18` and `move(5)` to `move(10)`. Click **Apply to blocks →** (or press Ctrl+Enter). Go back to **Blocks**: they changed too!

If you make a typo, the line under the editor tells you, for example `✗ Line 2: unknown block 'mvoe'`. Fix it and apply again.

## 5. React to keys and clicks

Add these scripts in the Kindlr Script tab, under the first one, and apply:

```kindlr
on_key("space") {
  change_y(30)
  wait(0.2)
  change_y(-30)
}

on_click {
  play_sound("pop")
  change_effect("color", 25)
}
```

**Try it:** press 🔥 Ignite, then press space, then click Sparky.

## 6. Save your work

- Your project is **autosaved** in this browser.
- **Download** saves a `.kindlr` file on your computer. **Open** loads it again.
- To save online and share, **Sign in** and use **My projects** and **Share**. See [Sharing](sharing.md).

## Next steps

- Build a full game: [Tutorial: Clicker game](tutorials/clicker.md).
- Learn the text language: [Kindlr Script reference](script/index.md).
