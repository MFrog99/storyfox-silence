/* Звук: синтезированные колокола, фоновые звуки природы (без файлов) и плеер Яндекс Музыки. */
const Sound = (() => {
  let ctx = null;
  let master = null;

  function ac() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Поющая чаша: негармонические обертоны с долгим затуханием и биениями. */
  function bell(volume = 0.6, base = 262) {
    const c = ac();
    const now = c.currentTime;
    const partials = [[1, 1, 9], [2.71, 0.45, 6], [5.18, 0.22, 4], [8.42, 0.1, 2.5], [1.003, 0.6, 9]];
    const out = c.createGain();
    out.gain.value = volume * 0.35;
    out.connect(master);
    partials.forEach(([ratio, amp, decay]) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = base * ratio;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + decay + 0.1);
    });
  }

  /* Мягкий сигнал смены фазы дыхания. */
  function cue(kind, volume = 0.35) {
    const c = ac();
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    const map = { in: [330, 440], out: [440, 330], hold: [392, 392], holdout: [294, 294] };
    const [f1, f2] = map[kind] || map.hold;
    o.frequency.setValueAtTime(f1, now);
    o.frequency.exponentialRampToValueAtTime(f2, now + 0.5);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume * 0.18, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 1);
  }

  // ------------------------------------------------------------ фоновые звуки

  const AMBIENTS = [
    { id: 'none', title: 'Тишина' },
    { id: 'rain', title: 'Дождь' },
    { id: 'ocean', title: 'Океан' },
    { id: 'forest', title: 'Лес и ручей' },
    { id: 'wind', title: 'Ветер' },
    { id: 'space', title: 'Космос' },
    { id: 'brown', title: 'Коричневый шум' },
  ];

  function noiseBuffer(type) {
    const c = ac();
    const len = c.sampleRate * 8;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w * 0.5;
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        } else {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.5;
        }
      }
    }
    return buf;
  }

  const buffers = {};
  function noise(type) {
    const c = ac();
    buffers[type] = buffers[type] || noiseBuffer(type);
    const s = c.createBufferSource();
    s.buffer = buffers[type];
    s.loop = true;
    s.loopStart = Math.random() * 4;
    return s;
  }

  function lfo(freq, depth, target, offset) {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    g.gain.value = depth;
    o.connect(g).connect(target);
    if (offset !== undefined) target.value = offset;
    o.start();
    return o;
  }

  let amb = null; // { gain, nodes, timers }

  function startAmbient(id, volume = 0.5) {
    stopAmbient(0.3);
    if (!id || id === 'none') return;
    const c = ac();
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + 3);
    gain.connect(master);
    const nodes = [];
    const timers = [];
    const add = (n) => { nodes.push(n); return n; };

    if (id === 'rain') {
      const n = add(noise('pink'));
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      const g = c.createGain(); g.gain.value = 0.9;
      n.connect(hp).connect(lp).connect(g).connect(gain);
      const n2 = add(noise('brown'));
      const g2 = c.createGain(); g2.gain.value = 0.35;
      n2.connect(g2).connect(gain);
      n.start(); n2.start();
    } else if (id === 'ocean') {
      const n = add(noise('brown'));
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = c.createGain();
      n.connect(lp).connect(g).connect(gain);
      add(lfo(0.09, 0.45, g.gain, 0.55));
      add(lfo(0.09, 350, lp.frequency, 700));
      n.start();
    } else if (id === 'wind') {
      const n = add(noise('white'));
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      const g = c.createGain(); g.gain.value = 0.7;
      n.connect(bp).connect(g).connect(gain);
      add(lfo(0.05, 300, bp.frequency, 500));
      add(lfo(0.13, 0.25, g.gain, 0.6));
      n.start();
    } else if (id === 'forest') {
      const n = add(noise('pink'));
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6;
      const g = c.createGain(); g.gain.value = 0.45;
      n.connect(bp).connect(g).connect(gain);
      add(lfo(0.3, 0.08, g.gain, 0.45));
      n.start();
      const chirp = () => {
        const t = c.currentTime;
        const count = 2 + Math.floor(Math.random() * 4);
        const f = 2500 + Math.random() * 2000;
        for (let i = 0; i < count; i++) {
          const o = c.createOscillator();
          const og = c.createGain();
          const st = t + i * (0.12 + Math.random() * 0.08);
          o.frequency.setValueAtTime(f, st);
          o.frequency.exponentialRampToValueAtTime(f * (1.2 + Math.random() * 0.5), st + 0.08);
          og.gain.setValueAtTime(0, st);
          og.gain.linearRampToValueAtTime(0.05, st + 0.02);
          og.gain.exponentialRampToValueAtTime(0.0001, st + 0.12);
          o.connect(og).connect(gain);
          o.start(st); o.stop(st + 0.15);
        }
        timers.push(setTimeout(chirp, 3000 + Math.random() * 9000));
      };
      timers.push(setTimeout(chirp, 2000));
    } else if (id === 'space') {
      [55, 82.41, 110, 164.81, 220.5].forEach((f, i) => {
        const o = add(c.createOscillator());
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        const g = c.createGain();
        g.gain.value = 0;
        o.connect(g).connect(gain);
        add(lfo(0.02 + i * 0.013, 0.07, g.gain, 0.09 - i * 0.012));
        o.start();
      });
      const n = add(noise('brown'));
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
      const g = c.createGain(); g.gain.value = 0.25;
      n.connect(lp).connect(g).connect(gain);
      n.start();
    } else if (id === 'brown') {
      const n = add(noise('brown'));
      n.connect(gain);
      n.start();
    }
    amb = { gain, nodes, timers, id };
  }

  function setAmbientVolume(v) {
    if (amb) amb.gain.gain.setTargetAtTime(v, ac().currentTime, 0.2);
  }

  function stopAmbient(fade = 2) {
    if (!amb) return;
    const { gain, nodes, timers } = amb;
    amb = null;
    const c = ac();
    timers.forEach(clearTimeout);
    gain.gain.cancelScheduledValues(c.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + fade);
    setTimeout(() => {
      nodes.forEach((n) => { try { n.stop(); } catch (e) { /* уже остановлен */ } });
      gain.disconnect();
    }, fade * 1000 + 100);
  }

  return { bell, cue, startAmbient, stopAmbient, setAmbientVolume, AMBIENTS, unlock: ac };
})();

