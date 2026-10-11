# Tutorial: Clicker game

Click Sparky to get points. Spend 10 points on an upgrade that gives more points per click. You have 30 seconds. The best score is saved.

## Step 1: a new project

Click **New**. You have Sparky and the Stage.

## Step 2: count clicks

Select **Sparky** in the sprite list. In blocks: **Events → when this sprite clicked**, then **Variables → + Make a Variable** named `score` ("For all sprites"), and **change [score] by (1)**.

As text:

```kindlr
on_click {
  change(@score, 1)
}
```

**Try it:** apply, press 🔥 Ignite, click Sparky. The `score` box on the stage counts up.

## Step 3: reset at the start and add a bounce

Add an `on_ignite` script that sets the score to 0, and make Sparky grow for a moment when clicked. A second variable, `per_click`, says how many points one click gives.

## Step 4: the shop button (on the Stage)

Select the **Stage** tile. Add a button with **Console & UI → add button**. When it is clicked and you have 10 points, take 10 points and **broadcast** `upgrade`. Sparky listens with **when I receive [upgrade]**.

## Step 5: time limit and best score

`on_timer(30)` fires after 30 seconds. `store_set("best", …)` saves the best score inside the project, and `on_draw` draws the best score and the time left every frame.

## Final scripts

**Sparky:**

```kindlr
// Sparky: the thing you click
on_ignite {
  set(@score, 0)
  set(@per_click, 1)
  show_var(@score)
  go_xy(0, 0)
  set_size(100)
  say_for("Click me!", 2)
}

on_click {
  change(@score, @per_click)
  play_sound("pop")
  set_size(115)
  wait(0.05)
  set_size(100)
  if @score > store_get("best") {
    store_set("best", @score)
  }
}

on_message("upgrade") {
  change(@per_click, 1)
  say_for(join("Now ", join(@per_click, " per click!")), 1)
}

on_message("time up") {
  say(join("Time is up! Score: ", @score))
}
```

**Stage:**

```kindlr
// Stage: the shop button, the best score and the 30-second round
on_ignite {
  ui_clear
  ui_button("buy", "Upgrade (10 points)", 90, -130)
}

on_widget_click("buy") {
  if @score < 10 {
    print("You need 10 points for an upgrade.")
  } else {
    change(@score, -10)
    broadcast("upgrade")
  }
}

on_draw {
  draw_text(join("Best: ", store_get("best")), -230, 160, "#1d2333")
  draw_text(join("Time: ", round(30 - timer)), 150, 160, "#1d2333")
}

on_timer(30) {
  broadcast_wait("time up")
  stop("all")
}
```

**Try it:** press 🔥 Ignite and click fast! After 14 clicks press **Upgrade**.

**Ideas:** make the upgrade cost more each time (use a `@price` variable), or add a `clone` of a star that flies away on each click.
