# Tutorial: Platformer-lite

Sparky walks with the arrow keys, jumps with space, lands on the ground and a platform, and picks up a coin. Shapes are drawn by the Stage every frame.

1. Click **New**. 2. Select the **Stage** and add the Stage script. 3. Select **Sparky** and add the Sparky script. 4. Press 🔥 Ignite and use ← → and space.

How it works: `physics("on")` with `set_gravity(0.6)` pulls Sparky down every frame. Each frame we check "am I below the ground (or inside the platform) while falling?" and if so we put Sparky on top and set the y velocity to 0. Jumping adds upward velocity, but only when `@on_ground` is true.

## Stage

```kindlr
// Stage: draws the level every frame
on_draw {
  // the ground
  draw_rect(-240, -180, 480, 30, "#5BAF4E")
  // a platform
  draw_rect(40, -60, 160, 16, "#B5733F")
  // the coin (only while it has not been picked up)
  if @coin_visible = 1 {
    draw_circle(120, 40, 12, "#FFD23F")
  }
  draw_text(join("Coins: ", @coins), -230, 160, "#1d2333")
}
```

## Sparky

```kindlr
// Sparky: walk with the arrow keys, jump with space
on_ignite {
  go_xy(-180, 0)
  set_size(60)
  point(90)
  rotation_style("left-right")
  set(@coins, 0)
  set(@coin_visible, 1)
  set_velocity(0, 0)
  set_gravity(0.6)
  physics("on")
  forever {
    // walking
    if key_pressed("left arrow") {
      point(-90)
      set_velocity(-4, velocity_y)
    } else if key_pressed("right arrow") {
      point(90)
      set_velocity(4, velocity_y)
    } else {
      set_velocity(0, velocity_y)
    }
    // standing on the ground or on the platform
    set(@on_ground, false)
    if y_pos < -130 and velocity_y <= 0 {
      set_y(-130)
      set_velocity(velocity_x, 0)
      set(@on_ground, true)
    }
    if x_pos > 40 and x_pos < 200 and y_pos < -20 and y_pos > -45 and velocity_y <= 0 {
      set_y(-20)
      set_velocity(velocity_x, 0)
      set(@on_ground, true)
    }
    // picking up the coin
    if @coin_visible = 1 and math("abs", x_pos - 120) < 30 and math("abs", y_pos - 40) < 40 {
      set(@coin_visible, 0)
      change(@coins, 1)
      play_sound("coin")
    }
  }
}

on_key("space") {
  if @on_ground {
    change_velocity(0, 11)
    play_sound("jump")
  }
}
```