/* Плеер треков Яндекс Музыки на HTMLAudioElement. */
const Music = (() => {
  const audio = new Audio();
  audio.preload = 'auto';
  let list = [];
  let index = -1;
  let loop = true;
  let target = 0.7;
  let fadeTimer = null;
  let failures = 0;
  let token = 0;
  const listeners = new Set();

  const emit = () => listeners.forEach((fn) => fn(state()));

  function state() {
    return {
      track: list[index] || null,
      playing: !audio.paused && !!audio.src,
      loading: audio.readyState < 2 && !!audio.src && !audio.paused,
      time: audio.currentTime || 0,
      duration: audio.duration || 0,
      index,
      count: list.length,
    };
  }

  function fadeTo(vol, ms, done) {
    clearInterval(fadeTimer);
    const start = audio.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.min(1, Math.max(0, start + (vol - start) * (i / steps)));
      if (i >= steps) {
        clearInterval(fadeTimer);
        if (done) done();
      }
    }, 50);
  }

  async function load(i, fadeIn = true) {
    if (!list.length) return;
    index = ((i % list.length) + list.length) % list.length;
    const my = ++token;
    clearInterval(fadeTimer);
    const track = list[index];
    emit();
    try {
      const info = await Native.call('stream_url', track.id);
      if (my !== token) return;
      track.preview = info.preview;
      audio.src = info.url;
      audio.volume = fadeIn ? 0 : target;
      await audio.play();
      failures = 0;
      if (fadeIn) fadeTo(target, 2500);
    } catch (e) {
      if (my !== token) return;
      console.warn('track failed', track.id, e);
      failures++;
      if (failures < Math.min(list.length, 5)) load(index + 1, fadeIn);
      else { failures = 0; App.toast('Не удалось воспроизвести музыку: ' + humanError(e)); stop(0); }
    }
    emit();
  }

  audio.addEventListener('ended', () => {
    if (index + 1 < list.length || loop) load(index + 1, false);
    else emit();
  });
  audio.addEventListener('error', () => {
    // ошибки при старте трека обрабатывает load(); здесь — только обрыв во время игры
    if (audio.getAttribute('src') && list.length && audio.currentTime > 0) { failures++; if (failures < 5) load(index + 1, false); }
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'waiting', 'playing'].forEach((ev) => audio.addEventListener(ev, emit));

  function play(tracks, opts = {}) {
    list = tracks.slice();
    if (opts.shuffle) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    loop = opts.loop !== false;
    if (opts.volume !== undefined) target = opts.volume;
    failures = 0;
    load(opts.start || 0, opts.fadeIn !== false);
  }

  function stop(fadeMs = 2000) {
    const my = ++token;
    const finish = () => {
      if (my !== token) return; // за время затухания уже запустили другой трек
      audio.pause(); audio.removeAttribute('src'); audio.load(); list = []; index = -1; emit(); };
    if (fadeMs && !audio.paused) fadeTo(0, fadeMs, finish);
    else finish();
  }

  function setVolume(v) { target = v; clearInterval(fadeTimer); audio.volume = v; }
  function toggle() { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); }
  function pause() { audio.pause(); }
  function resume() { if (audio.src) audio.play().catch(() => {}); }
  function next() { if (list.length) load(index + 1, false); }
  function prev() { if (list.length) load(index - 1, false); }
  function seek(t) { if (audio.duration) audio.currentTime = t; }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  return { play, stop, pause, resume, toggle, next, prev, seek, setVolume, subscribe, state };
})();

function humanError(e) {
  const map = {
    not_logged_in: 'войдите в Яндекс Музыку',
    unauthorized: 'сессия Яндекса истекла, войдите заново',
    bad_token: 'токен не подошёл',
    network: 'нет соединения с интернетом',
    unavailable: 'функция доступна только в приложении',
    no_stream: 'трек недоступен',
  };
  return map[e && e.code] || (e && e.message) || 'неизвестная ошибка';
}
