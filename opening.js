(() => {
  'use strict';

  const firstMessage = 'Kumain kana mahal?';
  const archiveDate = 'NOV 22, 2021 AT 11:10 PM';
  const nightStars = [
    [8, 17, 2], [18, 11, 1], [33, 22, 2], [43, 8, 1], [55, 15, 2],
    [62, 26, 1], [77, 12, 1], [87, 22, 3], [92, 8, 1], [12, 35, 1],
    [23, 32, 2], [46, 32, 1], [71, 35, 2], [94, 35, 2], [6, 52, 2],
    [17, 61, 1], [84, 54, 1], [94, 65, 2], [35, 76, 1], [12, 79, 2],
    [70, 77, 3], [83, 86, 1], [49, 89, 2], [30, 92, 1], [90, 93, 2]
  ];

  function starField() {
    const stars = nightStars.map(([x, y, size], index) =>
      `<span style="--x:${x}%;--y:${y}%;--size:${size}px;--delay:${index * 55}ms"></span>`
    ).join('');
    return `<div class="opening-stars" aria-hidden="true">${stars}</div>`;
  }

  function scrollChat(log) {
    log.scrollTop = log.scrollHeight;
  }

  function addMessage(log, direction, body, laughed = false) {
    const row = document.createElement('div');
    row.className = `opening-message is-${direction}`;
    row.classList.toggle('has-reaction', laughed);
    const reaction = laughed ? '<span class="opening-reaction" role="img" aria-label="Laugh reaction">😆</span>' : '';
    row.innerHTML = `<span class="opening-speaker">${direction === 'out' ? 'Chariz' : 'Stranger'}</span>
      <div class="opening-bubble">${body}</div>${reaction}`;
    log.insertBefore(row, log.querySelector('.opening-chat-status'));
    scrollChat(log);
  }

  function scatterMessages(scene, log) {
    const frame = scene.getBoundingClientRect();
    const scrollArea = log.getBoundingClientRect();
    const stars = scene.querySelector('.opening-chat-sparks');

    for (const [index, bubble] of Array.from(log.querySelectorAll('.opening-bubble')).entries()) {
      const bounds = bubble.getBoundingClientRect();
      const x = bounds.left + bounds.width / 2;
      const y = bounds.top + bounds.height / 2;
      if (y < scrollArea.top || y > scrollArea.bottom) continue;

      const spark = document.createElement('span');
      spark.style.setProperty('--x', `${x - frame.left}px`);
      spark.style.setProperty('--y', `${y - frame.top}px`);
      spark.style.setProperty('--delay', `${index * 60}ms`);
      spark.style.setProperty('--drift', `${(index - 2.5) * 17}px`);
      stars.append(spark);
    }
    scene.classList.add('opening-chat-stars');
  }

  async function showChat(ctx) {
    const scene = ctx.present({className: 'opening-chat', html: `
      <div class="opening-chat-frame">
        <header class="opening-chat-head">
          <span class="opening-chat-avatar" aria-hidden="true"></span>
          <div><p class="eyebrow">Archived conversation</p><h2 aria-live="polite">Stranger</h2></div>
        </header>
        <div class="opening-chat-log" role="log" aria-label="Messages from November 22, 2021" aria-live="polite">
          <time class="opening-chat-date" datetime="2021-11-22T23:10">${archiveDate}</time>
          <div class="opening-chat-status" hidden><span></span><span></span><span></span><span class="opening-speaker">Stranger is typing</span></div>
        </div>
        <button class="primary opening-start" type="button" data-start-conversation>Start Conversation</button>
        <div class="opening-chat-dock">
          <div class="opening-compose" aria-label="Message draft"><span class="opening-compose-text">Message</span></div>
          <button class="opening-send" type="button" disabled>Send</button>
        </div>
        <p class="opening-chat-hint" hidden>Tap the background to advance</p>
      </div>
      ${starField()}
      <div class="opening-chat-sparks" aria-hidden="true"></div>
    `});
    const log = scene.querySelector('.opening-chat-log');
    const status = scene.querySelector('.opening-chat-status');
    const start = scene.querySelector('[data-start-conversation]');
    const draft = scene.querySelector('.opening-compose-text');
    const send = scene.querySelector('.opening-send');
    const hint = scene.querySelector('.opening-chat-hint');

    await ctx.action('[data-start-conversation]', () => ctx.sound('click'));
    start.hidden = true;
    draft.classList.add('is-typing');
    draft.textContent = '';
    await ctx.wait(550);
    for (const [index, character] of Array.from(firstMessage).entries()) {
      draft.textContent += character;
      if (character.trim()) ctx.sound('type');
      await ctx.wait(75 + index % 4 * 31);
    }
    draft.classList.remove('is-typing');
    draft.classList.add('is-ready');
    send.disabled = false;
    await ctx.action('.opening-send', () => {
      addMessage(log, 'out', firstMessage);
      draft.textContent = 'Message';
      draft.classList.remove('is-ready');
      send.disabled = true;
      hint.hidden = false;
      ctx.sound('send');
    });

    async function waitForMessage(ms) {
      await ctx.wait(ms, {skip: true});
    }

    async function typeResponse(ms) {
      status.hidden = false;
      scrollChat(log);
      ctx.sound('type');
      await waitForMessage(ms);
      status.hidden = true;
    }

    await waitForMessage(1400);
    await typeResponse(2200);
    addMessage(log, 'in', 'putik', true);
    ctx.sound('chime');
    await waitForMessage(850);
    await typeResponse(1850);
    addMessage(log, 'in', 'ok ka lng?');
    ctx.sound('chime');
    await waitForMessage(2000);
    addMessage(log, 'out', 'HAHAHAHA', true);
    ctx.sound('send');
    await waitForMessage(2200);
    addMessage(log, 'out', '<span class="opening-reply">Replying to <q>ok ka lng?</q></span>ok pa namn HAHAHAHA');
    ctx.sound('send');
    await waitForMessage(2500);
    addMessage(log, 'out', `<span class="opening-link-card"><span class="opening-link-icon" aria-hidden="true"></span>
      <span><strong>TikTok</strong><small>Archived link preview</small></span></span>`);
    ctx.sound('send');
    await waitForMessage(4600);
    hint.hidden = true;
    scene.querySelector('.opening-chat-head h2').textContent = 'Raul';
    scene.classList.add('opening-chat-identified');
    await ctx.wait(2200);
    scatterMessages(scene, log);
    ctx.sound('whoosh');
    await ctx.wait(2200);
  }

  window.openingChapter = async (ctx) => {
    ctx.present({className: 'opening-date', html: `
      ${starField()}
      <div class="opening-date-type">
        <span class="opening-petal" aria-hidden="true">✦</span>
        <p class="eyebrow"><time datetime="2021-11-22">November 22, 2021</time></p>
        <h1>11:10 <span>PM</span></h1>
      </div>
    `});
    await ctx.wait(5000);

    const room = ctx.present({className: 'opening-room', html: `
      <img class="opening-bedroom" src="assets/room-chariz.svg" alt="Chariz sits with her phone in a quiet bedroom">
      <div class="opening-vignette" aria-hidden="true"></div>
      <div class="opening-room-copy scene-copy">
        <p data-caption>It was just another boring night. I picked up my phone and messaged someone I didn't know.</p>
        <div class="opening-room-prompt" hidden>
          <h2>Are you bored?</h2>
          <button class="primary" type="button" data-bored>A little...</button>
        </div>
      </div>
    `});
    await ctx.wait(6700);
    room.querySelector('.opening-room-prompt').hidden = false;
    await ctx.action('[data-bored]', () => ctx.sound('click'));

    ctx.present({className: 'opening-crossing', html: `
      <div class="opening-crossing-sky" aria-hidden="true">${starField()}<i></i><i></i><i></i></div>
      <img class="opening-bedroom" src="assets/room-raul.svg" alt="A light glows in another bedroom across the night">
      <div class="opening-vignette" aria-hidden="true"></div>
      <div class="opening-thread" aria-hidden="true"><span></span></div>
    `});
    ctx.sound('whoosh');
    await ctx.wait(7100);

    await showChat(ctx);

    ctx.present({className: 'opening-title', html: `
      ${starField()}
      <div class="opening-title-type">
        <span class="opening-petal" aria-hidden="true">✦</span>
        <h1>The Night<br>We Met</h1>
        <p>I had no idea that a random message would change my life.</p>
      </div>
    `});
    ctx.sound('chime');
    await ctx.wait(10600);
  };
})();
