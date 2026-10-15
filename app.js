(() => {
  'use strict';

  const KEY = 'daybook.v1';
  const LISTS = {
    work: { name: 'Work', color: 'var(--blue)' },
    personal: { name: 'Personal', color: 'var(--orange)' },
    health: { name: 'Health', color: 'var(--green)' },
    home: { name: 'Home', color: 'var(--purple)' },
  };
  const PRI = { high: '!!!', med: '!!', low: '!' };
  const ESTIMATES = [5, 10, 15, 20, 30, 45, 60, 90, 120];

  // ---------- helpers ----------
  const pad = (n) => String(n).padStart(2, '0');
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const toMin = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toHHMM = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const fmtTime = (m) => { const d = new Date(); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  const fmtDur = (min) => { const h = Math.floor(min / 60), m = min % 60; return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`; };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const uid = () => Math.random().toString(36).slice(2, 10);
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const listOf = (k) => LISTS[k] || LISTS.personal;
  const dateLong = () => new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; };

  const ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    plusCircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="var(--on-color)" stroke-width="2.2" stroke-linecap="round"/></svg>',
    today: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="8" r="2.2"/><circle cx="6" cy="14" r="2.2"/><circle cx="6" cy="20" r="2.2"/><path d="M11.5 8H24M11.5 14H24M11.5 20H24"/></svg>',
    summary: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 23h18"/><rect x="6" y="13" width="3.6" height="7" rx="1.2"/><rect x="12.2" y="7" width="3.6" height="13" rx="1.2"/><rect x="18.4" y="10" width="3.6" height="10" rx="1.2"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.5h1.5V15H3zM5 2h8l-2 3.5L13 9H5z"/></svg>',
    clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>',
    tray: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 9l2-6h8l2 6v4H2zM2 9h3.5l1 2h3l1-2H14"/></svg>',
    percent: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M13 3L3 13"/><circle cx="4.5" cy="4.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/></svg>',
  };

  // ---------- data ----------
  function sample() {
    const t = (title, list, pri, due, est, doneAt) => ({ id: uid(), title, list, pri, due, est, done: doneAt != null, doneAt: doneAt != null ? toMin(doneAt) : null, carried: false });
    const e = (title, start, end, list, location) => ({ id: uid(), title, start, end, list, location });
    const history = [];
    const done = [6, 9, 4, 8, 6, 7], total = [8, 10, 7, 9, 6, 11], effort = [190, 240, 120, 215, 170, 200];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      history.push({ date: todayKey(d), done: done[6 - i], total: total[6 - i], effort: effort[6 - i] });
    }
    return {
      date: todayKey(),
      example: true,
      tasks: [
        t('Book dentist appointment', 'personal', 'low', null, 10, '08:15'),
        t('Review Q4 budget draft', 'work', 'high', '10:00', 45, '09:40'),
        t('Reply to Sarah about the launch timeline', 'work', 'med', '11:00', 15, '10:20'),
        t('Order groceries for the weekend', 'home', 'low', null, 15, '12:05'),
        t('Prep slides for the design review', 'work', 'high', '13:30', 60, null),
        t('Submit expense report', 'work', 'med', '17:00', 20, null),
        t('Pick up prescription', 'health', 'med', '17:30', 20, null),
        t('Call Mum', 'personal', 'med', '19:00', 20, null),
        t('Replace the kitchen tap washer', 'home', 'low', null, 30, null),
      ],
      events: [
        e('Team stand-up', '09:00', '09:15', 'work', 'Zoom'),
        e('1:1 with Priya', '11:30', '12:00', 'work', 'Room 3A'),
        e('Design review', '14:00', '15:00', 'work', 'Room 4B'),
        e('Spin class', '18:00', '18:45', 'health', 'City Gym'),
      ],
      habits: defaultHabits([5, 0, 1, 0]),
      history,
    };
  }

  function defaultHabits(counts = [0, 0, 0, 0]) {
    return [
      { id: 'water', name: 'Water', unit: 'glasses', target: 8, count: counts[0] },
      { id: 'read', name: 'Read', unit: '20 min', target: 1, count: counts[1] },
      { id: 'meditate', name: 'Meditate', unit: '10 min', target: 1, count: counts[2] },
      { id: 'stretch', name: 'Stretch', unit: '5 min', target: 1, count: counts[3] },
    ];
  }

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (_) { s = null; }
    if (!s || !Array.isArray(s.tasks)) s = sample();
    return rollover(s);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* storage unavailable */ } }

  // A new day: log yesterday, carry open tasks forward, clear events and habits.
  function rollover(s) {
    const t = todayKey();
    if (s.date === t) return s;
    const st = stats(s);
    s.history = (s.history || []).concat({ date: s.date, done: st.done, total: st.total, effort: st.effortDone }).slice(-30);
    s.tasks = s.tasks.filter((x) => !x.done).map((x) => ({ ...x, carried: true }));
    s.events = [];
    s.habits.forEach((h) => { h.count = 0; });
    s.date = t;
    return s;
  }

  function stats(s) {
    const tasks = s.tasks, doneT = tasks.filter((t) => t.done);
    const withDue = doneT.filter((t) => t.due && t.doneAt != null);
    const high = tasks.filter((t) => t.pri === 'high');
    return {
      total: tasks.length,
      done: doneT.length,
      open: tasks.length - doneT.length,
      effortAll: sum(tasks, (t) => t.est || 0),
      effortDone: sum(doneT, (t) => t.est || 0),
      habitsDone: s.habits.filter((h) => h.count >= h.target).length,
      habitsTotal: s.habits.length,
      withDue: withDue.length,
      onTime: withDue.filter((t) => t.doneAt <= toMin(t.due)).length,
      high: high.length,
      highDone: high.filter((t) => t.done).length,
    };
  }

  function upNext() {
    const n = nowMin(), c = [];
    S.events.forEach((e) => {
      const st = toMin(e.start), en = toMin(e.end);
      if (en > n) c.push({ kind: 'event', title: e.title, at: st, end: en, list: e.list, location: e.location, ongoing: st <= n });
    });
    S.tasks.forEach((t) => {
      const d = toMin(t.due);
      if (!t.done && d != null && d >= n) c.push({ kind: 'task', title: t.title, at: d, list: t.list });
    });
    c.sort((a, b) => (a.ongoing ? -1 : 0) - (b.ongoing ? -1 : 0) || a.at - b.at);
    return c[0] || null;
  }

  // ---------- state ----------
  let S = load();
  let tab = location.hash === '#summary' ? 'summary' : 'today';
  let showDone = false;
  let clearArmed = false;
  save();

  // ---------- components ----------
  function ringsSvg(vals, size, label) {
    const stroke = size * 0.115, gap = stroke * 0.16, cx = size / 2;
    let out = '';
    vals.forEach((v, i) => {
      const r = cx - stroke / 2 - i * (stroke + gap), c = 2 * Math.PI * r;
      const p = Math.max(0, Math.min(1, v.p || 0));
      out += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" style="stroke:${v.color}" stroke-opacity="0.25" stroke-width="${stroke}"/>`
        + `<circle class="ring-arc" cx="${cx}" cy="${cx}" r="${r}" fill="none" style="stroke:${v.color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 ${cx} ${cx})"/>`;
    });
    return `<svg class="rings" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}">${out}</svg>`;
  }

  function ringsCard(st, big) {
    const vals = [
      { p: st.total ? st.done / st.total : 0, color: 'var(--ring-1)' },
      { p: st.effortAll ? st.effortDone / st.effortAll : 0, color: 'var(--ring-2)' },
      { p: st.habitsTotal ? st.habitsDone / st.habitsTotal : 0, color: 'var(--ring-3)' },
    ];
    const label = `${st.done} of ${st.total} tasks, ${fmtDur(st.effortDone)} of ${fmtDur(st.effortAll)} effort, ${st.habitsDone} of ${st.habitsTotal} habits`;
    return `<section class="rings-card${big ? ' big' : ''}" aria-label="Progress rings">
      ${ringsSvg(vals, 160, label)}
      <div class="ring-legend">
        <div class="ring-row"><span class="k">Tasks</span><span class="v" style="color:var(--ring-1)">${st.done}/${st.total}<small> done</small></span>${big ? `<span class="s">${st.open ? `${plural(st.open, 'task')} still open` : 'All tasks closed'}</span>` : ''}</div>
        <div class="ring-row"><span class="k">Effort</span><span class="v" style="color:var(--ring-2)">${fmtDur(st.effortDone)}<small> / ${fmtDur(st.effortAll)}</small></span>${big ? '<span class="s">Estimated time of finished tasks</span>' : ''}</div>
        <div class="ring-row"><span class="k">Habits</span><span class="v" style="color:var(--ring-3)">${st.habitsDone}/${st.habitsTotal}<small> closed</small></span>${big ? '<span class="s">Daily routines hit their target</span>' : ''}</div>
      </div>
    </section>`;
  }

  function upNextCard(nx) {
    if (!nx) return `<section class="upnext empty"><span class="label">Up next</span><span class="title">You're clear</span><span class="meta">Nothing else is scheduled for today.</span></section>`;
    const n = nowMin(), mins = nx.at - n;
    const when = nx.ongoing ? `Now · ends ${fmtTime(nx.end)}` : mins < 60 ? `In ${mins} min` : `In ${fmtDur(mins)}`;
    const meta = nx.kind === 'event'
      ? `${fmtTime(nx.at)} – ${fmtTime(nx.end)}${nx.location ? ` · ${esc(nx.location)}` : ''}`
      : `Due ${fmtTime(nx.at)} · ${listOf(nx.list).name}`;
    return `<section class="upnext" style="background-color:${listOf(nx.list).color}">
      <span class="label">Up next · ${nx.kind === 'event' ? 'Event' : 'Reminder'}</span>
      <span class="title">${esc(nx.title)}</span>
      <span class="meta">${meta}</span>
      <span class="count">${when}</span>
    </section>`;
  }

  function scheduleCard() {
    const n = nowMin();
    const evs = [...S.events].sort((a, b) => toMin(a.start) - toMin(b.start));
    let rows = '', placed = false;
    const nowLine = `<li class="now-line" aria-label="Current time"><span>${fmtTime(n)}</span><i></i><b></b></li>`;
    evs.forEach((e) => {
      if (!placed && toMin(e.start) > n) { rows += nowLine; placed = true; }
      const past = toMin(e.end) <= n;
      rows += `<li class="event${past ? ' past' : ''}" data-act="edit-event" data-id="${e.id}" style="--c:${listOf(e.list).color}" tabindex="0" role="button" aria-label="Edit ${esc(e.title)}">
        <span class="times"><span>${fmtTime(toMin(e.start))}</span><span>${fmtTime(toMin(e.end))}</span></span>
        <span class="bar"></span>
        <span class="body"><span class="name">${esc(e.title)}</span>${e.location ? `<span class="where">${esc(e.location)}</span>` : ''}</span>
      </li>`;
    });
    if (evs.length && !placed) rows += nowLine;
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Schedule</h2><span class="widget-sub">${plural(evs.length, 'event')}</span></div>
      ${evs.length ? `<ul class="events">${rows}</ul>` : '<p class="empty-note">No events today. Add one with the + button.</p>'}
    </section>`;
  }

  function habitsCard() {
    const items = S.habits.map((h) => {
      const p = Math.min(1, h.count / h.target), done = h.count >= h.target;
      const r = 18, c = 2 * Math.PI * r;
      return `<button class="habit${done ? ' done' : ''}" data-act="habit" data-id="${h.id}" aria-label="${esc(h.name)}: ${h.count} of ${h.target}. Tap to log.">
        <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="${r}" fill="none" style="stroke:var(--ring-3)" stroke-opacity="0.22" stroke-width="5"/><circle class="ring-arc" cx="22" cy="22" r="${r}" fill="none" style="stroke:var(--teal)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 22 22)"/></svg>
        <span class="hn">${esc(h.name)}</span>
        <span class="hc">${done ? 'Done' : h.target > 1 ? `${h.count}/${h.target}` : h.unit}</span>
      </button>`;
    }).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Habits</h2><span class="widget-sub">Tap to log</span></div>
      <div class="habits">${items}</div>
    </section>`;
  }

  function taskRow(t) {
    const L = listOf(t.list), n = nowMin(), d = toMin(t.due);
    const late = !t.done && d != null && d < n;
    const meta = [];
    if (t.done && t.doneAt != null) meta.push(`<span>Done ${fmtTime(t.doneAt)}</span>`);
    else if (d != null) meta.push(`<span class="${late ? 'late' : ''}">${late ? 'Overdue · ' : ''}${fmtTime(d)}</span>`);
    meta.push(`<span class="lst">${L.name}</span>`);
    if (t.est) meta.push(`<span>${fmtDur(t.est)}</span>`);
    if (t.carried && !t.done) meta.push('<span class="chip">Carried over</span>');
    return `<li class="task${t.done ? ' done' : ''}" data-id="${t.id}" style="--c:${L.color}">
      <button class="check" data-act="toggle" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? 'Mark not done' : 'Complete'}: ${esc(t.title)}"></button>
      <button class="task-body" data-act="edit-task" data-id="${t.id}">
        <span class="task-title">${t.pri && PRI[t.pri] ? `<span class="pri" aria-label="${t.pri} priority">${PRI[t.pri]}</span>` : ''}${esc(t.title)}</span>
        <span class="task-meta">${meta.join('')}</span>
      </button>
    </li>`;
  }

  function tasksCard() {
    const n = nowMin();
    const open = S.tasks.filter((t) => !t.done);
    const rank = { high: 0, med: 1, low: 2 };
    const byDue = (a, b) => toMin(a.due) - toMin(b.due);
    const overdue = open.filter((t) => t.due && toMin(t.due) < n).sort(byDue);
    const sched = open.filter((t) => t.due && toMin(t.due) >= n).sort(byDue);
    const anytime = open.filter((t) => !t.due).sort((a, b) => (rank[a.pri] ?? 3) - (rank[b.pri] ?? 3));
    const done = S.tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
    const group = (label, items, cls = '') => items.length ? `<h3 class="section-label ${cls}">${label}</h3><ul class="list">${items.map(taskRow).join('')}</ul>` : '';
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Required Today</h2><span class="widget-sub">${open.length} open</span></div>
      ${open.length ? '' : '<p class="empty-note">Nothing left to do. Enjoy the rest of your day.</p>'}
      ${group('Overdue', overdue, 'red')}
      ${group('Scheduled', sched)}
      ${group('Anytime', anytime)}
      ${done.length ? `<button class="disclose" data-act="show-done" aria-expanded="${showDone}">${showDone ? 'Hide' : 'Show'} completed (${done.length})</button>` : ''}
      ${showDone ? group('Completed', done) : ''}
      <button class="add-row" data-act="add">${ICON.plusCircle}New Reminder</button>
    </section>`;
  }

  function banner() {
    if (!S.example) return '';
    return `<div class="banner" role="note">
      <p>These are example tasks and events so you can see how it works. Your changes are saved in this browser.</p>
      <div class="actions">
        <button class="pill-btn" data-act="keep">Keep them</button>
        <button class="pill-btn ${clearArmed ? 'primary' : 'danger'}" data-act="clear">${clearArmed ? 'Tap again to clear' : 'Start fresh'}</button>
      </div>
    </div>`;
  }

  // ---------- views ----------
  function viewToday() {
    const st = stats(S), nx = upNext();
    const left = st.open ? `${plural(st.open, 'task')} left` : 'Everything is done';
    const next = nx ? `, next up: <strong>${esc(nx.title)}</strong> ${nx.ongoing ? 'is happening now' : `at ${fmtTime(nx.at)}`}` : '';
    return `<section class="hero">
        <p class="eyebrow">${dateLong()}</p>
        <h1 class="large-title">Today</h1>
        <p class="lede">${greeting()} ${left}${next}.</p>
      </section>
      ${banner()}
      <div class="grid">
        <div class="col">${ringsCard(st, false)}${upNextCard(nx)}${scheduleCard()}${habitsCard()}</div>
        <div class="col">${tasksCard()}</div>
      </div>`;
  }

  function narrative(st) {
    if (!st.total) return 'No tasks yet today. Add some on the Today tab and your progress shows up here.';
    const pct = Math.round((st.done / st.total) * 100);
    let s = `You've completed ${st.done} of ${plural(st.total, 'task')} (${pct}%), covering ${fmtDur(st.effortDone)} of ${fmtDur(st.effortAll)} planned work.`;
    if (st.high) s += st.highDone === st.high ? ' Every high-priority item is done.' : ` ${st.highDone} of ${st.high} high-priority items are done.`;
    s += ` ${st.habitsDone} of ${st.habitsTotal} habits closed.`;
    return s;
  }

  function statTiles(st) {
    const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    const tile = (k, icon, color, v, unit, s) => `<div class="stat" style="--c:${color}"><span class="k">${icon}${k}</span><span class="v">${v}${unit ? `<small>${unit}</small>` : ''}</span><span class="s">${s}</span></div>`;
    return `<div class="stats">
      ${tile('Completed', ICON.check, 'var(--green)', st.done, plural(st.done, 'task').replace(/^\d+ /, ''), `${fmtDur(st.effortDone)} of work`)}
      ${tile('Remaining', ICON.tray, 'var(--orange)', st.open, plural(st.open, 'task').replace(/^\d+ /, ''), `${fmtDur(Math.max(0, st.effortAll - st.effortDone))} estimated`)}
      ${tile('Completion', ICON.percent, 'var(--blue)', pct, '%', st.high ? `${st.highDone}/${st.high} high priority` : 'No high-priority tasks')}
      ${tile('On time', ICON.clock, 'var(--purple)', st.onTime, `/ ${st.withDue}`, 'Finished before due time')}
    </div>`;
  }

  function doneCard() {
    const done = S.tasks.filter((t) => t.done).sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));
    const rows = done.map((t) => {
      const L = listOf(t.list);
      return `<li class="done-row"><time>${t.doneAt != null ? fmtTime(t.doneAt) : ''}</time><span class="tick" aria-hidden="true">${ICON.check}</span>
        <span><span class="t">${esc(t.title)}</span><br><span class="m"><span style="color:${L.color};font-weight:600">${L.name}</span>${t.est ? ` · ${fmtDur(t.est)}` : ''}</span></span></li>`;
    }).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Done Today</h2><span class="widget-sub">${done.length} finished</span></div>
      ${done.length ? `<ul class="list">${rows}</ul>` : '<p class="empty-note">Nothing completed yet. Tick off a task on the Today tab and it appears here.</p>'}
    </section>`;
  }

  function listsCard() {
    const rows = Object.entries(LISTS).map(([k, L]) => {
      const items = S.tasks.filter((t) => t.list === k);
      if (!items.length) return '';
      const d = items.filter((t) => t.done).length;
      return `<div class="lrow" style="--c:${L.color}"><div class="top"><b>${L.name}</b><span>${d} of ${items.length}</span></div><div class="track"><i style="width:${(d / items.length) * 100}%"></i></div></div>`;
    }).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">By List</h2></div>
      ${rows ? `<div class="lists">${rows}</div>` : '<p class="empty-note">No tasks yet.</p>'}
    </section>`;
  }

  function weekCard(st) {
    const past = (S.history || []).slice(-6);
    const days = past.map((h) => ({ date: h.date, done: h.done, today: false }));
    days.push({ date: S.date, done: st.done, today: true });
    while (days.length < 7) days.unshift({ date: null, done: 0, today: false, blank: true });
    const real = days.filter((d) => !d.blank);
    const max = Math.max(...real.map((d) => d.done), 1);
    const top = Math.max(4, Math.ceil(max / 4) * 4);
    const avg = real.length ? sum(real, (d) => d.done) / real.length : 0;
    const y = (v) => 100 - (v / top) * 100;
    const label = (d) => d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' }) : '';
    const bars = days.map((d) => `<i class="${d.today ? 'today' : ''}" style="height:${d.blank ? 0 : (d.done / top) * 100}%;${d.blank ? 'visibility:hidden' : ''}" title="${d.date || ''}: ${d.done} done"></i>`).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">This Week</h2><span class="widget-sub">Tasks completed</span></div>
      <div class="week" role="img" aria-label="Tasks completed over the last seven days. Today ${st.done}, daily average ${avg.toFixed(1)}.">
        <div>
          <div class="plot">
            <div class="gl" style="top:0"></div><div class="gl" style="top:50%"></div>
            <div class="avg" style="top:${y(avg)}%"></div>
            <div class="bars">${bars}</div>
          </div>
          <div class="xax">${days.map((d) => `<span class="${d.today ? 'today' : ''}">${label(d)}</span>`).join('')}</div>
        </div>
        <div class="yax"><span style="top:0">${top}</span><span style="top:50%">${top / 2}</span><span style="top:100%">0</span></div>
      </div>
      <div class="week-foot"><span><span class="key-avg"></span>Daily average <b>${avg.toFixed(1)}</b></span><span>Today <b>${st.done}</b></span><span>Week total <b>${sum(real, (d) => d.done)}</b></span></div>
    </section>`;
  }

  function openCard() {
    const open = S.tasks.filter((t) => !t.done).sort((a, b) => (toMin(a.due) ?? 9999) - (toMin(b.due) ?? 9999));
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Still Open</h2><span class="widget-sub">${open.length}</span></div>
      ${open.length ? `<p class="empty-note">Anything still open at midnight moves to tomorrow's list.</p><ul class="list">${open.map(taskRow).join('')}</ul>` : '<p class="empty-note">Nothing carries over to tomorrow.</p>'}
    </section>`;
  }

  function viewSummary() {
    const st = stats(S);
    return `<section class="hero">
        <p class="eyebrow">${dateLong()}</p>
        <h1 class="large-title">Summary</h1>
        <p class="lede">${narrative(st)}</p>
      </section>
      ${banner()}
      <div class="grid">
        <div class="col">${ringsCard(st, true)}${statTiles(st)}${weekCard(st)}</div>
        <div class="col">${doneCard()}${listsCard()}${openCard()}</div>
      </div>`;
  }

  // ---------- shell ----------
  const root = document.getElementById('app');
  const listOptions = Object.entries(LISTS).map(([k, L]) => `<option value="${k}">${L.name}</option>`).join('');
  root.innerHTML = `
    <header class="nav" id="nav"><div class="nav-inner"><span></span><span class="nav-title" id="navTitle"></span><span class="nav-right"><button class="icon-btn" data-act="add" aria-label="New reminder">${ICON.plus}</button></span></div></header>
    <main class="wrap" id="view"></main>
    <nav class="tabbar" aria-label="Dashboards"><div class="tabbar-inner">
      <button class="tab" data-tab="today">${ICON.today}<span>Today</span></button>
      <button class="tab" data-tab="summary">${ICON.summary}<span>Summary</span></button>
    </div></nav>
    <div class="sheet-backdrop" id="sheet" hidden>
      <form class="sheet" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" novalidate>
        <span class="grabber" aria-hidden="true"></span>
        <div class="sheet-head"><button type="button" class="link-btn" data-act="close">Cancel</button><h2 id="sheetTitle">New Reminder</h2><button type="submit" class="link-btn strong" id="sheetSave">Add</button></div>
        <div class="seg" id="kindSeg"><button type="button" data-kind="task" aria-pressed="true">Reminder</button><button type="button" data-kind="event" aria-pressed="false">Event</button></div>
        <div class="group"><label class="field title-field"><input type="text" id="fTitle" placeholder="Title" autocomplete="off" aria-label="Title"></label></div>
        <div class="group" data-for="task">
          <label class="field"><span>List</span><select id="fList">${listOptions}</select></label>
          <div class="field"><span>Priority</span><div class="seg" id="priSeg">
            <button type="button" data-pri="" aria-pressed="true">None</button><button type="button" data-pri="low" aria-pressed="false">!</button><button type="button" data-pri="med" aria-pressed="false">!!</button><button type="button" data-pri="high" aria-pressed="false">!!!</button>
          </div></div>
          <label class="field"><span>Due time</span><input type="time" id="fDue"></label>
          <label class="field"><span>Estimate</span><select id="fEst">${ESTIMATES.map((m) => `<option value="${m}">${fmtDur(m)}</option>`).join('')}</select></label>
        </div>
        <div class="group" data-for="event" hidden>
          <label class="field"><span>Starts</span><input type="time" id="fStart"></label>
          <label class="field"><span>Ends</span><input type="time" id="fEnd"></label>
          <label class="field"><span>Location</span><input type="text" id="fLoc" placeholder="Optional" autocomplete="off"></label>
          <label class="field"><span>Calendar</span><select id="fCal">${listOptions}</select></label>
        </div>
        <button type="button" class="delete-btn" id="fDelete" hidden>Delete</button>
      </form>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span><button class="pill-btn" id="toastUndo" hidden>Undo</button></div>`;

  const $ = (id) => document.getElementById(id);
  const view = $('view'), nav = $('nav'), sheet = $('sheet'), form = $('sheetForm');

  function render() {
    view.innerHTML = tab === 'today' ? viewToday() : viewSummary();
    $('navTitle').textContent = tab === 'today' ? 'Today' : 'Summary';
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    document.title = tab === 'today' ? 'Daybook · Today' : 'Daybook · Summary';
  }
  function commit() { save(); render(); }

  // Toast with optional undo
  let toastTimer = null, undoFn = null;
  function toast(msg, undo) {
    $('toastText').textContent = msg;
    undoFn = undo || null;
    $('toastUndo').hidden = !undo;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3200);
  }
  $('toastUndo').addEventListener('click', () => { if (undoFn) undoFn(); undoFn = null; $('toast').classList.remove('show'); });

  // ---------- sheet ----------
  let editing = null; // { kind, id }
  let kind = 'task';
  function setKind(k) {
    kind = k;
    form.querySelectorAll('#kindSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === k)));
    form.querySelector('[data-for="task"]').hidden = k !== 'task';
    form.querySelector('[data-for="event"]').hidden = k !== 'event';
    $('sheetTitle').textContent = editing ? (k === 'task' ? 'Edit Reminder' : 'Edit Event') : (k === 'task' ? 'New Reminder' : 'New Event');
  }
  function setPri(p) { form.querySelectorAll('#priSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pri === p))); }
  const getPri = () => form.querySelector('#priSeg [aria-pressed="true"]').dataset.pri;

  function openSheet(k, id) {
    editing = id ? { kind: k, id } : null;
    $('kindSeg').hidden = !!id;
    $('fDelete').hidden = !id;
    $('sheetSave').textContent = id ? 'Done' : 'Add';
    const n = nowMin(), nextHour = Math.min(23 * 60, Math.ceil((n + 1) / 60) * 60);
    if (k === 'task') {
      const t = id ? S.tasks.find((x) => x.id === id) : null;
      $('fTitle').value = t ? t.title : '';
      $('fList').value = t ? t.list : 'work';
      setPri(t ? (t.pri || '') : '');
      $('fDue').value = t && t.due ? t.due : '';
      $('fEst').value = String(t ? t.est || 15 : 15);
    } else {
      const e = id ? S.events.find((x) => x.id === id) : null;
      $('fTitle').value = e ? e.title : '';
      $('fStart').value = e ? e.start : toHHMM(nextHour);
      $('fEnd').value = e ? e.end : toHHMM(Math.min(nextHour + 30, 23 * 60 + 59));
      $('fLoc').value = e ? e.location || '' : '';
      $('fCal').value = e ? e.list : 'work';
    }
    setKind(k);
    sheet.hidden = false;
    setTimeout(() => $('fTitle').focus(), 50);
  }
  function closeSheet() { sheet.hidden = true; editing = null; }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = $('fTitle').value.trim();
    if (!title) { $('fTitle').focus(); $('fTitle').placeholder = 'Add a title first'; return; }
    if (kind === 'task') {
      const data = { title, list: $('fList').value, pri: getPri(), due: $('fDue').value || null, est: Number($('fEst').value) };
      if (editing) Object.assign(S.tasks.find((x) => x.id === editing.id), data);
      else S.tasks.push({ id: uid(), done: false, doneAt: null, carried: false, ...data });
      toast(editing ? 'Reminder updated' : 'Reminder added');
    } else {
      const start = $('fStart').value || toHHMM(nowMin());
      let end = $('fEnd').value;
      if (!end || toMin(end) <= toMin(start)) end = toHHMM(Math.min(toMin(start) + 30, 23 * 60 + 59));
      const data = { title, start, end, location: $('fLoc').value.trim(), list: $('fCal').value };
      if (editing) Object.assign(S.events.find((x) => x.id === editing.id), data);
      else S.events.push({ id: uid(), ...data });
      toast(editing ? 'Event updated' : 'Event added');
    }
    closeSheet();
    commit();
  });

  $('fDelete').addEventListener('click', () => {
    if (!editing) return;
    const arr = editing.kind === 'task' ? S.tasks : S.events;
    const idx = arr.findIndex((x) => x.id === editing.id);
    if (idx < 0) return;
    const [removed] = arr.splice(idx, 1);
    closeSheet();
    commit();
    toast(`Deleted “${removed.title}”`, () => { arr.splice(idx, 0, removed); commit(); });
  });

  form.addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-kind]'); if (k) setKind(k.dataset.kind);
    const p = ev.target.closest('[data-pri]'); if (p) setPri(p.dataset.pri);
  });
  sheet.addEventListener('click', (ev) => { if (ev.target === sheet) closeSheet(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !sheet.hidden) closeSheet();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.event[role="button"]')) { ev.preventDefault(); ev.target.click(); }
  });

  // ---------- actions ----------
  document.addEventListener('click', (ev) => {
    const tabBtn = ev.target.closest('[data-tab]');
    if (tabBtn) {
      tab = tabBtn.dataset.tab;
      try { history.replaceState(null, '', tab === 'summary' ? '#summary' : '#today'); } catch (_) { /* sandboxed */ }
      render();
      window.scrollTo({ top: 0 });
      return;
    }
    const el = ev.target.closest('[data-act]');
    if (!el || form.contains(el)) { if (el && el.dataset.act === 'close') closeSheet(); return; }
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case 'add': openSheet('task'); break;
      case 'edit-task': openSheet('task', id); break;
      case 'edit-event': openSheet('event', id); break;
      case 'toggle': toggleTask(id, el); break;
      case 'habit': {
        const h = S.habits.find((x) => x.id === id);
        h.count = h.count >= h.target ? 0 : h.count + 1;
        if (h.count === h.target) toast(`${h.name} closed for today`);
        commit();
        break;
      }
      case 'show-done': showDone = !showDone; render(); break;
      case 'keep': S.example = false; commit(); break;
      case 'clear':
        if (!clearArmed) { clearArmed = true; render(); setTimeout(() => { if (clearArmed) { clearArmed = false; render(); } }, 4000); break; }
        clearArmed = false;
        S = { date: todayKey(), example: false, tasks: [], events: [], habits: defaultHabits(), history: [] };
        commit();
        toast('Cleared. Add your first reminder with +');
        break;
    }
  });

  function toggleTask(id, btn) {
    const t = S.tasks.find((x) => x.id === id);
    if (!t) return;
    const prev = { done: t.done, doneAt: t.doneAt };
    const apply = () => {
      t.done = !prev.done;
      t.doneAt = t.done ? nowMin() : null;
      commit();
      if (t.done) toast(`Completed “${t.title}”`, () => { Object.assign(t, prev); commit(); });
    };
    if (!t.done) { btn.closest('.task').classList.add('ticking'); setTimeout(apply, 380); }
    else apply();
  }

  // Large-title collapse
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 36);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Keep times fresh and roll over at midnight
  function tick() {
    if (!sheet.hidden) return;
    const before = S.date;
    S = rollover(S);
    if (S.date !== before) save();
    render();
  }
  setInterval(tick, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('hashchange', () => { tab = location.hash === '#summary' ? 'summary' : 'today'; render(); });

  render();
  onScroll();
})();
