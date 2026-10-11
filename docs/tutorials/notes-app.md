# Tutorial: To-do app (program mode)

An app with text boxes and buttons. Tasks are kept in a list, shown in the console, and saved in project storage so they are still there after you reload.

1. Click **New**. 2. Select the **Stage** and paste the script into the Kindlr Script tab. 3. Apply and press 🔥 Ignite. 4. Type a task, click **Add**. Type a number and click **Done #** to remove it.

New ideas here: `define!` blocks with no inputs (`show_todos()`), `split` and `join_list` to save a list as one text, and widgets.

```kindlr
// A to-do app in program mode: widgets, a list, the console and project storage
define! show_todos() {
  clear_console
  print("--- My to-do list ---")
  if list_length(@@todos) = 0 {
    print("(nothing to do!)")
  }
  for_each(@i, list_length(@@todos)) {
    print(join(@i, join(". ", list_item(@i, @@todos))))
  }
}

define save_todos() {
  store_set("todos", join_list(@@todos, "|"))
}

on_ignite {
  ui_clear
  ui_label("title", "My to-do list", -70, 160)
  ui_textbox("task", -150, 110)
  ui_button("add", "Add", 80, 110)
  ui_textbox("number", -150, 60)
  ui_button("done", "Done #", 80, 60)
  ui_button("clear", "Clear all", -40, 10)
  // load the saved list
  if length_of(store_get("todos")) > 0 {
    split(store_get("todos"), "|", @@todos)
  } else {
    list_clear(@@todos)
  }
  show_todos()
}

on_widget_click("add") {
  set(@task, trim(ui_value("task")))
  if length_of(@task) = 0 {
    print("Type a task first.")
  } else {
    list_add(replace("|", "/", @task), @@todos)
    ui_set_text("task", "")
    save_todos()
    show_todos()
  }
}

on_widget_click("done") {
  set(@n, round(ui_value("number")))
  if @n < 1 or @n > list_length(@@todos) {
    print("There is no task with that number.")
  } else {
    ui_set_text("title", join("Done: ", list_item(@n, @@todos)))
    list_delete(@n, @@todos)
    ui_set_text("number", "")
    save_todos()
    show_todos()
  }
}

on_widget_click("clear") {
  list_clear(@@todos)
  save_todos()
  show_todos()
}
```
