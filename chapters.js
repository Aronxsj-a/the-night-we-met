(() => {
  'use strict';

  const stars = [
    [8, 23], [15, 68], [18, 36], [24, 12], [28, 77], [34, 28], [40, 58], [45, 17],
    [57, 75], [64, 26], [69, 15], [72, 63], [79, 32], [83, 72], [91, 18], [92, 53]
  ];
  const starField = stars.map(([x, y], index) =>
    `<i style="--x:${x}%;--y:${y}%;--delay:${index * 0.35}s"></i>`
  ).join('');

  const arrow = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const lightIcon = '<svg class="middle-light-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3c1.8 11.6 5.4 15.2 17 17-11.6 1.8-15.2 5.4-17 17C18.2 25.4 14.6 21.8 3 20 14.6 18.2 18.2 14.6 20 3Z" fill="currentColor"/><circle cx="31" cy="9" r="1.8" fill="currentColor"/><circle cx="10" cy="30" r="1.1" fill="currentColor"/></svg>';

  function show(ctx, { tone, title, art, caption, prompt = '' }) {
    return ctx.present({
      className: `middle-scene middle-${tone}`,
      html: `
        <div class="middle-frame">
          <h1 class="middle-title">${title}</h1>
          ${art}
          <div class="middle-copy">
            <p aria-live="polite" data-caption>${caption}</p>
            ${prompt ? `<p class="middle-prompt">${prompt}</p>` : ''}
          </div>
        </div>`
    });
  }

  function lateNightsArtwork() {
    return `
      <div class="middle-art middle-late-art">
        <div class="middle-stars" aria-hidden="true">${starField}</div>
        <div class="middle-orbit" aria-hidden="true"><i></i></div>
        <div class="middle-calendar" aria-hidden="true">
          <i></i><i></i><i></i>
          <div class="middle-calendar-front">
            <svg viewBox="0 0 40 40" width="25" height="25">
              <path d="M12 7v8m16-8v8M8 19h24M10 11h20a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 24h.1m5.9 0h.1m5.9 0h.1M14 28h.1m5.9 0h.1" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <div class="middle-illustrative" role="group" aria-label="Illustrative dialogue">
          <div class="middle-clock" data-middle-clock>12:00 <small>AM</small></div>
          <div class="middle-late-chat">
            <p class="middle-dialogue-label">Illustrative dialogue</p>
            <p class="middle-bubble" data-first-bubble hidden>Matutulog na talaga ako HAHAHA</p>
            <p class="middle-bubble" data-second-bubble hidden>one more chika HAHAHA</p>
          </div>
        </div>
      </div>`;
  }

  async function friendship(ctx) {
    const title = 'From Strangers<br>to Best Friends';
    show(ctx, {
      tone: 'sketch',
      title,
      art: `
        <button type="button" class="middle-art middle-sketch-button" data-sketchbook>
          <img src="assets/sketch-closed.svg" alt="" decoding="async">
          <span class="middle-art-button"><span>Open the sketchbook</span>${arrow}</span>
        </button>`,
      caption: 'At first, we only talked once in a while.'
    });
    await ctx.action('[data-sketchbook]', () => ctx.sound('whoosh'));

    show(ctx, {
      tone: 'sketch middle-sketch-open',
      title,
      art: `<div class="middle-art middle-artwork"><img src="assets/sketch-open.svg" alt="An open sketchbook with a pencil painting of mountains at sunset." decoding="async"></div>`,
      caption: 'Then we found things we both loved—anime, art, and stories.'
    });
    await ctx.wait(10500);

    const scene = show(ctx, {
      tone: 'late',
      title: 'Five more minutes',
      art: lateNightsArtwork(),
      caption: 'As more days went by, we talked more often.'
    });
    const time = scene.querySelector('[data-middle-clock]');
    const sky = scene.querySelector('.middle-late-art');

    await ctx.wait(4500);
    scene.querySelector('[data-first-bubble]').hidden = false;
    ctx.sound('type');

    await ctx.wait(4600);
    scene.querySelector('[data-second-bubble]').hidden = false;
    ctx.sound('chime');

    await ctx.wait(4800);
    time.innerHTML = '3:00 <small>AM</small>';
    sky.classList.add('is-dawn');
    ctx.caption('Five more minutes turned into hours.');

    await ctx.wait(5800);
    time.innerHTML = '4:00 <small>AM</small>';
    await ctx.wait(3500);
    ctx.caption('We never decided to become best friends. Somehow, we already were.');
    await ctx.wait(10300);
  }

  function comfortArtwork() {
    return `
      <div class="middle-art middle-comfort-art">
        <div class="middle-comfort-room">
          <img src="assets/room-chariz.svg" alt="" decoding="async"><span>Chariz</span>
        </div>
        <div class="middle-comfort-room">
          <img src="assets/room-raul.svg" alt="" decoding="async"><span>Raul</span>
        </div>
        <svg class="middle-thread" viewBox="0 0 360 180" preserveAspectRatio="none" aria-hidden="true">
          <path class="middle-thread-rest" d="M87 90C132 34 157 148 190 90S258 74 277 90"/>
          <path class="middle-thread-lit" d="M87 90C132 34 157 148 190 90S258 74 277 90" pathLength="1"/>
        </svg>
        <span class="middle-orb-target" aria-hidden="true">${lightIcon}</span>
        <button type="button" class="middle-light-button" data-glow aria-label="Send the light from Chariz's room to Raul's room">${lightIcon}</button>
      </div>`;
  }

  function enableGlowDrag(button, art) {
    let drag = null;

    button.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || button.disabled) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      button.setPointerCapture(event.pointerId);
    });

    button.addEventListener('pointermove', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 9) return;

      drag.moved = true;
      art.classList.add('is-dragging');
      const bounds = art.getBoundingClientRect();
      const x = Math.min(87, Math.max(13, (event.clientX - bounds.left) / bounds.width * 100));
      const y = Math.min(84, Math.max(16, (event.clientY - bounds.top) / bounds.height * 100));
      button.style.setProperty('--orb-x', `${x}%`);
      button.style.setProperty('--orb-y', `${y}%`);
    });

    button.addEventListener('pointerup', (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const moved = drag.moved;
      drag = null;
      art.classList.remove('is-dragging');
      if (moved) button.click();
    });

    button.addEventListener('pointercancel', () => {
      drag = null;
      art.classList.remove('is-dragging');
      button.style.removeProperty('--orb-x');
      button.style.removeProperty('--orb-y');
    });
  }

  function warmthArtwork() {
    return `
      <div class="middle-art middle-warmth-art" aria-hidden="true">
        <div class="middle-stars">${starField}</div>
        <div class="middle-warmth-bubbles">
          <div class="middle-warmth-bubble">
            <span class="middle-warmth-dots"><i></i><i></i><i></i></span>
          </div>
          <div class="middle-warmth-bubble">
            <svg viewBox="0 0 32 32" width="34" height="34"><path d="M16 27C13 24 5 19 4 13a6.3 6.3 0 0 1 12-3 6.3 6.3 0 0 1 12 3c-1 6-9 11-12 14Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </div>
        </div>
        <svg class="middle-warmth-thread" viewBox="0 0 360 120"><path d="M10 80c85 25 101-80 173-53 63 24 98 71 165 28" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 8" stroke-linecap="round"/></svg>
      </div>`;
  }

  function meetingStarsArtwork(together) {
    return `
      <div class="middle-art middle-meeting-sky${together ? ' is-together' : ''}" aria-hidden="true">
        <div class="middle-stars">${starField}</div>
        <div class="middle-meeting-orbit"></div>
        <div class="middle-meeting-star">${lightIcon}</div>
        <div class="middle-meeting-star">${lightIcon}</div>
        <div class="middle-meeting-glow"></div>
      </div>`;
  }

  async function moreThanFriends(ctx) {
    const scene = show(ctx, {
      tone: 'comfort',
      title: 'My Safe Place',
      art: comfortArtwork(),
      caption: 'We became the people we turned to on hard days.',
      prompt: 'Tap or drag the light'
    });

    const art = scene.querySelector('.middle-comfort-art');
    const button = scene.querySelector('[data-glow]');
    enableGlowDrag(button, art);
    await ctx.action('[data-glow]', () => {
      art.classList.add('is-sent');
      button.disabled = true;
      scene.querySelector('.middle-prompt').classList.add('is-done');
      ctx.sound('chime');
    });
    ctx.caption('When I was down, you were there. And when you needed me, I wanted to be there too.');
    await ctx.wait(14500);

    show(ctx, {
      tone: 'warmth',
      title: 'More Than Friends',
      art: warmthArtwork(),
      caption: 'Somewhere along the way, friendship turned into something more.'
    });
    await ctx.wait(12500);

    show(ctx, {
      tone: 'promise',
      title: 'More Than Friends',
      art: meetingStarsArtwork(false),
      caption: 'We promised we’d make it official when we finally met.'
    });
    await ctx.wait(14000);
  }

  async function firstDate(ctx) {
    const title = 'The Promise We Kept';
    show(ctx, {
      tone: 'promise',
      title,
      art: meetingStarsArtwork(true),
      caption: 'It wasn’t easy to make that day happen.'
    });
    await ctx.wait(7900);
    ctx.sound('chime');

    const scene = show(ctx, {
      tone: 'mall',
      title,
      art: `
        <div class="middle-art middle-mall-art">
          <img src="assets/mall.svg" alt="Chariz and his girlfriend Raul stand together on their first mall date." decoding="async">
          <div class="middle-mall-glow" aria-hidden="true"></div>
        </div>`,
      caption: 'But with God’s help, we finally met.'
    });
    await ctx.wait(9300);
    ctx.caption('It was a simple mall date, and being there with her meant everything to me.');
    scene.querySelector('.middle-mall-art').classList.add('is-golden');
    await ctx.wait(17800);
  }

  window.middleChapters = { 1: friendship, 2: moreThanFriends, 3: firstDate };
})();
