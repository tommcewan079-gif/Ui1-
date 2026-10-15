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

## Projects

Every task and event belongs to a project, and each project keeps its own task list.

- The project bar under the title switches between **All Projects** and a single project. Both dashboards follow it: the rings, Up Next, schedule, stats and weekly chart all narrow to that project.
- In **All Projects**, Required Today and Still Open show one task list per project.
- **New Project** creates a project with a name and colour. The **⋯** button next to the selected project edits or deletes it.
- Data saved by the first version (Work / Personal / Health / Home lists) becomes four projects automatically.

### Claude Code import

When Daybook is opened as a claude.ai artifact, **New Project → Import** reads your Claude Code repos and sessions through the *Claude Code Remote* connector:

- Each repo becomes a project (tagged *Claude Code*).
- Each open session becomes a task in its repo's project, labelled with its status (Working, Needs input, Ready for review, Failed) and linked to the session.
- The sync button in the top bar refreshes them. Sessions that finish in Claude Code are ticked off, and sessions you delete in Daybook are not re-imported.

If the *Claude Code Remote* connector isn't available in your account, Import falls back to a snapshot of your repos and sessions stored in the artifact at `claude/code` (`{updatedAt, repos: [{full_name}], sessions: [{id, title, status_bucket, repo}]}`). Ask Claude in any Claude Code session to "update my Daybook snapshot" to refresh it. Import errors show their error code.

Opened inside Claude, your data is also saved to your private space in the artifact, so it follows you across devices. Opened as a plain file, it uses the browser's `localStorage` and the import is hidden.

## How it works

- Tap the circle to complete a task (with Undo). Tap a task or event to edit or delete it.
- Use **+** to add a reminder or an event.
- At midnight the day rolls over: the totals go into the weekly chart, open tasks carry over to the new day, and events and habits reset.
- The first load shows example projects and tasks. Use **Start fresh** to clear them.
- Follows the system light/dark setting. Link straight to a tab with `#today` or `#summary`.

Files: `index.html` (shell), `styles.css` (design tokens and components), `app.js` (state and rendering).
