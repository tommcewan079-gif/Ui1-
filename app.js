(() => {
  'use strict';

  const KEY = 'daybook.v1';
  const FOCUS_KEY = 'daybook.focus';
  const COLORS = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'pink', 'brown'];
  const LEGACY_LISTS = { work: ['Work', 'blue'], personal: ['Personal', 'orange'], health: ['Health', 'green'], home: ['Home', 'purple'] };
  const PRI = { high: '!!!', med: '!!', low: '!' };
  const ESTIMATES = [5, 10, 15, 20, 30, 45, 60, 90, 120];
  const CC_SERVER = 'Claude Code Remote';
  const CC_STATUS = {
    working: ['Working', 'blue'],
    blocked: ['Needs input', 'orange'],
    review_ready: ['Ready for review', 'purple'],
    completed: ['Completed', 'green'],
    failed: ['Failed', 'red'],
  };

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
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const colorVar = (c) => `var(--${COLORS.includes(c) ? c : 'gray'})`;
  const dateLong = () => new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning.' : h < 18 ? 'Good afternoon.' : 'Good evening.'; };
  const rank = { high: 0, med: 1, low: 2 };
  const sortOpen = (a, b) => {
    const da = toMin(a.due), db = toMin(b.due);
    if (da != null && db != null) return da - db;
    if (da != null) return -1;
    if (db != null) return 1;
    return (rank[a.pri] ?? 3) - (rank[b.pri] ?? 3);
  };

  const ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    plusCircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="var(--on-color)" stroke-width="2.2" stroke-linecap="round"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3h3M4 13a8 8 0 0 0 14.6 4.5M20 20v-3h-3"/></svg>',
    today: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="8" r="2.2"/><circle cx="6" cy="14" r="2.2"/><circle cx="6" cy="20" r="2.2"/><path d="M11.5 8H24M11.5 14H24M11.5 20H24"/></svg>',
    summary: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 23h18"/><rect x="6" y="13" width="3.6" height="7" rx="1.2"/><rect x="12.2" y="7" width="3.6" height="13" rx="1.2"/><rect x="18.4" y="10" width="3.6" height="10" rx="1.2"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>',
    tray: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 9l2-6h8l2 6v4H2zM2 9h3.5l1 2h3l1-2H14"/></svg>',
    percent: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M13 3L3 13"/><circle cx="4.5" cy="4.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/></svg>',
  };

  // ---------- data ----------
  function defaultHabits(counts = [0, 0, 0, 0]) {
    return [
      { id: 'water', name: 'Water', unit: 'glasses', target: 8, count: counts[0] },
      { id: 'read', name: 'Read', unit: '20 min', target: 1, count: counts[1] },
      { id: 'meditate', name: 'Meditate', unit: '10 min', target: 1, count: counts[2] },
      { id: 'stretch', name: 'Stretch', unit: '5 min', target: 1, count: counts[3] },
    ];
  }

  // Split n into integer parts by weight, keeping the total exact.
  function split(n, weights) {
    const total = sum(weights, (w) => w);
    const parts = weights.map((w) => Math.floor((n * w) / total));
    parts[0] += n - sum(parts, (p) => p);
    return parts;
  }

  function sample() {
    const projects = [
      { id: 'p-web', name: 'Client website', color: 'blue', source: 'manual' },
      { id: 'p-q4', name: 'Q4 planning', color: 'indigo', source: 'manual' },
      { id: 'p-me', name: 'Personal', color: 'orange', source: 'manual' },
      { id: 'p-home', name: 'Home', color: 'purple', source: 'manual' },
    ];
    const t = (title, project, pri, due, est, doneAt) => ({ id: uid(), title, project, pri, due, est, done: doneAt != null, doneAt: doneAt != null ? toMin(doneAt) : null, carried: false });
    const e = (title, start, end, project, location) => ({ id: uid(), title, start, end, project, location });
    const weights = [4, 3, 2, 1];
    const done = [6, 9, 4, 8, 6, 7], total = [8, 10, 7, 9, 6, 11], effort = [190, 240, 120, 215, 170, 200];
    const history = [];
    for (let i = 6; i >= 1; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = 6 - i, ds = split(done[k], weights), ts = split(total[k], weights);
      const byProject = {};
      projects.forEach((p, j) => { byProject[p.id] = { done: Math.min(ds[j], ts[j]), total: ts[j] }; });
      history.push({ date: todayKey(d), done: done[k], total: total[k], effort: effort[k], byProject });
    }
    return {
      date: todayKey(),
      example: true,
      projects,
      tasks: [
        t('Book dentist appointment', 'p-me', 'low', null, 10, '08:15'),
        t('Review Q4 budget draft', 'p-q4', 'high', '10:00', 45, '09:40'),
        t('Reply to Sarah about the launch timeline', 'p-web', 'med', '11:00', 15, '10:20'),
        t('Order groceries for the weekend', 'p-home', 'low', null, 15, '12:05'),
        t('Prep slides for the design review', 'p-web', 'high', '13:30', 60, null),
        t('Fix broken links on the pricing page', 'p-web', 'med', null, 30, null),
        t('Submit expense report', 'p-q4', 'med', '17:00', 20, null),
        t('Draft hiring plan for January', 'p-q4', 'low', null, 45, null),
        t('Pick up prescription', 'p-me', 'med', '17:30', 20, null),
        t('Call Mum', 'p-me', 'med', '19:00', 20, null),
        t('Replace the kitchen tap washer', 'p-home', 'low', null, 30, null),
      ],
      events: [
        e('Team stand-up', '09:00', '09:15', 'p-web', 'Zoom'),
        e('1:1 with Priya', '11:30', '12:00', 'p-q4', 'Room 3A'),
        e('Design review', '14:00', '15:00', 'p-web', 'Room 4B'),
        e('Spin class', '18:00', '18:45', 'p-me', 'City Gym'),
      ],
      habits: defaultHabits([5, 0, 1, 0]),
      history,
      ccIgnored: [],
      lastSync: null,
    };
  }

  function freshState() {
    return {
      date: todayKey(), example: false,
      projects: [{ id: uid(), name: 'Personal', color: 'orange', source: 'manual' }],
      tasks: [], events: [], habits: defaultHabits(), history: [], ccIgnored: [], lastSync: null,
    };
  }

  // Bring older saved data (fixed lists) up to the project model.
  function migrate(s) {
    s.tasks = Array.isArray(s.tasks) ? s.tasks : [];
    s.events = Array.isArray(s.events) ? s.events : [];
    s.habits = Array.isArray(s.habits) && s.habits.length ? s.habits : defaultHabits();
    s.history = Array.isArray(s.history) ? s.history : [];
    s.ccIgnored = Array.isArray(s.ccIgnored) ? s.ccIgnored : [];
    if (!Array.isArray(s.projects)) {
      s.projects = Object.entries(LEGACY_LISTS).map(([id, [name, color]]) => ({ id, name, color, source: 'manual' }));
    }
    if (!s.projects.length) s.projects.push({ id: uid(), name: 'Personal', color: 'orange', source: 'manual' });
    const ids = new Set(s.projects.map((p) => p.id));
    [...s.tasks, ...s.events].forEach((x) => {
      if (!x.project) x.project = x.list;
      delete x.list;
      if (!ids.has(x.project)) x.project = s.projects[0].id;
    });
    return s;
  }

  // A new day: log yesterday, carry open tasks forward, clear events and habits.
  function rollover(s) {
    const t = todayKey();
    if (s.date === t) return s;
    const st = stats({ tasks: s.tasks, habits: s.habits });
    const byProject = {};
    s.tasks.forEach((x) => {
      const b = byProject[x.project] || (byProject[x.project] = { done: 0, total: 0 });
      b.total++; if (x.done) b.done++;
    });
    s.history = s.history.concat({ date: s.date, done: st.done, total: st.total, effort: st.effortDone, byProject }).slice(-30);
    s.tasks = s.tasks.filter((x) => !x.done).map((x) => ({ ...x, carried: true }));
    s.events = [];
    s.habits.forEach((h) => { h.count = 0; });
    s.date = t;
    return s;
  }

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (_) { s = null; }
    if (!s || !Array.isArray(s.tasks)) s = sample();
    return rollover(migrate(s));
  }

  function stats(v) {
    const tasks = v.tasks, doneT = tasks.filter((t) => t.done);
    const withDue = doneT.filter((t) => t.due && t.doneAt != null);
    const high = tasks.filter((t) => t.pri === 'high');
    return {
      total: tasks.length,
      done: doneT.length,
      open: tasks.length - doneT.length,
      effortAll: sum(tasks, (t) => t.est || 0),
      effortDone: sum(doneT, (t) => t.est || 0),
      habitsDone: v.habits.filter((h) => h.count >= h.target).length,
      habitsTotal: v.habits.length,
      withDue: withDue.length,
      onTime: withDue.filter((t) => t.doneAt <= toMin(t.due)).length,
      high: high.length,
      highDone: high.filter((t) => t.done).length,
    };
  }

  // ---------- state ----------
  let S = load();
  let tab = location.hash === '#summary' ? 'summary' : 'today';
  let focus = 'all';
  try { focus = localStorage.getItem(FOCUS_KEY) || 'all'; } catch (_) { /* storage unavailable */ }
  let showDone = false;
  let clearArmed = false;
  let mcp = null;
  let syncing = false;
  let cloudDoc = null;
  let saveTimer = null;

  const projOf = (id) => S.projects.find((p) => p.id === id) || { id, name: 'No project', color: 'gray' };
  const inFocus = (x) => focus === 'all' || x.project === focus;
  const scoped = () => ({ tasks: S.tasks.filter(inFocus), events: S.events.filter(inFocus), habits: S.habits });
  function validateFocus() { if (focus !== 'all' && !S.projects.some((p) => p.id === focus)) focus = 'all'; }
  function setFocus(f) { focus = f; validateFocus(); try { localStorage.setItem(FOCUS_KEY, focus); } catch (_) { /* storage unavailable */ } }
  validateFocus();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* storage unavailable */ }
    if (cloudDoc) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { cloudDoc.set(clone(S)).catch(() => { cloudDoc = null; }); }, 600);
    }
  }
  save();

  function upNext(v) {
    const n = nowMin(), c = [];
    v.events.forEach((e) => {
      const st = toMin(e.start), en = toMin(e.end);
      if (en > n) c.push({ kind: 'event', title: e.title, at: st, end: en, project: e.project, location: e.location, ongoing: st <= n });
    });
    v.tasks.forEach((t) => {
      const d = toMin(t.due);
      if (!t.done && d != null && d >= n) c.push({ kind: 'task', title: t.title, at: d, project: t.project });
    });
    c.sort((a, b) => (a.ongoing ? -1 : 0) - (b.ongoing ? -1 : 0) || a.at - b.at);
    return c[0] || null;
  }

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
        <div class="ring-row"><span class="k">Habits</span><span class="v" style="color:var(--ring-3)">${st.habitsDone}/${st.habitsTotal}<small> closed</small></span>${big ? '<span class="s">Daily routines, across all projects</span>' : ''}</div>
      </div>
    </section>`;
  }

  function projectBar() {
    const open = (id) => S.tasks.filter((t) => !t.done && (id === 'all' || t.project === id)).length;
    const chip = (id, name, color, cc) => `<button class="pchip${id === 'all' ? ' all' : ''}" data-act="focus" data-id="${esc(id)}" aria-pressed="${focus === id}" style="--c:${color}">${id === 'all' ? '' : '<i aria-hidden="true"></i>'}<span>${esc(name)}</span>${cc ? '<em>Claude Code</em>' : ''}<b>${open(id)}</b></button>`
      + (id !== 'all' && focus === id ? `<button class="pchip edit" data-act="edit-project" aria-label="Edit ${esc(name)}">${ICON.more}</button>` : '');
    return `<nav class="pbar" aria-label="Projects">
      <div class="pbar-scroll">
        ${chip('all', 'All Projects', 'var(--label)')}
        ${S.projects.map((p) => chip(p.id, p.name, colorVar(p.color), p.source === 'claude')).join('')}
        <button class="pchip add" data-act="new-project">${ICON.plus}<span>New Project</span></button>
      </div>
    </nav>`;
  }

  function upNextCard(nx) {
    if (!nx) return `<section class="upnext empty"><span class="label">Up next</span><span class="title">You're clear</span><span class="meta">Nothing else is scheduled for today${focus === 'all' ? '' : ' in this project'}.</span></section>`;
    const n = nowMin(), mins = nx.at - n, P = projOf(nx.project);
    const when = nx.ongoing ? `Now · ends ${fmtTime(nx.end)}` : mins < 60 ? `In ${mins} min` : `In ${fmtDur(mins)}`;
    const meta = nx.kind === 'event'
      ? `${fmtTime(nx.at)} – ${fmtTime(nx.end)}${nx.location ? ` · ${esc(nx.location)}` : ''}`
      : `Due ${fmtTime(nx.at)}`;
    return `<section class="upnext" style="background-color:${colorVar(P.color)}">
      <span class="label">Up next · ${esc(P.name)}</span>
      <span class="title">${esc(nx.title)}</span>
      <span class="meta">${meta}</span>
      <span class="count">${when}</span>
    </section>`;
  }

  function scheduleCard(v) {
    const n = nowMin();
    const evs = [...v.events].sort((a, b) => toMin(a.start) - toMin(b.start));
    let rows = '', placed = false;
    const nowLine = `<li class="now-line" aria-label="Current time"><span>${fmtTime(n)}</span><i></i><b></b></li>`;
    evs.forEach((e) => {
      if (!placed && toMin(e.start) > n) { rows += nowLine; placed = true; }
      const past = toMin(e.end) <= n, P = projOf(e.project);
      rows += `<li class="event${past ? ' past' : ''}" data-act="edit-event" data-id="${e.id}" style="--c:${colorVar(P.color)}" tabindex="0" role="button" aria-label="Edit ${esc(e.title)}">
        <span class="times"><span>${fmtTime(toMin(e.start))}</span><span>${fmtTime(toMin(e.end))}</span></span>
        <span class="bar"></span>
        <span class="body"><span class="name">${esc(e.title)}</span><span class="where">${focus === 'all' ? esc(P.name) : ''}${focus === 'all' && e.location ? ' · ' : ''}${e.location ? esc(e.location) : ''}</span></span>
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

  function taskRow(t, opts = {}) {
    const P = projOf(t.project), n = nowMin(), d = toMin(t.due);
    const late = !t.done && d != null && d < n;
    const meta = [];
    if (t.done && t.doneAt != null) meta.push(`<span>Done ${fmtTime(t.doneAt)}</span>`);
    else if (d != null) meta.push(`<span class="${late ? 'late' : ''}">${late ? 'Overdue · ' : ''}${fmtTime(d)}</span>`);
    if (!opts.hideProject) meta.push(`<span class="lst">${esc(P.name)}</span>`);
    if (t.cc && CC_STATUS[t.cc]) meta.push(`<span class="status" style="--c:${colorVar(CC_STATUS[t.cc][1])}">${CC_STATUS[t.cc][0]}</span>`);
    if (t.est) meta.push(`<span>${fmtDur(t.est)}</span>`);
    if (t.carried && !t.done) meta.push('<span class="chip">Carried over</span>');
    return `<li class="task${t.done ? ' done' : ''}" data-id="${t.id}" style="--c:${colorVar(P.color)}">
      <button class="check" data-act="toggle" data-id="${t.id}" role="checkbox" aria-checked="${t.done}" aria-label="${t.done ? 'Mark not done' : 'Complete'}: ${esc(t.title)}"></button>
      <button class="task-body" data-act="edit-task" data-id="${t.id}">
        <span class="task-title">${t.pri && PRI[t.pri] ? `<span class="pri" aria-label="${t.pri} priority">${PRI[t.pri]}</span>` : ''}${esc(t.title)}</span>
        ${meta.length ? `<span class="task-meta">${meta.join('')}</span>` : ''}
      </button>
    </li>`;
  }

  // One task list per project, in project order.
  function projectLists(tasks, opts = {}) {
    return S.projects.map((p) => {
      const items = tasks.filter((t) => t.project === p.id);
      if (!items.length && !opts.showEmpty) return '';
      return `<div class="plist" style="--c:${colorVar(p.color)}">
        <h3 class="plist-head"><button data-act="focus" data-id="${esc(p.id)}" aria-label="Show only ${esc(p.name)}"><i aria-hidden="true"></i><span>${esc(p.name)}</span></button><b>${items.length}</b></h3>
        ${items.length ? `<ul class="list">${items.map((t) => taskRow(t, { hideProject: true })).join('')}</ul>` : '<p class="empty-note">Nothing open.</p>'}
      </div>`;
    }).join('');
  }

  function tasksCard(v) {
    const n = nowMin();
    const open = v.tasks.filter((t) => !t.done).sort(sortOpen);
    const done = v.tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
    const group = (label, items, cls = '') => items.length ? `<h3 class="section-label ${cls}">${label}</h3><ul class="list">${items.map((t) => taskRow(t, { hideProject: true })).join('')}</ul>` : '';
    let body;
    if (focus === 'all') {
      const withOpen = new Set(open.map((t) => t.project)).size;
      body = `<div class="widget-head"><h2 class="widget-title">Required Today</h2><span class="widget-sub">${open.length} open · ${plural(withOpen, 'project')}</span></div>
        ${open.length ? `<div class="plists">${projectLists(open)}</div>` : '<p class="empty-note">Nothing left to do across your projects.</p>'}`;
    } else {
      const P = projOf(focus);
      body = `<div class="widget-head"><h2 class="widget-title" style="color:${colorVar(P.color)}">${esc(P.name)}</h2><span class="widget-sub">${open.length} open</span></div>
        ${open.length ? '' : '<p class="empty-note">Nothing left to do in this project.</p>'}
        ${group('Overdue', open.filter((t) => t.due && toMin(t.due) < n), 'red')}
        ${group('Scheduled', open.filter((t) => t.due && toMin(t.due) >= n))}
        ${group('Anytime', open.filter((t) => !t.due))}`;
    }
    return `<section class="widget">
      ${body}
      ${done.length ? `<button class="disclose" data-act="show-done" aria-expanded="${showDone}">${showDone ? 'Hide' : 'Show'} completed (${done.length})</button>` : ''}
      ${showDone ? group('Completed', done) : ''}
      <button class="add-row" data-act="add">${ICON.plusCircle}New Reminder</button>
    </section>`;
  }

  function banner() {
    if (!S.example) return '';
    return `<div class="banner" role="note">
      <p>These are example projects and tasks so you can see how it works. Your changes are saved${cloudDoc ? ' to your Claude account' : ' in this browser'}.</p>
      <div class="actions">
        <button class="pill-btn" data-act="keep">Keep them</button>
        <button class="pill-btn ${clearArmed ? 'primary' : 'danger'}" data-act="clear">${clearArmed ? 'Tap again to clear' : 'Start fresh'}</button>
      </div>
    </div>`;
  }

  function scopeLabel() { return focus === 'all' ? '' : `<strong>${esc(projOf(focus).name)}:</strong> `; }

  // ---------- views ----------
  function viewToday() {
    const v = scoped(), st = stats(v), nx = upNext(v);
    const left = st.open ? `${plural(st.open, 'task')} left` : 'everything is done';
    const next = nx ? `, next up: <strong>${esc(nx.title)}</strong> ${nx.ongoing ? 'is happening now' : `at ${fmtTime(nx.at)}`}` : '';
    return `<section class="hero">
        <p class="eyebrow">${dateLong()}</p>
        <h1 class="large-title">Today</h1>
        <p class="lede">${greeting()} ${scopeLabel()}${left}${next}.</p>
      </section>
      ${projectBar()}
      ${banner()}
      <div class="grid">
        <div class="col">${ringsCard(st, false)}${upNextCard(nx)}${scheduleCard(v)}${habitsCard()}</div>
        <div class="col">${tasksCard(v)}</div>
      </div>`;
  }

  function narrative(st) {
    if (!st.total) return `${scopeLabel()}No tasks yet today. Add some on the Today tab and your progress shows up here.`;
    const pct = Math.round((st.done / st.total) * 100);
    let s = `${scopeLabel()}You've completed ${st.done} of ${plural(st.total, 'task')} (${pct}%), covering ${fmtDur(st.effortDone)} of ${fmtDur(st.effortAll)} planned work.`;
    if (st.high) s += st.highDone === st.high ? ' Every high-priority item is done.' : ` ${st.highDone} of ${st.high} high-priority items are done.`;
    if (focus === 'all') {
      const finished = S.projects.filter((p) => { const ts = S.tasks.filter((t) => t.project === p.id); return ts.length && ts.every((t) => t.done); });
      if (finished.length) s += ` ${finished.map((p) => esc(p.name)).join(', ')} ${finished.length === 1 ? 'is' : 'are'} fully done.`;
    }
    s += ` ${st.habitsDone} of ${st.habitsTotal} habits closed.`;
    return s;
  }

  function statTiles(st) {
    const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    const word = (n) => (n === 1 ? 'task' : 'tasks');
    const tile = (k, icon, color, v, unit, s) => `<div class="stat" style="--c:${color}"><span class="k">${icon}${k}</span><span class="v">${v}${unit ? `<small>${unit}</small>` : ''}</span><span class="s">${s}</span></div>`;
    return `<div class="stats">
      ${tile('Completed', ICON.check, 'var(--green)', st.done, word(st.done), `${fmtDur(st.effortDone)} of work`)}
      ${tile('Remaining', ICON.tray, 'var(--orange)', st.open, word(st.open), `${fmtDur(Math.max(0, st.effortAll - st.effortDone))} estimated`)}
      ${tile('Completion', ICON.percent, 'var(--blue)', pct, '%', st.high ? `${st.highDone}/${st.high} high priority` : 'No high-priority tasks')}
      ${tile('On time', ICON.clock, 'var(--purple)', st.onTime, `/ ${st.withDue}`, 'Finished before due time')}
    </div>`;
  }

  function doneCard(v) {
    const done = v.tasks.filter((t) => t.done).sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));
    const rows = done.map((t) => {
      const P = projOf(t.project);
      return `<li class="done-row"><time>${t.doneAt != null ? fmtTime(t.doneAt) : ''}</time><span class="tick" aria-hidden="true">${ICON.check}</span>
        <span><span class="t">${esc(t.title)}</span><br><span class="m"><span style="color:${colorVar(P.color)};font-weight:600">${esc(P.name)}</span>${t.est ? ` · ${fmtDur(t.est)}` : ''}</span></span></li>`;
    }).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Done Today</h2><span class="widget-sub">${done.length} finished</span></div>
      ${done.length ? `<ul class="list">${rows}</ul>` : '<p class="empty-note">Nothing completed yet. Tick off a task on the Today tab and it appears here.</p>'}
    </section>`;
  }

  function projectsCard() {
    const rows = S.projects.map((p) => {
      const items = S.tasks.filter((t) => t.project === p.id);
      const d = items.filter((t) => t.done).length;
      const pct = items.length ? (d / items.length) * 100 : 0;
      return `<button class="lrow${focus === p.id ? ' on' : ''}" data-act="focus" data-id="${esc(p.id)}" style="--c:${colorVar(p.color)}">
        <span class="top"><b>${esc(p.name)}</b><span>${items.length ? `${d} of ${items.length}` : 'No tasks'}</span></span>
        <span class="track"><i style="width:${pct}%"></i></span>
      </button>`;
    }).join('');
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">By Project</h2><span class="widget-sub">Tap to focus</span></div>
      <div class="lists">${rows}</div>
    </section>`;
  }

  function weekCard(st) {
    const pick = (h) => (focus === 'all' ? h.done : (h.byProject && h.byProject[focus] ? h.byProject[focus].done : 0));
    const days = S.history.slice(-6).map((h) => ({ date: h.date, done: pick(h), today: false }));
    days.push({ date: S.date, done: st.done, today: true });
    while (days.length < 7) days.unshift({ date: null, done: 0, today: false, blank: true });
    const real = days.filter((d) => !d.blank);
    const max = Math.max(...real.map((d) => d.done), 1);
    const top = Math.max(4, Math.ceil(max / 4) * 4);
    const avg = real.length ? sum(real, (d) => d.done) / real.length : 0;
    const y = (v) => 100 - (v / top) * 100;
    const label = (d) => (d.date ? new Date(`${d.date}T12:00:00`).toLocaleDateString([], { weekday: 'narrow' }) : '');
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

  function openCard(v) {
    const open = v.tasks.filter((t) => !t.done).sort(sortOpen);
    return `<section class="widget">
      <div class="widget-head"><h2 class="widget-title">Still Open</h2><span class="widget-sub">${open.length}</span></div>
      ${open.length
        ? `<p class="empty-note">Anything still open at midnight moves to tomorrow's list.</p>${focus === 'all' ? `<div class="plists">${projectLists(open)}</div>` : `<ul class="list">${open.map((t) => taskRow(t, { hideProject: true })).join('')}</ul>`}`
        : '<p class="empty-note">Nothing carries over to tomorrow.</p>'}
    </section>`;
  }

  function viewSummary() {
    const v = scoped(), st = stats(v);
    return `<section class="hero">
        <p class="eyebrow">${dateLong()}</p>
        <h1 class="large-title">Summary</h1>
        <p class="lede">${narrative(st)}</p>
      </section>
      ${projectBar()}
      ${banner()}
      <div class="grid">
        <div class="col">${ringsCard(st, true)}${statTiles(st)}${weekCard(st)}</div>
        <div class="col">${doneCard(v)}${projectsCard()}${openCard(v)}</div>
      </div>`;
  }

  // ---------- shell ----------
  const root = document.getElementById('app');
  root.innerHTML = `
    <header class="nav" id="nav"><div class="nav-inner"><span></span><span class="nav-title" id="navTitle"></span><span class="nav-right">
      <button class="icon-btn" data-act="import" id="syncBtn" aria-label="Sync Claude Code" hidden>${ICON.sync}</button>
      <button class="icon-btn" data-act="add" aria-label="New reminder">${ICON.plus}</button>
    </span></div></header>
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
        <div class="group"><label class="field"><span>Project</span><select id="fProject"></select></label></div>
        <div class="group" data-for="task">
          <div class="field"><span>Priority</span><div class="seg" id="priSeg">
            <button type="button" data-pri="" aria-pressed="true">None</button><button type="button" data-pri="low" aria-pressed="false">!</button><button type="button" data-pri="med" aria-pressed="false">!!</button><button type="button" data-pri="high" aria-pressed="false">!!!</button>
          </div></div>
          <label class="field"><span>Due time</span><input type="time" id="fDue"></label>
          <label class="field"><span>Estimate</span><select id="fEst"><option value="0">None</option>${ESTIMATES.map((m) => `<option value="${m}">${fmtDur(m)}</option>`).join('')}</select></label>
        </div>
        <div class="group" data-for="event" hidden>
          <label class="field"><span>Starts</span><input type="time" id="fStart"></label>
          <label class="field"><span>Ends</span><input type="time" id="fEnd"></label>
          <label class="field"><span>Location</span><input type="text" id="fLoc" placeholder="Optional" autocomplete="off"></label>
        </div>
        <div class="group" id="fSession" hidden><a class="field link-field" id="fOpen" href="#" target="_blank" rel="noopener">Open session in Claude Code<span aria-hidden="true">›</span></a></div>
        <button type="button" class="delete-btn" id="fDelete" hidden>Delete</button>
      </form>
    </div>
    <div class="sheet-backdrop" id="psheet" hidden>
      <form class="sheet" id="pForm" role="dialog" aria-modal="true" aria-labelledby="pTitle" novalidate>
        <span class="grabber" aria-hidden="true"></span>
        <div class="sheet-head"><button type="button" class="link-btn" data-act="pclose">Cancel</button><h2 id="pTitle">New Project</h2><button type="submit" class="link-btn strong" id="pSave">Add</button></div>
        <div class="group"><label class="field title-field"><input type="text" id="pName" placeholder="Project name" autocomplete="off" aria-label="Project name"></label></div>
        <div class="group swatch-group"><div class="swatches" id="pColors" role="radiogroup" aria-label="Colour">
          ${COLORS.map((c) => `<button type="button" class="swatch" data-color="${c}" role="radio" aria-checked="false" aria-label="${c}" style="--c:var(--${c})"></button>`).join('')}
        </div></div>
        <div class="group import-group" id="pImport">
          <div class="import-text"><b>Claude Code</b><span id="pImportNote"></span></div>
          <button type="button" class="pill-btn primary" data-act="import" id="pImportBtn">Import</button>
        </div>
        <button type="button" class="delete-btn" id="pDelete" hidden>Delete Project</button>
      </form>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"><span id="toastText"></span><button class="pill-btn" id="toastUndo" hidden>Undo</button></div>`;

  const $ = (id) => document.getElementById(id);
  const view = $('view'), nav = $('nav'), sheet = $('sheet'), form = $('sheetForm'), psheet = $('psheet'), pForm = $('pForm');
  const sheetsClosed = () => sheet.hidden && psheet.hidden;

  function render() {
    validateFocus();
    view.innerHTML = tab === 'today' ? viewToday() : viewSummary();
    $('navTitle').textContent = tab === 'today' ? 'Today' : 'Summary';
    $('syncBtn').hidden = !mcp || !S.projects.some((p) => p.source === 'claude');
    $('syncBtn').classList.toggle('spin', syncing);
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'));
    document.title = tab === 'today' ? 'Daybook · Today' : 'Daybook · Summary';
  }
  function commit() { save(); render(); }

  // Toast with optional undo
  let toastTimer = null, undoFn = null;
  function toast(msg, undo, ms = 3200) {
    $('toastText').textContent = msg;
    undoFn = undo || null;
    $('toastUndo').hidden = !undo;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), ms);
  }
  $('toastUndo').addEventListener('click', () => { if (undoFn) undoFn(); undoFn = null; $('toast').classList.remove('show'); });

  // ---------- task / event sheet ----------
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
    $('fProject').innerHTML = S.projects.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    const defaultProject = focus !== 'all' ? focus : S.projects[0].id;
    const n = nowMin(), nextHour = Math.min(23 * 60, Math.ceil((n + 1) / 60) * 60);
    let session = null;
    if (k === 'task') {
      const t = id ? S.tasks.find((x) => x.id === id) : null;
      $('fTitle').value = t ? t.title : '';
      $('fProject').value = t ? t.project : defaultProject;
      setPri(t ? (t.pri || '') : '');
      $('fDue').value = t && t.due ? t.due : '';
      $('fEst').value = String(t ? t.est || 0 : 15);
      session = t && t.sessionUrl;
    } else {
      const e = id ? S.events.find((x) => x.id === id) : null;
      $('fTitle').value = e ? e.title : '';
      $('fProject').value = e ? e.project : defaultProject;
      $('fStart').value = e ? e.start : toHHMM(nextHour);
      $('fEnd').value = e ? e.end : toHHMM(Math.min(nextHour + 30, 23 * 60 + 59));
      $('fLoc').value = e ? e.location || '' : '';
    }
    $('fSession').hidden = !session;
    if (session) $('fOpen').href = session;
    setKind(k);
    sheet.hidden = false;
    setTimeout(() => $('fTitle').focus(), 50);
  }
  function closeSheet() { sheet.hidden = true; editing = null; }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const title = $('fTitle').value.trim();
    if (!title) { $('fTitle').focus(); $('fTitle').placeholder = 'Add a title first'; return; }
    const project = $('fProject').value;
    if (kind === 'task') {
      const data = { title, project, pri: getPri(), due: $('fDue').value || null, est: Number($('fEst').value) };
      if (editing) Object.assign(S.tasks.find((x) => x.id === editing.id), data);
      else S.tasks.push({ id: uid(), done: false, doneAt: null, carried: false, ...data });
      toast(editing ? 'Reminder updated' : `Added to ${projOf(project).name}`);
    } else {
      const start = $('fStart').value || toHHMM(nowMin());
      let end = $('fEnd').value;
      if (!end || toMin(end) <= toMin(start)) end = toHHMM(Math.min(toMin(start) + 30, 23 * 60 + 59));
      const data = { title, project, start, end, location: $('fLoc').value.trim() };
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
    if (removed.sessionUrl) S.ccIgnored.push(removed.id); // don't re-import a session you removed
    closeSheet();
    commit();
    toast(`Deleted “${removed.title}”`, () => {
      arr.splice(idx, 0, removed);
      S.ccIgnored = S.ccIgnored.filter((x) => x !== removed.id);
      commit();
    });
  });

  form.addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-kind]'); if (k) setKind(k.dataset.kind);
    const p = ev.target.closest('[data-pri]'); if (p) setPri(p.dataset.pri);
  });

  // ---------- project sheet ----------
  let editingProject = null;
  let deleteArmed = false;
  function setColor(c) { pForm.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.color === c))); }
  const getColor = () => (pForm.querySelector('.swatch[aria-checked="true"]') || {}).dataset?.color || 'blue';
  function updateImportNote() {
    const note = !mcp
      ? 'Open Daybook in Claude to import your repos as projects and your sessions as tasks.'
      : S.lastSync
        ? `Last synced ${new Date(S.lastSync).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Sync again to pick up new sessions.`
        : 'Import your repos as projects and your sessions as tasks.';
    $('pImportNote').textContent = note;
    $('pImportBtn').hidden = !mcp;
    $('pImportBtn').textContent = syncing ? 'Importing…' : S.lastSync ? 'Sync' : 'Import';
    $('pImportBtn').disabled = syncing;
  }
  function openProjectSheet(id) {
    editingProject = id ? S.projects.find((p) => p.id === id) : null;
    deleteArmed = false;
    $('pTitle').textContent = editingProject ? 'Edit Project' : 'New Project';
    $('pSave').textContent = editingProject ? 'Done' : 'Add';
    $('pName').value = editingProject ? editingProject.name : '';
    const used = new Set(S.projects.map((p) => p.color));
    setColor(editingProject ? editingProject.color : (COLORS.find((c) => !used.has(c)) || 'blue'));
    $('pDelete').hidden = !editingProject || S.projects.length < 2;
    $('pDelete').textContent = 'Delete Project';
    $('pImport').hidden = !!editingProject;
    updateImportNote();
    psheet.hidden = false;
    setTimeout(() => $('pName').focus(), 50);
  }
  function closeProjectSheet() { psheet.hidden = true; editingProject = null; }

  pForm.addEventListener('click', (ev) => { const s = ev.target.closest('.swatch'); if (s) setColor(s.dataset.color); });
  pForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('pName').value.trim();
    if (!name) { $('pName').focus(); $('pName').placeholder = 'Name the project first'; return; }
    if (editingProject) {
      Object.assign(editingProject, { name, color: getColor() });
      toast('Project updated');
    } else {
      const p = { id: uid(), name, color: getColor(), source: 'manual' };
      S.projects.push(p);
      setFocus(p.id);
      toast(`Created ${name}`);
    }
    closeProjectSheet();
    commit();
  });
  $('pDelete').addEventListener('click', () => {
    if (!editingProject) return;
    const p = editingProject, count = S.tasks.filter((t) => t.project === p.id).length;
    if (!deleteArmed) { deleteArmed = true; $('pDelete').textContent = count ? `Delete project and its ${plural(count, 'task')}?` : 'Tap again to delete'; return; }
    const snapshot = clone({ projects: S.projects, tasks: S.tasks, events: S.events });
    S.projects = S.projects.filter((x) => x.id !== p.id);
    S.tasks = S.tasks.filter((t) => t.project !== p.id);
    S.events = S.events.filter((e) => e.project !== p.id);
    setFocus('all');
    closeProjectSheet();
    commit();
    toast(`Deleted ${p.name}`, () => { Object.assign(S, snapshot); commit(); }, 5000);
  });

  sheet.addEventListener('click', (ev) => { if (ev.target === sheet) closeSheet(); });
  psheet.addEventListener('click', (ev) => { if (ev.target === psheet) closeProjectSheet(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') { if (!sheet.hidden) closeSheet(); if (!psheet.hidden) closeProjectSheet(); }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.event[role="button"]')) { ev.preventDefault(); ev.target.click(); }
  });

  // ---------- Claude Code import ----------
  function ccBucket(s) {
    const b = String(s.status_bucket || '').toLowerCase();
    return Object.keys(CC_STATUS).find((k) => b.includes(k)) || null;
  }
  function sessionRepo(s) {
    const c = s.session_context || {};
    const out = (c.outcomes || []).find((x) => x && x.git_repository && x.git_repository.git_info && x.git_repository.git_info.repo);
    if (out) return out.git_repository.git_info.repo;
    const src = (c.sources || []).find((x) => x && x.git_repository && x.git_repository.url);
    const m = src && src.git_repository.url.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/);
    return m ? m[1] : null;
  }
  function ccErrorText(e) {
    switch (e && e.code) {
      case 'server_not_connected':
      case 'server_not_found': return 'Add the Claude Code Remote connector in claude.ai Settings → Connectors, then try again.';
      case 'needs_reauth': return 'Reconnect Claude Code Remote in claude.ai Settings → Connectors, then try again.';
      case 'approval_required':
      case 'consent_required':
      case 'not_in_manifest': return 'Daybook needs your permission to read Claude Code. Tap Import again and choose Allow.';
      case 'selection_required': return 'Pick which Claude Code connector to use in the prompt, then try again.';
      case 'blocked_by_policy': return 'Your organisation blocks this connector for you.';
      case 'server_unavailable':
      case 'rate_limited': return "Claude Code didn't answer. Try again in a moment.";
      case 'not_granted':
      case 'capability_disabled':
      case 'capability_removed': return "Importing isn't available in this view of Daybook.";
      case 'tool_error': return 'Claude Code reported a problem with the request. Try again later.';
      default: return 'The import did not finish. Try again.';
    }
  }

  async function importClaude(quiet) {
    if (!mcp || syncing) return;
    syncing = true; render(); updateImportNote();
    try {
      const [r, s] = await Promise.all([
        mcp.callTool(CC_SERVER, 'list_repos', { limit: 200 }),
        mcp.callTool(CC_SERVER, 'list_sessions', { limit: 100 }),
      ]);
      const rp = r.payload || {}, sp = s.payload || {};
      const repos = Array.isArray(rp.repos) ? rp.repos : [];
      const sessions = (sp.ccr && Array.isArray(sp.ccr.data) && sp.ccr.data) || (Array.isArray(sp.data) && sp.data) || (Array.isArray(sp.sessions) && sp.sessions) || [];
      let newProjects = 0, newTasks = 0, finished = 0;
      const ensureProject = (repo) => {
        const id = repo ? `cc:${repo}` : 'cc:_general';
        let p = S.projects.find((x) => x.id === id);
        if (!p) {
          const used = new Set(S.projects.map((x) => x.color));
          p = { id, name: repo ? repo.split('/').pop() : 'Claude Code', color: COLORS.find((c) => !used.has(c)) || COLORS[S.projects.length % COLORS.length], source: 'claude', repo: repo || null };
          S.projects.push(p); newProjects++;
        }
        return p;
      };
      repos.forEach((x) => { if (x && x.full_name) ensureProject(x.full_name); });
      sessions.forEach((x) => {
        if (!x || !x.id) return;
        const id = `cc:${x.id}`;
        if (S.ccIgnored.includes(id)) return;
        const bucket = ccBucket(x);
        const t = S.tasks.find((y) => y.id === id);
        if (t) {
          if (x.title) t.title = x.title;
          t.cc = bucket;
          if (bucket === 'completed' && !t.done) { t.done = true; t.doneAt = nowMin(); finished++; }
          return;
        }
        if (bucket === 'completed') return; // already finished before it reached Daybook
        const p = ensureProject(sessionRepo(x));
        S.tasks.push({ id, title: x.title || 'Untitled session', project: p.id, pri: '', due: null, est: 0, done: false, doneAt: null, carried: false, cc: bucket, sessionUrl: `https://claude.ai/code/${encodeURIComponent(x.id)}` });
        newTasks++;
      });
      S.lastSync = Date.now();
      save();
      if (!quiet || newProjects || newTasks || finished) {
        const parts = [];
        if (newProjects) parts.push(plural(newProjects, 'project'));
        if (newTasks) parts.push(plural(newTasks, 'session'));
        toast(parts.length ? `Imported ${parts.join(' and ')} from Claude Code` : finished ? `${plural(finished, 'session')} finished in Claude Code` : 'Claude Code projects are up to date');
      }
      if (!psheet.hidden && !editingProject) closeProjectSheet();
    } catch (e) {
      if (!quiet) toast(ccErrorText(e), null, 7000);
    } finally {
      syncing = false;
      if (sheetsClosed()) render(); else { render(); updateImportNote(); }
    }
  }

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
    if (!el) return;
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case 'close': closeSheet(); break;
      case 'pclose': closeProjectSheet(); break;
      case 'add': openSheet('task'); break;
      case 'edit-task': openSheet('task', id); break;
      case 'edit-event': openSheet('event', id); break;
      case 'new-project': openProjectSheet(); break;
      case 'edit-project': if (focus !== 'all') openProjectSheet(focus); break;
      case 'import': importClaude(false); break;
      case 'focus': {
        setFocus(focus === id && id !== 'all' ? 'all' : id);
        showDone = false;
        render();
        const on = view.querySelector('.pchip[aria-pressed="true"]');
        if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        break;
      }
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
        S = freshState();
        setFocus('all');
        commit();
        toast('Cleared. Add a project or your first reminder with +');
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
    if (!sheetsClosed()) return;
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

  // ---------- Claude runtime (only when opened inside Claude) ----------
  // Saves your data to your own private space in this artifact so it follows you across devices.
  async function connectCloud() {
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const me = await user.id();
      if (!me) return;
      const ref = db.doc(`data/users/${me}/daybook`);
      let first = true;
      ref.onSnapshot((snap) => {
        if (snap.metadata && snap.metadata.hasPendingWrites) return;
        if (snap.exists) {
          const data = snap.data();
          if (data && Array.isArray(data.tasks) && JSON.stringify(data) !== JSON.stringify(S)) {
            const before = data.date;
            S = rollover(migrate(clone(data)));
            try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { /* storage unavailable */ }
            if (S.date !== before) save();
            if (sheetsClosed()) render();
          }
        } else if (first) {
          ref.set(clone(S)).catch(() => { cloudDoc = null; });
        }
        first = false;
      }, () => { cloudDoc = null; });
      cloudDoc = ref;
      if (sheetsClosed()) render();
    } catch (_) { cloudDoc = null; }
  }

  async function connectClaudeCode() {
    try {
      mcp = await window.claude.use('mcp');
    } catch (_) { mcp = null; }
    if (!mcp) return;
    if (sheetsClosed()) render();
    if (!psheet.hidden) updateImportNote();
    if (S.lastSync) importClaude(true); // refresh quietly once you've imported before
  }

  if (window.claude && typeof window.claude.use === 'function') {
    connectCloud();
    connectClaudeCode();
  }
})();
