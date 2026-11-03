/* Мост между интерфейсом и нативной частью.
 * Android: window.AndroidBridge (Java + Chaquopy), ответ приходит в Native._resolve.
 * Windows: window.pywebview.api (pywebview).
 * Браузер: заглушка на localStorage — удобно для отладки интерфейса. */
const Native = (() => {
  const android = window.AndroidBridge;
  const platform = android ? 'android' : (window.pywebview || /StoryFoxDesktop/.test(navigator.userAgent) ? 'desktop' : 'web');
  let seq = 0;
  const pending = {};

  function waitDesktop() {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.call) return Promise.resolve(true);
    if (platform !== 'desktop') return Promise.resolve(false);
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      window.addEventListener('pywebviewready', () => finish(true), { once: true });
      setTimeout(() => finish(!!(window.pywebview && window.pywebview.api)), 15000);
    });
  }

  const webStore = {
    get(k) { try { return JSON.parse(localStorage.getItem('sfs:' + k)); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem('sfs:' + k) : localStorage.setItem('sfs:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  async function raw(method, args) {
    if (android) {
      return new Promise((resolve) => {
        const id = ++seq;
        pending[id] = resolve;
        android.call(id, method, JSON.stringify(args));
      });
    }
    if (await waitDesktop()) return window.pywebview.api.call(method, JSON.stringify(args));
    // web fallback
    if (method === 'store_get') return JSON.stringify({ ok: true, result: webStore.get(args[0]) });
    if (method === 'store_set') { webStore.set(args[0], args[1]); return JSON.stringify({ ok: true, result: true }); }
    if (method === 'store_all') {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('sfs:')) out[k.slice(4)] = webStore.get(k.slice(4));
      }
      return JSON.stringify({ ok: true, result: out });
    }
    if (method === 'account') return JSON.stringify({ ok: true, result: { logged_in: false } });
    return JSON.stringify({ ok: false, code: 'unavailable', error: 'Доступно только в приложении' });
  }

  async function call(method, ...args) {
    const text = await raw(method, args);
    const res = typeof text === 'string' ? JSON.parse(text) : text;
    if (!res.ok) {
      const err = new Error(res.error || res.code);
      err.code = res.code;
      throw err;
    }
    return res.result;
  }

  function _resolve(id, text) {
    const fn = pending[id];
    delete pending[id];
    if (fn) fn(text);
  }

  function openUrl(url) {
    if (android) return android.openUrl(url);
    if (window.pywebview && window.pywebview.api) return window.pywebview.api.open_url(url);
    window.open(url, '_blank');
  }

  function copy(text) {
    if (android) { android.copy(text); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  }

  let ruVoice = null;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = speechSynthesis.getVoices();
    ruVoice = voices.find((v) => /^ru/i.test(v.lang) && /natural|online/i.test(v.name))
      || voices.find((v) => /^ru/i.test(v.lang)) || null;
    return ruVoice;
  }
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = pickVoice;

  function speak(text) {
    if (!text) return;
    if (android) { android.speak(text); return; }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 0.88;
    u.pitch = 0.95;
    const v = ruVoice || pickVoice();
    // нет русского голоса в системе — лучше промолчать, чем читать с английским акцентом
    if (!v && speechSynthesis.getVoices().length) return;
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  function stopSpeech() {
    if (android) { android.stopSpeak(); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function keepAwake(on) { if (android) android.keepAwake(!!on); }

  /* Цвет системных панелей Android под тему интерфейса. */
  function setTheme(dark) { if (android && android.setTheme) android.setTheme(!!dark); }

  return { platform, call, _resolve, openUrl, copy, speak, stopSpeech, keepAwake, setTheme };
})();
