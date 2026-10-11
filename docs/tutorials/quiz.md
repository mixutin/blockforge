# Tutorial: Quiz

The Stage asks questions. You type answers. The console shows if you were right.

## Step 1: store questions in two lists

Select the **Stage**. A **list** holds many values in order. We use `@@questions` and `@@answers`; item 1 of each belongs together.

```kindlr
on_ignite {
  list_clear(@@questions)
  list_clear(@@answers)
  list_add("What is 7 * 6?", @@questions)
  list_add("42", @@answers)
}
```

## Step 2: ask each question

`for_each(@q, list_length(@@questions))` counts `@q` from 1 to the number of questions. `ask(…)` shows the question and waits; the typed text is in `answer`.

## Step 3: check the answer

`trim(answer)` removes extra spaces. `=` ignores upper/lower case, so `GREEN` matches `green`. Use `if … else` to print the right message and change the score.

## Final script (Stage)

```kindlr
// A quiz that asks questions and checks the typed answers
on_ignite {
  clear_console
  list_clear(@@questions)
  list_clear(@@answers)
  list_add("What is 7 * 6?", @@questions)
  list_add("42", @@answers)
  list_add("What colour do you get from blue and yellow?", @@questions)
  list_add("green", @@answers)
  list_add("What is the capital of Finland?", @@questions)
  list_add("Helsinki", @@answers)
  set(@score, 0)
  print("Welcome to the quiz! Type your answer and press Enter.")
  for_each(@q, list_length(@@questions)) {
    ask(list_item(@q, @@questions))
    print(join("You said: ", answer))
    if trim(answer) = list_item(@q, @@answers) {
      print("Correct!")
      change(@score, 1)
      play_sound("coin")
    } else {
      print(join("Not quite. The answer is ", list_item(@q, @@answers)))
      play_sound("boom")
    }
  }
  print(join("You got ", join(@score, join(" out of ", list_length(@@questions)))))
  if @score = list_length(@@questions) {
    print("Perfect score!")
  }
}
```

**Try it:** press 🔥 Ignite, type `42` and press Enter. Watch the console.

**Ideas:** add more questions, or pick a random question with `list_item("random", @@questions)`.
