(() => {
  const montage = [
    {
      title: 'A random message',
      art: 'room-chariz.svg',
      detail: '<span class="ending-quote-label">From the archive</span><span class="ending-quote-bubble">Kumain kana mahal?</span>'
    },
    {
      title: 'Things we both loved',
      art: 'sketch-open.svg',
      detail: '<span class="ending-tile-note">Anime, art, and stories</span>'
    },
    {
      title: 'Five more minutes',
      art: 'room-raul.svg',
      detail: '<span class="ending-clock">3–4 <small>AM</small></span>'
    },
    {
      title: 'Someone to turn to',
      art: null,
      detail: '<span class="ending-tile-note">Through the hard days</span>'
    },
    {
      title: 'The day we met',
      art: 'mall.svg',
      detail: '<span class="ending-tile-note">A simple mall date</span>'
    }
  ];

  const panels = [
    'Hi, mahal. Five years ago, I sent a random message because I was bored. I never imagined it would lead me to you. We started as internet friends, talking once in a while, then somehow you became the person I wanted to talk to every day.',
    'From sharing stories about anime and art to staying up until 3 or 4 in the morning, every little moment brought us closer. We never really planned to become best friends. We just did.',
    "You became my comfort person, the one I wanted beside me during the difficult days. And when we finally met, even after everything that made it hard, I knew it was worth it. I'm grateful to God that we made it there.",
    "We're not perfect. We get upset and we don't always understand each other right away. But we keep trying, and we keep choosing us. Thank you for being my best friend and my love. Whatever comes next, I still want to face it with you.",
    'ILOVEYOUUUUBABYYKO!!!<br>Still yours, still choosing you.<br><span class="ending-signature">— Chariz ❤️</span>'
  ];

  const twoWindows = `
    <div class="ending-paired-windows" aria-hidden="true">
      <img src="assets/room-chariz.svg" width="420" height="748" alt="">
      <img src="assets/room-raul.svg" width="420" height="748" alt="">
      <svg viewBox="0 0 400 125" preserveAspectRatio="none">
        <path d="M0 94 C91 106 109 26 200 51 S321 110 400 29"/>
        <circle cx="200" cy="51" r="3"/>
      </svg>
    </div>`;

  const sky = (alt = '') => `<img class="ending-sky-art" src="assets/ending-sky.svg" width="420" height="748" alt="${alt}">`;
  const sharedSkyAlt = 'Chariz and his girlfriend Raul sit together under the stars.';

  const preloadArt = () => {
    for (const source of ['room-chariz.svg', 'room-raul.svg', 'sketch-open.svg', 'mall.svg', 'ending-sky.svg']) {
      const image = new Image();
      image.src = `assets/${source}`;
    }
  };

  const showMontage = async (ctx) => {
    for (const [index, frame] of montage.entries()) {
      ctx.present({
        className: `ending-scene ending-montage ending-montage-${index + 1}`,
        html: `
          <div class="ending-montage-content">
            <p class="eyebrow">Five years of us</p>
            <div class="ending-memory-art">
              ${frame.art ? `<img src="assets/${frame.art}" alt="">` : twoWindows}
              <div class="ending-memory-detail">${frame.detail}</div>
            </div>
            <h2>${frame.title}</h2>
            <div class="ending-montage-steps" aria-hidden="true">
              ${montage.map((_, marker) => `<span class="${marker === index ? 'is-current' : ''}"></span>`).join('')}
            </div>
          </div>`
      });
      if (index === 0 || index === montage.length - 1) ctx.sound('chime');
      await ctx.wait(index === 0 ? 5500 : 5050, { skip: true });
    }
  };

  const showDate = async (ctx) => {
    ctx.present({
      className: 'ending-scene ending-date',
      html: `
        ${sky()}
        <div class="ending-date-content">
          <p class="eyebrow">Five years since that first message</p>
          <div class="ending-calendar">
            <div class="ending-calendar-tabs" aria-hidden="true"><i></i><i></i></div>
            <span>NOVEMBER</span>
            <b>22</b>
            <time datetime="2026-11-22" aria-label="November 22, 2026">
              <span aria-hidden="true" class="ending-calendar-years">
                <span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span><span>2026</span>
              </span>
            </time>
          </div>
          <p class="ending-anniversary-copy" data-caption aria-live="polite"></p>
        </div>`
    });
    await ctx.wait(5100, { skip: true });
    ctx.caption("We're not a perfect couple. We have hard days and disagreements. But we always find a way to be there for each other.");
    await ctx.wait(12400, { skip: true });
  };

  const presentChat = (ctx) => ctx.present({
    className: 'ending-scene ending-chat',
    html: `
      <div class="ending-chat-shell">
        <header class="ending-chat-header">
          <svg viewBox="0 0 32 32" class="ending-chat-avatar" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="currentColor"/>
            <circle cx="16" cy="12" r="5" fill="#e0e0e9"/>
            <path d="M7 25c1-9 17-9 18 0" fill="#e0e0e9"/>
          </svg>
          <div><h2>Raul</h2><p>Anniversary letter · draft</p></div>
        </header>
        <div class="ending-chat-history">
          <p class="ending-chat-timestamp">From Chariz to Raul · Archive<br>NOV 22, 2021 AT 11:10 PM</p>
          <div class="ending-chat-bubble">Kumain kana mahal?</div>
          <p class="ending-chat-timestamp">NOV 22, 2026</p>
          <div class="ending-chat-message" aria-live="polite"></div>
        </div>
        <div class="ending-chat-actions">
          <button class="primary" type="button" data-read-letter>Read One Last Message</button>
        </div>
      </div>`
  });

  const showChat = async (ctx) => {
    const scene = presentChat(ctx);
    await ctx.action('[data-read-letter]');
    ctx.sound('click');
    scene.querySelector('[data-read-letter]').disabled = true;
    const message = scene.querySelector('.ending-chat-message');
    message.innerHTML = '<div class="ending-chat-typing" aria-label="Chariz is typing"><i></i><i></i><i></i></div>';
    ctx.sound('type');
    await ctx.wait(2450);
    message.innerHTML = '<div class="ending-chat-bubble">Hi, mahal. Five years ago, I sent a random message because I was bored.</div>';
    ctx.sound('send');
    await ctx.wait(3250);
  };

  const showLetter = async (ctx) => {
    for (const [index, text] of panels.entries()) {
      const last = index === panels.length - 1;
      const scene = ctx.present({
        className: 'ending-scene ending-letter',
        html: `
          <div class="ending-letter-layout">
            <article class="ending-letter-paper" tabindex="-1" aria-labelledby="ending-letter-title">
              <p class="eyebrow">Anniversary letter · draft</p>
              <h2 id="ending-letter-title">For Raul</h2>
              <p class="ending-letter-byline">From Chariz</p>
              <p class="ending-letter-words${last ? ' ending-letter-goodbye' : ''}">${text}</p>
              <div class="ending-letter-steps" role="img" aria-label="Page ${index + 1} of ${panels.length}">
                ${panels.map((_, marker) => `<span class="${marker === index ? 'is-current' : ''}" aria-hidden="true"></span>`).join('')}
              </div>
            </article>
            <button class="primary" type="button" data-letter-next>${last ? 'Look up at the sky' : 'Continue reading'}</button>
          </div>`
      });
      scene.querySelector('.ending-letter-paper').focus({ preventScroll: true });
      await ctx.action('[data-letter-next]');
      ctx.sound(last ? 'chime' : 'click');
    }
  };

  const showSharedSky = async (ctx) => {
    ctx.endingMusic();
    ctx.present({
      className: 'ending-scene ending-together',
      html: `${sky(sharedSkyAlt)}<div class="ending-separate">${twoWindows}</div>`
    });

    await ctx.wait(11500, { skip: true });
    ctx.complete();

    const scene = ctx.present({
      className: 'ending-scene ending-together ending-finale',
      html: `
        ${sky(sharedSkyAlt)}
        <div class="ending-finale-content">
          <span class="ending-finale-star" aria-hidden="true">✦</span>
          <h2 tabindex="-1">Our Story<br>Continues...</h2>
          <div class="ending-finale-actions">
            <button class="primary" type="button" data-ending-universe>Our Little Universe</button>
            <button class="ending-replay" type="button" data-ending-replay>Replay</button>
          </div>
        </div>`
    });
    scene.querySelector('h2').focus({ preventScroll: true });
    scene.querySelector('[data-ending-universe]').addEventListener('click', () => {
      ctx.sound('click');
      ctx.universe();
    });
    scene.querySelector('[data-ending-replay]').addEventListener('click', () => {
      ctx.sound('click');
      ctx.replay();
    });
  };

  window.endingChapter = async (ctx) => {
    preloadArt();
    await showMontage(ctx);
    await showDate(ctx);
    await showChat(ctx);
    await showLetter(ctx);
    await showSharedSky(ctx);
  };
})();
