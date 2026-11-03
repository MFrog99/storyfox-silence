/* StoryFox Silence — интерфейс. */
const App = (() => {
  const VERSION = '1.0.0';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = $('#view');

  // ------------------------------------------------------------ иконки
  const P = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    close: '<path d="M18 6L6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    up: '<path d="M18 15l-6-6-6 6"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    next: '<path d="M5 4l10 8-10 8zM19 5v14"/>',
    prev: '<path d="M19 20L9 12l10-8zM5 19V5"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    link: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24">${P[name]}</svg>`;
  const playSvg = '<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M8 5v14l11-7z"/></svg>';
  const pauseSvg = '<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
  const GLYPH = {
    breath: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
    mind: '<circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>',
    relax: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16"/><path d="M4 21c4-4 7-7 11-11"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    sleep: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    focus: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };
  const glyph = (cat) => `<svg viewBox="0 0 24 24">${GLYPH[cat]}</svg>`;
  const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
  const techById = (id) => TECHNIQUES.find((t) => t.id === id);
  const catStyle = (c) => `--c:${c.color};--c-deep:${c.deep}`;
  const STAT_ICONS = {
    flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16"/><path d="M4 21c4-4 7-7 11-11"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  };
  const stat = (ic, color, v, l) => `<div class="stat" style="--c:${color}"><span class="ic"><svg viewBox="0 0 24 24">${STAT_ICONS[ic]}</svg></span><div><div class="v">${v}</div><div class="l">${l}</div></div></div>`;

  function applyTheme() {
    const t = S.settings.theme;
    const dark = t === 'system' ? !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) : t !== 'light';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    Native.setTheme(dark);
  }
  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => applyTheme());

  // ------------------------------------------------------------ состояние
  const DEFAULT_SETTINGS = {
    voice: true, bells: true, cues: true, phaseVoice: false, interval: 0,
    ambient: 'none', ambientVol: 0.45, musicVol: 0.6, shuffle: true, theme: 'dark',
  };
  const S = {
    settings: { ...DEFAULT_SETTINGS },
    collections: [{ id: 'default', name: 'Моя музыка', tracks: [] }],
    history: [],
    favorites: [],
    prefs: {}, // настройки по технике: { [id]: { minutes, ambient, coll } }
    account: null,
    tab: 'practices',
    route: null,
    filter: 'all',
    musicTab: 'search',
    activeColl: 'default',
    search: { q: '', results: null, loading: false },
    likes: null,
    playlists: null,
    openPlaylist: null,
  };

  const save = (key) => Native.call('store_set', key, S[key]).catch((e) => console.warn('save', key, e));

  // ------------------------------------------------------------ утилиты
  function toast(text, ms = 2600) {
    const t = $('#toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  function modal(html, onMount) {
    const m = $('#modal');
    m.innerHTML = `<div class="box">${html}</div>`;
    m.hidden = false;
    const close = () => { m.hidden = true; m.innerHTML = ''; };
    m.onclick = (e) => { if (e.target === m) close(); };
    if (onMount) onMount(m, close);
    return close;
  }

  function prompt(title, value = '') {
    return new Promise((resolve) => {
      modal(`<h3>${esc(title)}</h3><input class="input" id="pi" value="${esc(value)}" maxlength="40">
        <div class="acts"><button class="btn ghost" data-a="no">Отмена</button><button class="btn primary" data-a="ok">Сохранить</button></div>`,
      (m, close) => {
        const inp = $('#pi', m);
        inp.focus(); inp.select();
        const ok = () => { const v = inp.value.trim(); close(); resolve(v || null); };
        inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
        $('[data-a=ok]', m).onclick = ok;
        $('[data-a=no]', m).onclick = () => { close(); resolve(null); };
      });
    });
  }

  function confirmBox(title, text, okLabel = 'Да') {
    return new Promise((resolve) => {
      modal(`<h3>${esc(title)}</h3><p style="color:var(--muted)">${esc(text)}</p>
        <div class="acts"><button class="btn ghost" data-a="no">Отмена</button><button class="btn primary" data-a="ok">${esc(okLabel)}</button></div>`,
      (m, close) => {
        $('[data-a=ok]', m).onclick = () => { close(); resolve(true); };
        $('[data-a=no]', m).onclick = () => { close(); resolve(false); };
      });
    });
  }

  const fmtDur = (ms) => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const fmtClock = (sec) => { sec = Math.max(0, Math.ceil(sec)); const m = Math.floor(sec / 60); return `${String(m).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };

  function computeStats() {
    const byDay = {};
    let minutes = 0;
    S.history.forEach((h) => { byDay[h.day] = (byDay[h.day] || 0) + h.minutes; minutes += h.minutes; });
    let streak = 0;
    const d = new Date();
    if (!byDay[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (byDay[dayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    const days = Object.keys(byDay).sort();
    let best = 0, run = 0, prev = null;
    days.forEach((k) => {
      const cur = new Date(k + 'T12:00:00');
      run = prev && (cur - prev) / 86400000 === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = cur;
    });
    return { byDay, minutes: Math.round(minutes), sessions: S.history.length, streak, best };
  }

  function coll(id) { return S.collections.find((c) => c.id === id); }
  function inColl(c, trackId) { return c && c.tracks.some((t) => t.id === trackId); }

  // ------------------------------------------------------------ навигация
  function setTab(tab) {
    S.tab = tab;
    S.route = null;
    $$('#nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    render();
    view.scrollTop = 0;
  }

  function go(route) {
    S.route = route;
    render();
    view.scrollTop = 0;
  }

  function render() {
    if (S.route && S.route.name === 'detail') return renderDetail(techById(S.route.id));
    ({ practices: renderPractices, music: renderMusic, progress: renderProgress, settings: renderSettings })[S.tab]();
  }

  /* Кнопка «назад» на Android. Возвращает true, если событие обработано. */
  function back() {
    if (!$('#modal').hidden) { $('#modal').hidden = true; return true; }
    if (Session.active()) { Session.requestExit(); return true; }
    if (S.route) { S.route = null; render(); return true; }
    if (S.tab === 'music' && S.openPlaylist) { S.openPlaylist = null; render(); return true; }
    if (S.tab !== 'practices') { setTab('practices'); return true; }
    return false;
  }

  // ------------------------------------------------------------ практики
  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  function dailyTechnique() {
    const h = new Date().getHours();
    const pool = h >= 21 || h < 5 ? TECHNIQUES.filter((t) => t.category === 'sleep' || t.category === 'relax')
      : h < 11 ? TECHNIQUES.filter((t) => t.category === 'breath' || t.category === 'focus')
        : TECHNIQUES.filter((t) => t.category !== 'sleep');
    const n = Math.floor(Date.now() / 86400000);
    return pool[n % pool.length];
  }

  function tcard(t) {
    const c = catOf(t.category);
    const fav = S.favorites.includes(t.id);
    const mins = (S.prefs[t.id] && S.prefs[t.id].minutes) || t.minutes;
    return `<button class="tcard" style="${catStyle(c)}" data-tech="${t.id}">
      <div class="glyph">${glyph(t.category)}</div>
      <div><h3>${esc(t.title)}</h3><p>${esc(t.short)}</p>
      <div class="meta"><span class="tag">${mins} мин</span><span class="tag" style="--c:var(--faint)">${esc(t.level)}</span></div></div>
      ${fav ? `<span class="fav">${icon('star')}</span>` : ''}</button>`;
  }

  function renderPractices() {
    const st = computeStats();
    const daily = dailyTechnique();
    const list = S.filter === 'all' ? TECHNIQUES
      : S.filter === 'fav' ? TECHNIQUES.filter((t) => S.favorites.includes(t.id))
        : TECHNIQUES.filter((t) => t.category === S.filter);
    view.innerHTML = `<div class="page">
      <div class="hero"><div class="eyebrow">${greeting()}</div><h1>Найдите свою тишину</h1></div>
      <div class="daily" data-tech="${daily.id}" style="${catStyle(catOf(daily.category))}">
        <div class="orb-mini"></div>
        <div><div class="label">Практика дня</div><h2>${esc(daily.title)}</h2><p>${esc(daily.short)} · ${daily.minutes} мин</p></div>
      </div>
      <div class="stats-row">
        ${stat('flame', 'var(--sand)', st.streak, plural(st.streak, 'день', 'дня', 'дней') + ' подряд')}
        ${stat('clock', 'var(--sage)', st.minutes, 'минут всего')}
        ${stat('leaf', 'var(--lavender)', st.sessions, plural(st.sessions, 'сессия', 'сессии', 'сессий'))}
      </div>
      <div class="section-title"><h2>Техники</h2><span class="hint">${TECHNIQUES.length} практик</span></div>
      <div class="chips" style="margin-bottom:14px">
        <button class="chip ${S.filter === 'all' ? 'active' : ''}" data-f="all">Все</button>
        <button class="chip ${S.filter === 'fav' ? 'active' : ''}" data-f="fav">Избранное</button>
        ${CATEGORIES.map((c) => `<button class="chip ${S.filter === c.id ? 'active' : ''}" data-f="${c.id}">${c.title}</button>`).join('')}
      </div>
      <div class="grid">${list.map(tcard).join('') || '<div class="empty"><b>Пока пусто</b>Отмечайте техники звёздочкой, чтобы они появились здесь</div>'}</div>
    </div>`;
    $$('[data-tech]', view).forEach((el) => { el.onclick = () => go({ name: 'detail', id: el.dataset.tech }); });
    $$('[data-f]', view).forEach((el) => { el.onclick = () => { S.filter = el.dataset.f; renderPractices(); }; });
  }

  // ------------------------------------------------------------ детали техники
  function renderDetail(t) {
    const c = catOf(t.category);
    const pref = S.prefs[t.id] || {};
    const minutes = pref.minutes || t.minutes;
    const ambient = pref.ambient || S.settings.ambient;
    const collId = pref.coll === undefined ? (S.collections[0].tracks.length ? S.collections[0].id : '') : pref.coll;
    const durations = Array.from(new Set([3, 5, 10, 15, 20, 30, 45, 60, t.minutes])).sort((a, b) => a - b);
    const fav = S.favorites.includes(t.id);
    const pattern = t.phases ? t.phases.map((p) => p.sec).join('-') : t.type === 'timer' ? 'без подсказок' : 'с голосом';

    view.innerHTML = `<div class="page" style="${catStyle(c)}">
      <div class="detail-head">
        <button class="icon-btn" id="back">${icon('back')}</button><div class="spacer"></div>
        <button class="icon-btn" id="fav" title="В избранное" style="${fav ? 'color:var(--sand)' : ''}">${icon('star')}</button>
      </div>
      <div class="detail">
        <div>
          <div class="d-hero">
            <div class="glyph">${glyph(t.category)}</div>
            <h1>${esc(t.title)}</h1>
            <div class="sub">${esc(t.short)}</div>
            <p class="desc">${esc(t.description)}</p>
            <div class="tags"><span class="tag">${esc(c.title)}</span><span class="tag" style="--c:var(--lavender)">${esc(pattern)}</span><span class="tag" style="--c:var(--sand)">${esc(t.level)}</span></div>
          </div>
          <div class="card how-card"><h3>Как выполнять</h3>
            <ul class="how">${t.how.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
        </div>
        <div class="card setup">
          <div class="row"><label class="t">Длительность, минут</label>
            <div class="seg" id="dur">${durations.map((d) => `<button data-v="${d}" class="${d === minutes ? 'active' : ''}">${d}</button>`).join('')}</div></div>
          <div class="row"><label class="t">Звуки природы</label>
            <select class="select" id="amb">${Sound.AMBIENTS.map((a) => `<option value="${a.id}" ${a.id === ambient ? 'selected' : ''}>${a.title}</option>`).join('')}</select></div>
          <div class="row"><label class="t">Музыка из Яндекс Музыки</label>
            <select class="select" id="coll"><option value="">Без музыки</option>
            ${S.collections.map((cl) => `<option value="${cl.id}" ${cl.id === collId ? 'selected' : ''} ${cl.tracks.length ? '' : 'disabled'}>${esc(cl.name)} (${cl.tracks.length})</option>`).join('')}</select>
            ${S.collections.every((cl) => !cl.tracks.length) ? '<p style="color:var(--faint);font-size:13px;margin-top:8px">Добавьте треки во вкладке «Музыка»</p>' : ''}</div>
          <button class="btn primary big" id="start">${playSvg} Начать</button>
        </div>
      </div></div>`;

    const savePref = (patch) => { S.prefs[t.id] = { ...(S.prefs[t.id] || {}), ...patch }; save('prefs'); };
    $('#back').onclick = () => go(null);
    $('#fav').onclick = () => {
      S.favorites = fav ? S.favorites.filter((x) => x !== t.id) : [...S.favorites, t.id];
      save('favorites');
      renderDetail(t);
    };
    $$('#dur button').forEach((b) => { b.onclick = () => { savePref({ minutes: +b.dataset.v }); $$('#dur button').forEach((x) => x.classList.toggle('active', x === b)); }; });
    $('#amb').onchange = (e) => savePref({ ambient: e.target.value });
    $('#coll').onchange = (e) => savePref({ coll: e.target.value });
    $('#start').onclick = () => {
      Sound.unlock();
      Music.stop(300);
      const p = S.prefs[t.id] || {};
      Session.start(t, {
        minutes: p.minutes || minutes,
        ambient: $('#amb').value,
        coll: $('#coll').value,
      });
    };
  }

  // ------------------------------------------------------------ сессия
  const Session = (() => {
    let s = null;
    const el = $('#session');

    function start(t, opts) {
      const total = opts.minutes * 60;
      const c = coll(opts.coll);
      s = {
        t, total, elapsed: 0, running: true, last: performance.now(),
        phaseIdx: -1, phaseStart: 0, cycleLen: t.phases ? t.phases.reduce((a, p) => a + p.sec, 0) : 0,
        events: buildEvents(t, total), nextEvent: 0, ambient: opts.ambient,
        tracks: c ? c.tracks.filter((x) => x.available !== false) : [],
        finished: false,
      };
      el.hidden = false;
      el.setAttribute('style', catStyle(catOf(t.category)));
      document.body.classList.add('in-session');
      Native.keepAwake(true);
      drawStage();
      if (S.settings.bells) Sound.bell(0.7);
      Sound.startAmbient(opts.ambient, S.settings.ambientVol);
      if (s.tracks.length) Music.play(s.tracks, { shuffle: S.settings.shuffle, volume: S.settings.musicVol });
      s.unsub = Music.subscribe(updateNowPlaying);
      s.timer = setInterval(tick, 200);
      tick();
    }

    /* Расписание голосовых подсказок и колоколов. */
    function buildEvents(t, total) {
      const ev = [];
      if (t.intro) ev.push({ at: 3, text: t.intro, speak: true });
      if (t.steps && t.steps.length) {
        const pad = Math.min(30, total * 0.1) + 8;
        const outroPad = t.outro ? Math.max(25, total * 0.08) : 10;
        const span = Math.max(10, total - pad - outroPad);
        t.steps.forEach((text, i) => ev.push({ at: pad + (span * i) / t.steps.length, text, speak: true }));
      }
      if (t.outro) ev.push({ at: Math.max(total - 22, total * 0.85), text: t.outro, speak: true });
      if (t.type === 'timer' && S.settings.interval) {
        for (let m = S.settings.interval * 60; m < total - 5; m += S.settings.interval * 60) ev.push({ at: m, bell: true });
      }
      return ev.sort((a, b) => a.at - b.at);
    }

    function drawStage() {
      const t = s.t;
      const r = 44;
      el.innerHTML = `
        <div class="s-top">
          <button class="icon-btn" id="s-close">${icon('close')}</button>
          <div class="title"><b>${esc(t.title)}</b><span>${esc(catOf(t.category).title)} · ${Math.round(s.total / 60)} мин</span></div>
          <button class="icon-btn" id="s-mixbtn" title="Звук">${icon('music')}</button>
        </div>
        <div class="s-stage">
          <div class="orb-wrap">
            <svg class="orb-ring" viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="${r}"/><circle class="prog" cx="50" cy="50" r="${r}" stroke-dasharray="${2 * Math.PI * r}" stroke-dashoffset="${2 * Math.PI * r}"/></svg>
            <div class="orb-scale ${t.phases ? '' : t.id === 'candle' ? 'focus' : 'idle'}" id="orb"><span class="halo"></span><span class="halo"></span><span class="halo"></span><div class="orb"></div></div>
            <div class="orb-text"><div class="phase" id="phase"></div><div class="count" id="pcount"></div></div>
          </div>
          <div class="s-time" id="s-time">${fmtClock(s.total)}</div>
          <div class="s-prompt" id="s-prompt"></div>
          <div class="s-controls">
            <button class="icon-btn" id="s-restart" title="Сначала"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg></button>
            <button class="main" id="s-play">${pauseSvg}</button>
            <button class="icon-btn" id="s-next" title="Следующий трек" ${s.tracks.length ? '' : 'style="visibility:hidden"'}>${icon('next')}</button>
          </div>
          <div class="s-now" id="s-now"></div>
          <div class="s-mix" id="s-mix">
            ${s.ambient && s.ambient !== 'none' ? `<div class="mrow"><span>Природа</span><input type="range" class="range" id="v-amb" min="0" max="1" step="0.01" value="${S.settings.ambientVol}"></div>` : ''}
            ${s.tracks.length ? `<div class="mrow"><span>Музыка</span><input type="range" class="range" id="v-mus" min="0" max="1" step="0.01" value="${S.settings.musicVol}"></div>` : ''}
          </div>
        </div>`;
      $('#s-close').onclick = requestExit;
      $('#s-play').onclick = togglePause;
      $('#s-restart').onclick = () => {
        Native.stopSpeech();
        s.elapsed = 0;
        s.nextEvent = 0;
        s.phaseIdx = -1;
        $('#s-prompt').textContent = '';
        if (!s.running) togglePause();
        if (S.settings.bells) Sound.bell(0.6);
      };
      $('#s-next').onclick = () => Music.next();
      $('#s-mixbtn').onclick = () => { const m = $('#s-mix'); m.style.display = m.style.display === 'grid' ? 'none' : 'grid'; };
      const va = $('#v-amb');
      if (va) va.oninput = () => { S.settings.ambientVol = +va.value; Sound.setAmbientVolume(+va.value); save('settings'); };
      const vm = $('#v-mus');
      if (vm) vm.oninput = () => { S.settings.musicVol = +vm.value; Music.setVolume(+vm.value); save('settings'); };
      if (!s.ambient || s.ambient === 'none') { if (!s.tracks.length) $('#s-mixbtn').style.visibility = 'hidden'; }
      updateNowPlaying(Music.state());
    }

    function updateNowPlaying(st) {
      const n = $('#s-now');
      if (!n || !s) return;
      n.textContent = st.track ? `♪ ${st.track.title}${st.track.artists ? ' — ' + st.track.artists : ''}${st.track.preview ? ' (фрагмент)' : ''}` : '';
    }

    function tick() {
      if (!s || !s.running) return;
      const now = performance.now();
      s.elapsed += (now - s.last) / 1000;
      s.last = now;
      const remaining = s.total - s.elapsed;
      const timeEl = $('#s-time');
      if (timeEl) timeEl.textContent = fmtClock(remaining);
      const ring = $('.orb-ring .prog');
      if (ring) { const len = 2 * Math.PI * 44; ring.style.strokeDashoffset = len * (1 - Math.min(1, s.elapsed / s.total)); }

      while (s.nextEvent < s.events.length && s.events[s.nextEvent].at <= s.elapsed) {
        const e = s.events[s.nextEvent++];
        if (e.bell && S.settings.bells) Sound.bell(0.5, 294);
        if (e.text) showPrompt(e.text, e.speak);
      }
      if (s.t.phases) breathTick();
      if (remaining <= 0) finish();
    }

    function showPrompt(text, speak) {
      const p = $('#s-prompt');
      if (!p) return;
      p.style.opacity = 0;
      setTimeout(() => { p.textContent = text; p.style.opacity = 1; }, 400);
      if (speak && S.settings.voice) Native.speak(text);
    }

    function breathTick() {
      const t = s.t;
      // первые 2 секунды — подготовка
      const lead = 2;
      if (s.elapsed < lead) { $('#phase').textContent = 'Приготовьтесь'; return; }
      const pos = (s.elapsed - lead) % s.cycleLen;
      let acc = 0, idx = 0;
      for (; idx < t.phases.length; idx++) { if (pos < acc + t.phases[idx].sec) break; acc += t.phases[idx].sec; }
      idx = Math.min(idx, t.phases.length - 1);
      const ph = t.phases[idx];
      const left = acc + ph.sec - pos;
      const cycleNo = Math.floor((s.elapsed - lead) / s.cycleLen);
      const key = cycleNo * 100 + idx;
      if (key !== s.phaseIdx) {
        s.phaseIdx = key;
        setPhase(ph, left);
      }
      $('#pcount').textContent = Math.ceil(left);
    }

    function setPhase(ph, dur) {
      const orb = $('#orb');
      const label = ph.label || PHASE_LABEL[ph.kind];
      $('#phase').textContent = label;
      if (ph.kind === 'in' || ph.kind === 'out') {
        orb.style.transitionDuration = dur + 's';
        orb.style.transform = ph.kind === 'in' ? 'scale(1)' : 'scale(.62)';
      }
      if (S.settings.cues) Sound.cue(ph.kind);
      if (S.settings.phaseVoice && S.settings.voice) Native.speak(label);
    }

    function togglePause() {
      if (!s || s.finished) return;
      s.running = !s.running;
      const orb = $('#orb');
      if (!s.running) {
        const cur = getComputedStyle(orb).transform;
        orb.style.transitionDuration = '0s';
        orb.style.transform = cur;
        orb.style.animationPlayState = 'paused';
        Music.pause();
        Native.stopSpeech();
        $('#s-play').innerHTML = playSvg;
      } else {
        s.last = performance.now();
        s.phaseIdx = -1; // заново запустить анимацию текущей фазы
        orb.style.animationPlayState = '';
        if (s.tracks.length) Music.resume();
        $('#s-play').innerHTML = pauseSvg;
      }
    }

    function record(minutes) {
      if (minutes < 1) return null;
      const entry = { id: s.t.id, day: dayKey(), ts: Date.now(), minutes: Math.round(minutes * 10) / 10 };
      S.history.push(entry);
      if (S.history.length > 2000) S.history = S.history.slice(-2000);
      save('history');
      return entry;
    }

    function finish() {
      if (s.finished) return;
      s.finished = true;
      s.running = false;
      clearInterval(s.timer);
      if (S.settings.bells) { Sound.bell(0.8); setTimeout(() => Sound.bell(0.6), 2800); }
      if (s.t.outroQuiet) { /* для сна оставляем фон затухать медленнее */ }
      Sound.stopAmbient(s.t.outroQuiet ? 20 : 6);
      Music.stop(s.t.outroQuiet ? 20000 : 6000);
      const entry = record(s.total / 60);
      const st = computeStats();
      const t = s.t;
      el.innerHTML = `<div class="s-top"><div class="title"></div><button class="icon-btn" id="s-x">${icon('close')}</button></div>
        <div class="s-stage"><div class="done">
          <div class="big">${Math.round(s.total / 60)}<span style="font-size:22px;color:var(--muted)"> мин</span></div>
          <h2>Практика завершена</h2>
          <p>${esc(t.title)} · ${st.streak} ${plural(st.streak, 'день', 'дня', 'дней')} подряд</p>
          <p style="margin-top:22px">Как вы себя чувствуете?</p>
          <div class="moods">${['Тяжело', 'Так себе', 'Норм', 'Хорошо', 'Отлично'].map((m, i) => `<button data-m="${i + 1}" >${m}</button>`).join('')}</div>
          <button class="btn primary big" id="s-done">Готово</button>
        </div></div>`;
      $$('[data-m]', el).forEach((b) => {
        b.onclick = () => {
          $$('[data-m]', el).forEach((x) => x.classList.toggle('active', x === b));
          if (entry) { entry.mood = +b.dataset.m; save('history'); }
        };
      });
      $('#s-done').onclick = () => close();
      $('#s-x').onclick = () => close();
    }

    async function requestExit() {
      if (!s) return;
      if (s.finished) { close(); return; }
      const wasRunning = s.running;
      if (wasRunning) togglePause();
      const ok = await confirmBox('Завершить практику?', s.elapsed >= 60 ? `Пройдено ${Math.floor(s.elapsed / 60)} мин — они будут засчитаны.` : 'Менее минуты не засчитывается в статистику.', 'Завершить');
      if (!s) return;
      if (ok) {
        record(s.elapsed / 60);
        Sound.stopAmbient(1.5);
        Music.stop(1500);
        close();
      } else if (wasRunning) togglePause();
    }

    function cleanup(stopAudio = true) {
      if (!s) return;
      clearInterval(s.timer);
      if (s.unsub) s.unsub();
      Native.stopSpeech();
      if (stopAudio) { Sound.stopAmbient(1); }
      s = null;
    }

    function close() {
      cleanup(!!(s && !s.finished));
      el.hidden = true;
      el.innerHTML = '';
      document.body.classList.remove('in-session');
      Native.keepAwake(false);
      render();
    }

    return { start, requestExit, active: () => !!s };
  })();

  // ------------------------------------------------------------ музыка
  function trackRow(tr, opts = {}) {
    const st = Music.state();
    const playing = st.track && st.track.id === tr.id;
    const c = coll(S.activeColl);
    const added = inColl(c, tr.id);
    return `<div class="track ${playing ? 'playing' : ''} ${tr.available === false ? 'unavailable' : ''}" data-id="${esc(tr.id)}">
      <button class="cover" data-play style="${tr.cover ? `background-image:url('${esc(tr.cover)}')` : ''}">${playing && st.playing ? pauseSvg : playSvg}</button>
      <div class="ti"><b>${esc(tr.title)}</b><span>${esc(tr.artists || '—')}</span></div>
      <span class="dur">${tr.duration ? fmtDur(tr.duration) : ''}</span>
      ${opts.manage ? `
        <button class="icon-btn flat" data-mv="-1" title="Выше">${icon('up')}</button>
        <button class="icon-btn flat" data-mv="1" title="Ниже">${icon('down')}</button>
        <button class="icon-btn flat" data-rm title="Убрать">${icon('trash')}</button>`
    : `<button class="icon-btn flat ${added ? 'on' : ''}" data-add title="${added ? 'Добавлено' : 'Добавить в набор'}">${icon(added ? 'check' : 'plus')}</button>`}
    </div>`;
  }

  function bindTracks(root, list, opts = {}) {
    $$('.track', root).forEach((row) => {
      const tr = list.find((x) => x.id === row.dataset.id);
      if (!tr) return;
      $('[data-play]', row).onclick = () => {
        const st = Music.state();
        if (st.track && st.track.id === tr.id) Music.toggle();
        else Music.play(list, { start: list.indexOf(tr), shuffle: false, volume: S.settings.musicVol, fadeIn: false });
      };
      const add = $('[data-add]', row);
      if (add) add.onclick = () => {
        const c = coll(S.activeColl);
        if (inColl(c, tr.id)) c.tracks = c.tracks.filter((x) => x.id !== tr.id);
        else { c.tracks.push({ id: tr.id, title: tr.title, artists: tr.artists, duration: tr.duration, cover: tr.cover }); toast(`Добавлено в «${c.name}»`, 1500); }
        save('collections');
        const added = inColl(c, tr.id);
        add.classList.toggle('on', added);
        add.innerHTML = icon(added ? 'check' : 'plus');
        renderCollection();
      };
      $$('[data-mv]', row).forEach((b) => {
        b.onclick = () => {
          const c = coll(S.activeColl);
          const i = c.tracks.findIndex((x) => x.id === tr.id);
          const j = i + +b.dataset.mv;
          if (j < 0 || j >= c.tracks.length) return;
          [c.tracks[i], c.tracks[j]] = [c.tracks[j], c.tracks[i]];
          save('collections');
          renderCollection();
        };
      });
      const rm = $('[data-rm]', row);
      if (rm) rm.onclick = () => {
        const c = coll(S.activeColl);
        c.tracks = c.tracks.filter((x) => x.id !== tr.id);
        save('collections');
        renderCollection();
        if (opts.onChange) opts.onChange();
      };
    });
  }

  let authPoll = null;
  function stopAuthPoll() { clearTimeout(authPoll); authPoll = null; }

  function accountCard() {
    const a = S.account;
    if (a === null) return '<div class="card"><div class="spinner" style="margin:6px auto"></div></div>';
    if (a.error) return `<div class="card"><div class="empty" style="padding:8px"><b>Нет связи с Яндекс Музыкой</b>${esc(a.error)}<div style="margin-top:12px"><button class="btn small" id="acc-retry">Повторить</button></div></div></div>`;
    if (!a.logged_in) {
      if (a.auth) {
        return `<div class="card code-box">
          <p>Откройте <b>${esc(a.auth.verification_url.replace(/^https?:\/\//, ''))}</b> на любом устройстве и введите код:</p>
          <div class="code">${esc(a.auth.user_code)}</div>
          <p>Ожидаем подтверждения…</p>
          <div class="actions">
            <button class="btn primary" id="auth-open">${icon('link')} Открыть страницу</button>
            <button class="btn" id="auth-copy">${icon('copy')} Копировать код</button>
            <button class="btn ghost" id="auth-cancel">Отмена</button>
          </div></div>`;
      }
      return `<div class="card">
        <div class="account"><div class="avatar">Я</div><div class="info"><b>Яндекс Музыка</b><span>Войдите, чтобы добавлять свою музыку к медитациям</span></div></div>
        <div style="margin-top:14px"><button class="btn primary" id="auth-start">Войти через Яндекс</button></div>
        <details class="manual"><summary>У меня есть OAuth-токен</summary>
          <div class="r"><input class="input" id="tok" placeholder="y0_AgAAAA…" type="password"><button class="btn" id="tok-save">ОК</button></div>
        </details></div>`;
    }
    return `<div class="card"><div class="account">
      <div class="avatar">${esc((a.name || 'Я')[0].toUpperCase())}</div>
      <div class="info"><b>${esc(a.name || a.login)}${a.plus ? '<span class="tag" style="--c:var(--sand)">Плюс</span>' : '<span class="tag" style="--c:var(--faint)">без Плюса</span>'}</b><span>Яндекс Музыка подключена</span></div>
      <button class="icon-btn" id="logout" title="Выйти">${icon('out')}</button></div>
      ${a.plus ? '' : '<div class="warn">Без подписки Плюс Яндекс отдаёт только 30-секундные фрагменты треков.</div>'}</div>`;
  }

  async function loadAccount() {
    try { S.account = await Native.call('account'); } catch (e) {
      S.account = e.code === 'unauthorized' ? { logged_in: false } : { logged_in: false, error: humanError(e) };
      if (e.code === 'unauthorized') toast('Сессия Яндекса истекла — войдите заново');
    }
    if (S.tab === 'music' && !S.route) renderMusic();
  }

  async function startAuth() {
    try {
      const code = await Native.call('auth_start');
      S.account = { logged_in: false, auth: code };
      renderMusic();
      const deadline = Date.now() + code.expires_in * 1000;
      const poll = async () => {
        if (!S.account || !S.account.auth) return;
        try {
          const r = await Native.call('auth_poll', code.device_code);
          if (r.status === 'ok') { S.account = r.account; S.likes = null; S.playlists = null; toast('Яндекс Музыка подключена'); renderMusic(); return; }
          if (r.status === 'error') { S.account = { logged_in: false }; toast('Вход не удался: ' + r.error); renderMusic(); return; }
        } catch (e) { console.warn(e); }
        if (Date.now() > deadline) { S.account = { logged_in: false }; toast('Время действия кода истекло'); renderMusic(); return; }
        authPoll = setTimeout(poll, Math.max(2, code.interval) * 1000);
      };
      authPoll = setTimeout(poll, code.interval * 1000);
    } catch (e) { toast('Не удалось начать вход: ' + humanError(e)); }
  }

  function renderCollection() {
    const box = $('#coll-box');
    if (!box) return;
    const c = coll(S.activeColl) || S.collections[0];
    S.activeColl = c.id;
    box.innerHTML = `
      <div class="coll-head">
        <div class="chips">${S.collections.map((x) => `<button class="chip ${x.id === c.id ? 'active' : ''}" data-c="${x.id}">${esc(x.name)} · ${x.tracks.length}</button>`).join('')}</div>
        <button class="icon-btn flat" id="c-new" title="Новый набор">${icon('plus')}</button>
        <button class="icon-btn flat" id="c-edit" title="Переименовать">${icon('edit')}</button>
        ${S.collections.length > 1 ? `<button class="icon-btn flat" id="c-del" title="Удалить набор">${icon('trash')}</button>` : ''}
      </div>
      ${c.tracks.length ? `<div style="display:flex;gap:8px;margin:12px 0 6px">
          <button class="btn small" id="c-play">${playSvg} Слушать</button>
          <button class="btn small" id="c-shuffle">${icon('shuffle')} Вперемешку</button></div>
        <div class="tracks">${c.tracks.map((t) => trackRow(t, { manage: true })).join('')}</div>`
    : '<div class="empty"><b>Набор пуст</b>Найдите треки в Яндекс Музыке и нажмите «+», чтобы добавить их сюда. Набор можно выбрать как фон для любой практики.</div>'}`;
    $$('[data-c]', box).forEach((b) => { b.onclick = () => { S.activeColl = b.dataset.c; renderMusic(); }; });
    $('#c-new').onclick = async () => {
      const name = await prompt('Новый набор', 'Для сна');
      if (!name) return;
      const id = 'c' + Date.now().toString(36);
      S.collections.push({ id, name, tracks: [] });
      S.activeColl = id;
      save('collections');
      renderMusic();
    };
    $('#c-edit').onclick = async () => {
      const name = await prompt('Название набора', c.name);
      if (!name) return;
      c.name = name;
      save('collections');
      renderCollection();
    };
    const del = $('#c-del');
    if (del) del.onclick = async () => {
      if (!(await confirmBox('Удалить набор?', `«${c.name}» и ${c.tracks.length} ${plural(c.tracks.length, 'трек', 'трека', 'треков')} в нём будут удалены из приложения.`, 'Удалить'))) return;
      S.collections = S.collections.filter((x) => x.id !== c.id);
      S.activeColl = S.collections[0].id;
      save('collections');
      renderMusic();
    };
    const pl = $('#c-play');
    if (pl) pl.onclick = () => Music.play(c.tracks, { shuffle: false, volume: S.settings.musicVol, fadeIn: false });
    const sh = $('#c-shuffle');
    if (sh) sh.onclick = () => Music.play(c.tracks, { shuffle: true, volume: S.settings.musicVol, fadeIn: false });
    bindTracks(box, c.tracks, { onChange: () => {} });
  }

  function renderBrowse() {
    const box = $('#browse');
    if (!box) return;
    const tabs = `<div class="chips" style="margin-bottom:12px">
      ${[['search', 'Поиск'], ['likes', 'Мне нравится'], ['playlists', 'Плейлисты']].map(([k, v]) => `<button class="chip ${S.musicTab === k ? 'active' : ''}" data-mt="${k}">${v}</button>`).join('')}</div>`;
    let body = '';
    let list = [];
    if (S.musicTab === 'search') {
      body = `<div class="search">${icon('search')}<input class="input" id="q" placeholder="Например: медитация, rain sounds, Ludovico Einaudi" value="${esc(S.search.q)}"></div><div id="sres" style="margin-top:10px"></div>`;
    } else if (S.musicTab === 'likes') {
      if (S.likes === null) { body = '<div class="spinner"></div>'; loadLikes(); } else { list = S.likes; body = list.length ? `<div class="tracks">${list.map((t) => trackRow(t)).join('')}</div>` : '<div class="empty">Нет треков с отметкой «Мне нравится»</div>'; }
    } else if (S.openPlaylist) {
      const p = S.openPlaylist;
      body = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="icon-btn" id="pl-back">${icon('back')}</button><b style="flex:1">${esc(p.title)}</b>
        ${p.tracks ? `<button class="btn small" id="pl-addall">${icon('plus')} Добавить все</button>` : ''}</div>`;
      if (!p.tracks) { body += '<div class="spinner"></div>'; loadPlaylist(p); } else { list = p.tracks; body += `<div class="tracks">${list.map((t) => trackRow(t)).join('')}</div>`; }
    } else {
      if (S.playlists === null) { body = '<div class="spinner"></div>'; loadPlaylists(); } else {
        body = S.playlists.length ? `<div class="playlists">${S.playlists.map((p) => `<button class="pl" data-pl="${p.kind}"><div class="pc" style="${p.cover ? `background-image:url('${esc(p.cover)}')` : ''}"></div><b>${esc(p.title)}</b><span>${p.count} ${plural(p.count, 'трек', 'трека', 'треков')}</span></button>`).join('')}</div>` : '<div class="empty">У вас пока нет плейлистов</div>';
      }
    }
    box.innerHTML = tabs + body;
    $$('[data-mt]', box).forEach((b) => { b.onclick = () => { S.musicTab = b.dataset.mt; S.openPlaylist = null; renderBrowse(); }; });
    if (S.musicTab === 'search') {
      const q = $('#q');
      let deb = null;
      q.oninput = () => { clearTimeout(deb); deb = setTimeout(() => doSearch(q.value), 500); };
      q.onkeydown = (e) => { if (e.key === 'Enter') { clearTimeout(deb); doSearch(q.value); } };
      drawSearch();
    }
    $$('[data-pl]', box).forEach((b) => { b.onclick = () => { S.openPlaylist = { ...S.playlists.find((p) => String(p.kind) === b.dataset.pl) }; renderBrowse(); }; });
    const pb = $('#pl-back');
    if (pb) pb.onclick = () => { S.openPlaylist = null; renderBrowse(); };
    const pa = $('#pl-addall');
    if (pa) pa.onclick = () => {
      const c = coll(S.activeColl);
      let n = 0;
      S.openPlaylist.tracks.forEach((tr) => { if (tr.available !== false && !inColl(c, tr.id)) { c.tracks.push({ id: tr.id, title: tr.title, artists: tr.artists, duration: tr.duration, cover: tr.cover }); n++; } });
      save('collections');
      toast(`Добавлено ${n} ${plural(n, 'трек', 'трека', 'треков')} в «${c.name}»`);
      renderCollection();
      renderBrowse();
    };
    if (list.length) bindTracks(box, list);
  }

  function drawSearch() {
    const box = $('#sres');
    if (!box) return;
    const r = S.search;
    if (r.loading) box.innerHTML = '<div class="spinner"></div>';
    else if (r.error) box.innerHTML = `<div class="empty">${esc(r.error)}</div>`;
    else if (r.results === null) box.innerHTML = '<div class="empty" style="padding:20px">Ищите эмбиент, звуки природы, классику — всё, что помогает вам расслабиться</div>';
    else if (!r.results.length) box.innerHTML = '<div class="empty">Ничего не найдено</div>';
    else { box.innerHTML = `<div class="tracks">${r.results.map((t) => trackRow(t)).join('')}</div>`; bindTracks(box, r.results); }
  }

  async function doSearch(q) {
    q = q.trim();
    S.search.q = q;
    if (!q) { S.search.results = null; drawSearch(); return; }
    S.search.loading = true; S.search.error = null;
    drawSearch();
    const my = (doSearch.n = (doSearch.n || 0) + 1);
    try {
      const res = await Native.call('search', q);
      if (my !== doSearch.n) return;
      S.search.results = res;
    } catch (e) { if (my === doSearch.n) S.search.error = humanError(e); }
    S.search.loading = false;
    drawSearch();
  }

  async function loadLikes() {
    try { S.likes = await Native.call('likes', 200); } catch (e) { S.likes = []; toast(humanError(e)); }
    if (S.tab === 'music' && S.musicTab === 'likes') renderBrowse();
  }
  async function loadPlaylists() {
    try { S.playlists = await Native.call('playlists'); } catch (e) { S.playlists = []; toast(humanError(e)); }
    if (S.tab === 'music' && S.musicTab === 'playlists') renderBrowse();
  }
  async function loadPlaylist(p) {
    try { p.tracks = await Native.call('playlist_tracks', p.kind); } catch (e) { p.tracks = []; toast(humanError(e)); }
    if (S.openPlaylist && S.openPlaylist.kind === p.kind) { S.openPlaylist = p; renderBrowse(); }
  }

  function renderMusic() {
    const a = S.account;
    view.innerHTML = `<div class="page">
      <div class="hero"><div class="eyebrow">Яндекс Музыка</div><h1>Музыка для медитаций</h1>
        <p>Соберите наборы любимых треков и выбирайте их фоном для любой практики.</p></div>
      ${accountCard()}
      <div class="two-col" style="margin-top:8px">
        <div><div class="section-title"><h2>Мои наборы</h2></div><div id="coll-box"></div></div>
        ${a && a.logged_in ? '<div><div class="section-title"><h2>Добавить из Яндекс Музыки</h2></div><div id="browse"></div></div>' : ''}
      </div></div>`;
    renderCollection();
    renderBrowse();
    const on = (id, fn) => { const e = $('#' + id); if (e) e.onclick = fn; };
    on('auth-start', startAuth);
    on('auth-open', () => Native.openUrl(S.account.auth.verification_url));
    on('auth-copy', () => { Native.copy(S.account.auth.user_code); toast('Код скопирован'); });
    on('auth-cancel', () => { stopAuthPoll(); S.account = { logged_in: false }; renderMusic(); });
    on('acc-retry', () => { S.account = null; renderMusic(); loadAccount(); });
    on('tok-save', async () => {
      try { S.account = await Native.call('set_token', $('#tok').value); S.likes = null; S.playlists = null; toast('Яндекс Музыка подключена'); } catch (e) { toast('Ошибка: ' + humanError(e)); }
      renderMusic();
    });
    on('logout', async () => {
      if (!(await confirmBox('Выйти из Яндекс Музыки?', 'Ваши наборы треков сохранятся, но воспроизводить их можно будет только после входа.', 'Выйти'))) return;
      await Native.call('logout');
      Music.stop(0);
      S.account = { logged_in: false }; S.likes = null; S.playlists = null; S.search = { q: '', results: null };
      renderMusic();
    });
  }

  // мини-плеер
  function renderMini(st) {
    const m = $('#miniplayer');
    const show = !!st.track && !Session.active();
    m.hidden = !show;
    document.body.classList.toggle('has-mini', show);
    if (!show) return;
    const pct = st.duration ? (st.time / st.duration) * 100 : 0;
    if (m.dataset.track !== st.track.id) {
      m.dataset.track = st.track.id;
      m.innerHTML = `<div class="cover" style="${st.track.cover ? `background-image:url('${esc(st.track.cover)}')` : ''}"></div>
        <div class="ti"><b>${esc(st.track.title)}</b><span>${esc(st.track.artists)}</span></div>
        <button class="icon-btn flat" id="mp-prev">${icon('prev')}</button>
        <button class="icon-btn flat" id="mp-play" style="color:var(--text)"></button>
        <button class="icon-btn flat" id="mp-next">${icon('next')}</button>
        <button class="icon-btn flat" id="mp-close">${icon('close')}</button>
        <div class="bar"><i></i></div>`;
      $('#mp-prev').onclick = () => Music.prev();
      $('#mp-next').onclick = () => Music.next();
      $('#mp-play').onclick = () => Music.toggle();
      $('#mp-close').onclick = () => Music.stop(400);
    }
    $('#mp-play').innerHTML = st.playing ? pauseSvg : playSvg;
    $('.bar i', m).style.width = pct + '%';
    $('.ti span', m).textContent = (st.track.artists || '') + (st.track.preview ? ' · фрагмент 30 с' : '');
  }

  let lastTrackId = null;
  let lastPlaying = null;
  Music.subscribe((st) => {
    renderMini(st);
    const id = st.track && st.track.id;
    if ((id !== lastTrackId || st.playing !== lastPlaying) && S.tab === 'music' && !S.route) {
      $$('.track').forEach((row) => {
        const on = row.dataset.id === id;
        row.classList.toggle('playing', on);
        const b = $('[data-play]', row);
        if (b) b.innerHTML = on && st.playing ? pauseSvg : playSvg;
      });
    }
    lastTrackId = id;
    lastPlaying = st.playing;
  });

  // ------------------------------------------------------------ прогресс
  function renderProgress() {
    const st = computeStats();
    const days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const vals = days.map((d) => st.byDay[dayKey(d)] || 0);
    const max = Math.max(10, ...vals);
    const wd = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const counts = {};
    S.history.forEach((h) => { counts[h.id] = (counts[h.id] || 0) + 1; });
    const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const top = topId && techById(topId);
    const moods = S.history.filter((h) => h.mood);
    const avgMood = moods.length ? moods.reduce((a, h) => a + h.mood, 0) / moods.length : 0;
    const recent = S.history.slice(-30).reverse();
    view.innerHTML = `<div class="page">
      <div class="hero"><div class="eyebrow">Ваш путь</div><h1>Прогресс</h1></div>
      <div class="stats-row" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
        <div class="stat"><div class="v">${st.streak}</div><div class="l">дней подряд сейчас</div></div>
        <div class="stat"><div class="v">${st.best}</div><div class="l">лучшая серия</div></div>
        <div class="stat"><div class="v">${st.minutes >= 120 ? (st.minutes / 60).toFixed(1) + ' ч' : st.minutes + ' мин'}</div><div class="l">в практике всего</div></div>
        <div class="stat"><div class="v">${st.sessions}</div><div class="l">${plural(st.sessions, 'сессия', 'сессии', 'сессий')}</div></div>
      </div>
      <div class="section-title"><h2>Последние 7 дней</h2><span class="hint">минуты</span></div>
      <div class="card"><div class="week">${days.map((d, i) => `<div class="d"><span class="m">${vals[i] ? Math.round(vals[i]) : ''}</span><div class="b ${vals[i] ? '' : 'zero'}" style="height:${vals[i] ? Math.max(6, (vals[i] / max) * 100) : 3}%"></div><span class="n">${wd[d.getDay()]}</span></div>`).join('')}</div></div>
      ${top || avgMood ? `<div class="stats-row" style="grid-template-columns:1fr 1fr">
        ${top ? `<div class="stat"><div class="l">Любимая практика</div><div style="font-weight:600;margin-top:4px">${esc(top.title)}</div></div>` : ''}
        ${avgMood ? `<div class="stat"><div class="l">Среднее самочувствие</div><div style="font-weight:600;margin-top:4px">${avgMood.toFixed(1)} из 5</div></div>` : ''}</div>` : ''}
      <div class="section-title"><h2>История</h2></div>
      <div class="card history">${recent.length ? recent.map((h) => {
    const t = techById(h.id);
    const c = catOf(t ? t.category : 'mind');
    const d = new Date(h.ts);
    return `<div class="h" style="${catStyle(c)}"><span class="dot"></span><div class="t">${esc(t ? t.title : h.id)}<span>${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span></div><span class="mn">${Math.round(h.minutes)} мин</span></div>`;
  }).join('') : '<div class="empty"><b>Здесь появятся ваши практики</b>Начните с короткой дыхательной техники — всего 3 минуты</div>'}</div>
    </div>`;
  }

  // ------------------------------------------------------------ настройки
  function renderSettings() {
    const st = S.settings;
    const sw = (key, title, hint) => `<div class="item"><div class="t">${title}${hint ? `<span>${hint}</span>` : ''}</div>
      <label class="switch"><input type="checkbox" data-s="${key}" ${st[key] ? 'checked' : ''}><i></i></label></div>`;
    view.innerHTML = `<div class="page">
      <div class="hero"><div class="eyebrow">StoryFox Silence</div><h1>Настройки</h1></div>
      <div class="section-title"><h2>Оформление</h2></div>
      <div class="card settings">
        <div class="item"><div class="t">Тема</div>
          <div class="seg" id="theme">${[['dark', 'Тёмная'], ['light', 'Светлая'], ['system', 'Как в системе']].map(([v, l]) => `<button data-v="${v}" class="${st.theme === v ? 'active' : ''}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="section-title"><h2>Сессия</h2></div>
      <div class="card settings">
        ${sw('voice', 'Голосовые подсказки', 'Озвучивание инструкций синтезатором речи')}
        ${sw('phaseVoice', 'Озвучивать фазы дыхания', '«Вдох», «Выдох» голосом в дыхательных техниках')}
        ${sw('cues', 'Звуковые сигналы фаз', 'Мягкий тон при смене вдоха и выдоха')}
        ${sw('bells', 'Колокол', 'Поющая чаша в начале и в конце практики')}
        <div class="item"><div class="t">Интервальный колокол<span>Для «Тихого сидения»</span></div>
          <select class="select" id="interval">${[0, 1, 2, 3, 5, 10, 15].map((v) => `<option value="${v}" ${st.interval === v ? 'selected' : ''}>${v ? v + ' мин' : 'Выкл'}</option>`).join('')}</select></div>
        <div class="item"><div class="t">Звуки природы по умолчанию</div>
          <select class="select" id="ambient">${Sound.AMBIENTS.map((a) => `<option value="${a.id}" ${st.ambient === a.id ? 'selected' : ''}>${a.title}</option>`).join('')}</select></div>
        ${sw('shuffle', 'Перемешивать музыку', 'Случайный порядок треков из набора во время практики')}
        <div class="item"><div class="t">Проверить звук</div><button class="btn small" id="test">Колокол и голос</button></div>
      </div>
      <div class="section-title"><h2>Данные</h2></div>
      <div class="card settings">
        <div class="item"><div class="t">Сбросить статистику<span>История практик и серии будут удалены</span></div><button class="btn small danger" id="reset">Сбросить</button></div>
      </div>
      <div class="about">StoryFox Silence ${VERSION} · ${Native.platform === 'android' ? 'Android' : Native.platform === 'desktop' ? 'Windows' : 'Web'}<br>
        Интеграция с Яндекс Музыкой через библиотеку yandex-music (MarshalX, LGPL-3.0).<br>
        Медитации не заменяют медицинскую помощь.</div>
    </div>`;
    $$('[data-s]', view).forEach((i) => { i.onchange = () => { st[i.dataset.s] = i.checked; save('settings'); }; });
    $$('#theme button').forEach((b) => {
      b.onclick = () => {
        st.theme = b.dataset.v;
        save('settings');
        applyTheme();
        $$('#theme button').forEach((x) => x.classList.toggle('active', x === b));
      };
    });
    $('#interval').onchange = (e) => { st.interval = +e.target.value; save('settings'); };
    $('#ambient').onchange = (e) => { st.ambient = e.target.value; save('settings'); };
    $('#test').onclick = () => { Sound.bell(0.7); setTimeout(() => Native.speak('Сделайте глубокий вдох. И медленный выдох.'), 600); };
    $('#reset').onclick = async () => {
      if (!(await confirmBox('Сбросить статистику?', 'Все записи о практиках будут удалены без возможности восстановления.', 'Сбросить'))) return;
      S.history = [];
      save('history');
      toast('Статистика сброшена');
    };
  }

  // ------------------------------------------------------------ запуск
  async function init() {
    $$('#nav button').forEach((b) => { b.onclick = () => setTab(b.dataset.tab); });
    try {
      const data = await Native.call('store_all');
      if (data.settings) S.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      if (Array.isArray(data.collections) && data.collections.length) S.collections = data.collections;
      if (Array.isArray(data.history)) S.history = data.history;
      if (Array.isArray(data.favorites)) S.favorites = data.favorites;
      if (data.prefs) S.prefs = data.prefs;
    } catch (e) { console.warn('load failed', e); }
    S.activeColl = S.collections[0].id;
    applyTheme();
    render();
    loadAccount();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') back();
    if (e.key === ' ' && Session.active() && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#s-play') && $('#s-play').click(); }
  });
  document.addEventListener('contextmenu', (e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); });

  init();
  return { back, toast };
})();
