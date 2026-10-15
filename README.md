# Daybook

Two daily dashboards with an Apple-style (iOS) interface:

- **Today**: what's required for the day. Progress rings, an Up Next card, the day's schedule with a live "now" line, habit tracking, and a Reminders-style task list grouped into Overdue, Scheduled and Anytime.
- **Summary**: what has been done. A written recap, rings, stat tiles (completed, remaining, completion rate, on time), a 7-day chart, completed tasks in time order, progress by list, and what will carry over to tomorrow.

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

- Tap the circle to complete a task (with Undo). Tap a task or event to edit or delete it.
- Use **+** to add a reminder or an event.
- Data is saved in the browser's `localStorage`. At midnight the day rolls over: the totals go into the weekly chart, open tasks carry over to the new day, and events and habits reset.
- The first load shows example data. Use **Start fresh** to clear it.
- Follows the system light/dark setting. Link straight to a tab with `#today` or `#summary`.

Files: `index.html` (shell), `styles.css` (design tokens and components), `app.js` (state and rendering).
