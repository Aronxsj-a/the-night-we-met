(() => {
  'use strict';

  const chapters = [
    { title: 'A Random Night', beats: 'First message', points: '2,20 12,7 25,14 36,4' },
    { title: 'From Strangers to Best Friends', beats: 'Shared interests · Late nights', points: '3,19 14,4 24,20 37,10' },
    { title: 'My Safe Place', beats: 'Comfort · More than friends', points: '2,10 12,19 22,7 35,13' },
    { title: 'The Promise We Kept', beats: 'The first date', points: '4,20 16,6 22,17 35,21' },
    { title: 'Five Years of Us', beats: 'Choosing each other · One more message', points: '4,10 12,20 24,16 36,5' }
  ];
  const key = 'the-night-we-met.v1';
  const phone = document.getElementById('phone');
  const stage = document.getElementById('stage');
  const hud = document.getElementById('hud');
  const progress = document.getElementById('progress');
  const label = document.getElementById('chapter-label');
  const overlay = document.getElementById('overlay');
  const landscape = matchMedia('(orientation: landscape)');
  const sound = window.StoryAudio;
  const canceled = Symbol('scene canceled');
  const media = [
    ['room-chariz.svg', 'room-raul.svg'],
    ['sketch-closed.svg', 'sketch-open.svg'],
    ['room-chariz.svg', 'room-raul.svg'],
    ['mall.svg'],
    ['ending-sky.svg']
  ];

  function storedState() {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  }

  const saved = storedState();
  const state = {
    chapter: Number.isInteger(saved?.chapter) && chapters[saved.chapter] ? saved.chapter : 0,
    done: Array.from({ length: chapters.length }, (_, index) => saved?.done?.[index] === true),
    started: saved?.started === true,
    complete: saved?.complete === true,
    volume: typeof saved?.volume === 'number' ? Math.max(0, Math.min(1, saved.volume)) : .7,
    muted: saved?.muted === true
  };

  let run;
  let active = false;
  let needsContinue = false;
  let paused = false;
  let panel = '';
  let backPending = false;
  let exitRequested = false;
  let restoreFocus;
  let audioEnabled = false;

  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { /* Play continues when browser storage is unavailable. */ }
  }

  function updateHUD() {
    hud.hidden = progress.hidden = !active;
    label.textContent = ['First message', 'Best friends', 'My safe place', 'The first date', 'One more message'][state.chapter];
    progress.innerHTML = state.done.map((done, index) =>
      '<span class="' + (index === state.chapter ? 'current' : done ? 'done' : '') + '"></span>'
    ).join('');
  }

  const imageCache = new Map();
  function preload(index) {
    for (const file of media[index] ?? []) {
      if (imageCache.has(file)) continue;
      const image = new Image();
      image.decoding = 'async';
      image.src = 'assets/' + file;
      imageCache.set(file, image);
    }
    for (const file of imageCache.keys()) {
      if (![...(media[index] ?? []), ...(media[index - 1] ?? [])].includes(file)) imageCache.delete(file);
    }
  }

  function canPlay() {
    return !document.hidden && !needsContinue && !landscape.matches && !panel;
  }

  function syncPause() {
    const next = !canPlay();
    phone.classList.toggle('is-paused', next);
    if (next === paused) return;
    paused = next;
    run?.onPause?.(paused);
    if (!active || !audioEnabled) return;
    if (paused) sound?.pause();
    else sound?.resume();
  }

  function displayScene(className, html) {
    const scene = document.createElement('section');
    scene.className = 'scene ' + className;
    scene.innerHTML = html;
    stage.replaceChildren(scene);
    return scene;
  }

  function makeRun() {
    const controller = new AbortController();
    const signal = controller.signal;
    const current = { controller, scene: null, onPause: null };
    const valid = () => {
      if (signal.aborted) throw canceled;
    };

    current.context = {
      present({ className = '', html }) {
        valid();
        current.scene = displayScene(className, html);
        return current.scene;
      },
      caption(html) {
        valid();
        const node = current.scene.querySelector('[data-caption]');
        if (node) node.innerHTML = html;
      },
      wait(ms, { skip = false } = {}) {
        valid();
        return new Promise((resolve, reject) => {
          let remaining = ms;
          let timer;
          let lastStart;
          const scene = current.scene;
          const onAbort = () => finish(canceled);
          const onSkip = event => {
            if (!paused && !event.target.closest('button, input, a, label, [role="button"]')) finish();
          };
          const onPause = value => {
            if (value && timer !== undefined) {
              clearTimeout(timer);
              timer = undefined;
              remaining -= performance.now() - lastStart;
            } else if (!value && timer === undefined) {
              lastStart = performance.now();
              timer = setTimeout(finish, Math.max(0, remaining));
            }
          };
          function finish(error) {
            clearTimeout(timer);
            current.onPause = null;
            signal.removeEventListener('abort', onAbort);
            if (skip) scene?.removeEventListener('click', onSkip);
            if (error) reject(error);
            else resolve();
          }
          current.onPause = onPause;
          signal.addEventListener('abort', onAbort, { once: true });
          if (skip) scene?.addEventListener('click', onSkip);
          if (!paused) onPause(false);
        });
      },
      action(selector, handler) {
        valid();
        const scene = current.scene;
        return new Promise((resolve, reject) => {
          const onAbort = () => {
            scene.removeEventListener('click', onClick);
            reject(canceled);
          };
          const onClick = event => {
            const target = event.target.closest(selector);
            if (paused || !target || target.disabled || !scene.contains(target)) return;
            scene.removeEventListener('click', onClick);
            signal.removeEventListener('abort', onAbort);
            try { resolve(handler ? handler(target, event) : target); }
            catch (error) { reject(error); }
          };
          signal.addEventListener('abort', onAbort, { once: true });
          scene.addEventListener('click', onClick);
        });
      },
      sound(name) {
        if (!paused && audioEnabled && !signal.aborted) sound?.effect(name);
      },
      complete() {
        valid();
        state.done[state.chapter] = true;
        state.complete = true;
        save();
        updateHUD();
      },
      endingMusic() {
        if (audioEnabled && !signal.aborted) sound?.ending();
      },
      replay() { if (!signal.aborted) play(0); },
      universe() { if (!signal.aborted) showUniverse(); }
    };

    return current;
  }

  async function play(index) {
    run?.controller.abort();
    active = true;
    state.started = true;
    state.chapter = index;
    save();
    updateHUD();
    preload(index + 1);
    if (audioEnabled) sound?.chapter(index);
    run = makeRun();
    const thisRun = run;

    try {
      const chapter = [window.openingChapter, window.middleChapters?.[1], window.middleChapters?.[2], window.middleChapters?.[3], window.endingChapter][index];
      await chapter(thisRun.context);
      if (run !== thisRun || thisRun.controller.signal.aborted) return;
      if (index < chapters.length - 1) {
        state.done[index] = true;
        save();
        play(index + 1);
      }
    } catch (error) {
      if (error === canceled) return;
      console.error('Story chapter could not load.', error);
      const scene = displayScene('welcome', '<div class="welcome-content"><h1>Try again</h1><p class="welcome-copy">This part of the story could not load.</p><button class="primary" type="button">Reload the story</button></div>');
      scene.querySelector('button').addEventListener('click', () => location.reload());
    }
  }

  function ensureBackPoint() {
    if (history.state?.story) return;
    try { history.pushState({ story: true }, ''); }
    catch { /* The menu remains available in a restricted browsing window. */ }
  }

  function start(index, muted) {
    state.muted = muted;
    audioEnabled = true;
    sound?.setVolume(state.volume);
    sound?.setMuted(muted);
    sound?.unlock();

    const fullscreen = phone.requestFullscreen || phone.webkitRequestFullscreen;
    if (!document.fullscreenElement && !muted && fullscreen) {
      try { Promise.resolve(fullscreen.call(phone)).catch(() => {}); }
      catch { /* Fullscreen is optional. */ }
    }
    ensureBackPoint();
    play(index);
  }

  function welcome() {
    run?.controller.abort();
    run = null;
    active = false;
    sound?.pause();
    updateHUD();
    preload(0);
    const returning = state.started;
    const scene = displayScene('welcome', `
      <div class="welcome-stars" aria-hidden="true">${[[19,22],[79,18],[63,31],[21,42],[82,39],[37,16],[57,11]].map(([x,y], i) =>
        '<i style="left:' + x + '%;top:' + y + '%;--offset:' + (-i * .7) + 's"></i>').join('')}</div>
      <div class="welcome-content">
        <p class="eyebrow">November 22, 2021</p>
        <h1>The Night <em>We Met</em></h1>
        <p class="welcome-copy">Some nights seem ordinary... until you look back.</p>
        <div class="welcome-actions">
          <button id="begin" class="primary" type="button">${returning ? 'Continue Story' : 'Begin with Sound'}</button>
          <button id="begin-quiet" class="welcome-quiet" type="button">${returning ? 'Start from the Beginning' : 'Begin Muted'}</button>
        </div>
      </div>`);
    scene.querySelector('#begin').onclick = () => start(returning ? state.chapter : 0, returning && state.muted);
    scene.querySelector('#begin-quiet').onclick = () => start(0, returning ? state.muted : true);
    updateInterruption();
  }

  function setPanel(name, html, opener = document.activeElement) {
    if (!panel) restoreFocus = opener;
    panel = name;
    overlay.innerHTML = '<div class="overlay-inner">' + html + '</div>';
    if (!overlay.open) {
      if (overlay.showModal) overlay.showModal();
      else overlay.setAttribute('open', '');
    }
    overlay.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
    syncPause();
  }

  function closePanel({ stay = true, refocus = true } = {}) {
    panel = '';
    if (overlay.close) overlay.close();
    else overlay.removeAttribute('open');
    if (stay && backPending) ensureBackPoint();
    backPending = false;
    if (refocus && restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
    restoreFocus = null;
    syncPause();
  }

  function showSettings(exit = false) {
    setPanel(exit ? 'exit' : 'settings', `
      <p class="eyebrow">The Night We Met</p>
      <h2 id="overlay-title">${exit ? 'Leaving the story?' : 'Story Settings'}</h2>
      ${exit ? '<p>You can pick up from this chapter when you come back.</p>' : `
        <label class="settings-row" for="mute">Mute audio <input id="mute" type="checkbox"${state.muted ? ' checked' : ''}></label>
        <label class="settings-row" for="volume">Volume <input id="volume" type="range" min="0" max="100" value="${Math.round(state.volume * 100)}"></label>
      `}
      <div class="overlay-actions">
        <button class="primary" id="settings-close" type="button">Keep Watching</button>
        <button class="quiet" id="leave-story" type="button">Back to Title</button>
      </div>`);
    const mute = overlay.querySelector('#mute');
    const volume = overlay.querySelector('#volume');
    if (mute) mute.onchange = () => {
      state.muted = mute.checked;
      sound?.setMuted(state.muted);
      save();
    };
    if (volume) volume.oninput = () => {
      state.volume = Number(volume.value) / 100;
      sound?.setVolume(state.volume);
      save();
    };
    overlay.querySelector('#settings-close').onclick = () => closePanel();
    overlay.querySelector('#leave-story').onclick = () => {
      welcome();
      if (history.state?.story) {
        exitRequested = true;
        history.back();
      }
      closePanel({ stay: false, refocus: false });
      stage.querySelector('button')?.focus({ preventScroll: true });
    };
  }

  function stars(chapter) {
    const nodes = chapter.points.split(' ').map(point => {
      const [x, y] = point.split(',');
      return '<circle cx="' + x + '" cy="' + y + '" r="2.3" fill="currentColor"/>';
    }).join('');
    return '<svg aria-hidden="true" viewBox="0 0 40 28"><polyline points="' + chapter.points +
      '" fill="none" stroke="currentColor" stroke-width=".85"/>' + nodes + '</svg>';
  }

  function showUniverse() {
    setPanel('universe', `
      <p class="eyebrow">Chapter Navigator</p>
      <h2 id="overlay-title">Our Little Universe</h2>
      <ol class="universe-list">
        ${chapters.map((chapter, index) => {
          const available = state.complete || state.done[index] || index === state.chapter;
          return '<li><button type="button" data-chapter="' + index + '"' +
            (state.done[index] || state.complete ? ' class="constellation-lit"' : '') +
            (available ? '' : ' disabled') + '>' + stars(chapter) +
            '<span>' + chapter.title + '<small style="display:block;color:#ccbfc9">' + chapter.beats + '</small></span></button></li>';
        }).join('')}
      </ol>
      ${state.complete ? '<button class="hidden-star" aria-label="Reveal the hidden star" aria-expanded="false" aria-controls="hidden-note" type="button">✦ &nbsp; A little hidden star</button><p class="hidden-note" id="hidden-note" hidden>“Kumain kana mahal?”<br>Even after all these years, I still want to know. ♡</p>' : ''}
      <div class="overlay-actions"><button type="button" class="primary" id="universe-close">Back to Story</button></div>`);
    overlay.querySelectorAll('[data-chapter]:not([disabled])').forEach(button => {
      button.onclick = () => {
        closePanel({ refocus: false });
        play(Number(button.dataset.chapter));
      };
    });
    const hidden = overlay.querySelector('.hidden-star');
    if (hidden) hidden.onclick = () => {
      const note = overlay.querySelector('#hidden-note');
      note.hidden = !note.hidden;
      hidden.setAttribute('aria-expanded', String(!note.hidden));
    };
    overlay.querySelector('#universe-close').onclick = () => closePanel();
  }

  function updateInterruption() {
    if (document.hidden) {
      if (active) needsContinue = true;
      syncPause();
      return;
    }

    const phoneVisible = getComputedStyle(phone).display !== 'none';
    if (landscape.matches && phoneVisible) {
      if (active) needsContinue = true;
      if (panel !== 'orientation') {
        setPanel('orientation', '<p class="eyebrow">Portrait Story</p><h2 id="overlay-title">Turn your phone upright</h2><p>The story will be here when you’re ready.</p>');
      }
    } else if (needsContinue && phoneVisible) {
      if (panel !== 'continue') {
        setPanel('continue', '<h2 id="overlay-title">Ready to keep going?</h2><div class="overlay-actions"><button class="primary" type="button">Tap to Continue</button></div>');
        overlay.querySelector('button').onclick = () => {
          needsContinue = false;
          closePanel();
        };
      }
    } else if (panel === 'orientation' || panel === 'continue') {
      closePanel();
    }
    syncPause();
  }

  document.getElementById('sky-button').onclick = showUniverse;
  document.getElementById('menu-button').onclick = () => showSettings();
  document.addEventListener('visibilitychange', updateInterruption);
  if (landscape.addEventListener) landscape.addEventListener('change', updateInterruption);
  else landscape.addListener(updateInterruption);
  overlay.addEventListener('cancel', event => {
    event.preventDefault();
    if (panel !== 'orientation' && panel !== 'continue') closePanel();
  });
  window.addEventListener('popstate', () => {
    if (exitRequested) { exitRequested = false; return; }
    if (active && !history.state?.story) {
      backPending = true;
      showSettings(true);
    }
  });

  welcome();
})();
