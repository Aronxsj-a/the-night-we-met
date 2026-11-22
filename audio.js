(() => {
  // Set this to "assets/ending-chorus.mp3" after adding an authorized clip.
  const endingChorusFile = "";

  const scores = [
    // Welcome, followed by the five chapters and the final sky.
    { beat: 1.04, chords: [[45, 52, 59, 60, 64], [41, 53, 57, 64, 67]], crickets: true },
    { beat: 0.92, chords: [[45, 52, 57, 60, 64], [41, 53, 57, 64, 67], [48, 55, 59, 62, 64], [43, 55, 57, 62, 67]], crickets: true },
    { beat: 0.78, chords: [[48, 55, 60, 64, 67], [45, 52, 57, 64, 71], [41, 53, 57, 60, 67], [43, 55, 59, 62, 69]], bright: true },
    { beat: 0.95, chords: [[50, 57, 60, 64, 65], [45, 52, 57, 59, 64], [41, 53, 57, 60, 64], [48, 55, 59, 62, 67]] },
    { beat: 0.87, chords: [[41, 53, 60, 64, 69], [48, 55, 59, 64, 67], [45, 52, 57, 60, 64], [43, 55, 57, 62, 67]], bright: true },
    { beat: 0.91, chords: [[45, 52, 60, 64, 67], [41, 53, 57, 60, 64], [50, 57, 60, 65, 69], [43, 55, 59, 62, 69]] },
    { beat: 0.98, chords: [[48, 55, 59, 64, 67], [45, 52, 57, 60, 64], [41, 53, 57, 64, 69], [48, 55, 60, 62, 67]], bright: true }
  ];

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  let context;
  let volumeBus;
  let pauseBus;
  let pianoWave;
  let noise;
  let scoreIndex = 0;
  let track;
  let scheduler;
  let paused = true;
  let volume = 0.7;
  let muted = false;
  let lastType = -Infinity;
  let chorus;
  let chorusBus;
  let chorusFailed = false;
  let chorusEnded = false;
  let chorusPlaying = false;
  let chorusPending = false;
  let chorusAttempt = 0;

  function glide(parameter, value, speed = 0.045) {
    const now = context.currentTime;
    parameter.cancelScheduledValues(now);
    parameter.setTargetAtTime(value, now, speed);
  }

  function updateVolume() {
    if (volumeBus) glide(volumeBus.gain, muted ? 0 : volume);
    if (chorus && !chorusBus) {
      chorus.volume = volume * 0.65;
      chorus.muted = muted;
    }
  }

  function buildAudio() {
    if (context || !AudioContext) return;
    try {
      context = new AudioContext();
    } catch {
      return;
    }

    volumeBus = context.createGain();
    volumeBus.gain.value = muted ? 0 : volume;
    pauseBus = context.createGain();
    pauseBus.gain.value = 0;
    volumeBus.connect(pauseBus).connect(context.destination);
    pianoWave = context.createPeriodicWave(
      new Float32Array(6),
      Float32Array.of(0, 1, 0.26, 0.13, 0.053, 0.026)
    );
  }

  function tone(bus, pitch, at, length, level, { attack = 0.01, slide, piano = false } = {}) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.frequency.setValueAtTime(pitch, at);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, at + length * 0.8);
    if (piano) oscillator.setPeriodicWave(pianoWave);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    envelope.gain.linearRampToValueAtTime(0, at + length + 0.02);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(at);
    oscillator.stop(at + length + 0.025);
  }

  function playCrickets(bus, start, measure) {
    const offset = measure % 2 === 0 ? 0.42 : 1.58;
    for (let chirp = 0; chirp < 3; chirp++) {
      const pitch = 3850 + Math.random() * 580;
      const at = start + offset + chirp * 0.078;
      tone(bus, pitch, at, 0.06, 0.0025 + Math.random() * 0.0015, { slide: pitch * 0.91 });
    }
  }

  function playMeasure(currentTrack) {
    const { bus, score, measure, nextTime } = currentTrack;
    const { chords, beat } = score;
    const chord = chords[measure % chords.length];

    // The quiet, held chord sits underneath a lightly staggered piano figure.
    chord.forEach((note, index) => {
      tone(bus, frequency(note), nextTime + index * 0.08, beat * 5.3, 0.014, { attack: beat * 0.92 });
    });
    tone(bus, frequency(chord[0] + 12), nextTime, beat * 2.9, 0.061, { piano: true });
    tone(bus, frequency(chord[3]), nextTime + beat * 0.82, beat * 2.5, 0.041, { piano: true });
    tone(bus, frequency(chord[4] + (score.bright ? 12 : 0)), nextTime + beat * 2.04, beat * 2.2, 0.045, { piano: true });
    if (measure % 2 === 0 || score.bright) {
      tone(bus, frequency(chord[2] + 12), nextTime + beat * 3.12, beat * 1.7, 0.028, { piano: true });
    }
    if (score.crickets) playCrickets(bus, nextTime, measure);
    currentTrack.nextTime += beat * 4;
    currentTrack.measure++;
  }

  function scheduleScore() {
    scheduler = undefined;
    if (!track || paused) return;

    const now = context.currentTime;
    if (track.nextTime < now) track.nextTime = now + 0.03;
    if (track.nextTime < now + 0.16) playMeasure(track);
    scheduler = window.setTimeout(scheduleScore, Math.max(60, (track.nextTime - now - 0.11) * 1000));
  }

  function cancelSchedule() {
    window.clearTimeout(scheduler);
    scheduler = undefined;
  }

  function clearTrack() {
    cancelSchedule();
    if (!track) return;
    const { bus } = track;
    track = undefined;
    if (paused) {
      bus.disconnect();
    } else {
      glide(bus.gain, 0, 0.09);
      window.setTimeout(() => bus.disconnect(), 500);
    }
  }

  function startTrack() {
    if (!context || paused || track) return;
    const bus = context.createGain();
    bus.gain.value = 0;
    bus.connect(volumeBus);
    glide(bus.gain, chorusPlaying ? 0 : 1, 0.15);
    track = { bus, score: scores[scoreIndex], measure: 0, nextTime: context.currentTime + 0.05 };
  }

  function fadeForChorus(playing) {
    chorusPlaying = playing;
    if (track) glide(track.bus.gain, playing ? 0 : 1, 0.18);
  }

  function pauseChorus() {
    chorusAttempt++;
    chorusPending = false;
    chorus?.pause();
    fadeForChorus(false);
  }

  function resetChorus() {
    pauseChorus();
    if (chorus) chorus.currentTime = 0;
    chorusEnded = false;
  }

  function createChorus() {
    chorus = new Audio(endingChorusFile);
    chorus.addEventListener("ended", () => {
      chorusEnded = true;
      fadeForChorus(false);
    });
    chorus.addEventListener("error", () => {
      chorusFailed = true;
      pauseChorus();
    });
    if (context?.createMediaElementSource) {
      try {
        const source = context.createMediaElementSource(chorus);
        chorusBus = context.createGain();
        chorusBus.gain.value = 0.65;
        source.connect(chorusBus).connect(volumeBus);
      } catch {
        // The media element's own volume is available when routing is unsupported.
      }
    }
    updateVolume();
  }

  function playChorus() {
    if (!endingChorusFile || paused || scoreIndex !== scores.length - 1 || chorusFailed || chorusEnded || chorusPlaying || chorusPending) return;
    if (!chorus) createChorus();

    const attempt = ++chorusAttempt;
    chorusPending = true;
    Promise.resolve(chorus.play()).then(() => {
      if (attempt !== chorusAttempt) return;
      chorusPending = false;
      fadeForChorus(true);
    }).catch(() => {
      if (attempt === chorusAttempt) chorusPending = false;
    });
  }

  function selectScore(index) {
    if (scoreIndex === index) return;
    scoreIndex = index;
    resetChorus();
    clearTrack();
    startTrack();
    scheduleScore();
  }

  function playWhoosh(at) {
    const length = 0.6;
    if (!noise) {
      noise = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noise;
    filter.type = "bandpass";
    filter.Q.value = 0.55;
    filter.frequency.setValueAtTime(340, at);
    filter.frequency.exponentialRampToValueAtTime(1540, at + 0.28);
    filter.frequency.exponentialRampToValueAtTime(570, at + length);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.084, at + 0.24);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    source.connect(filter).connect(envelope).connect(volumeBus);
    source.start(at);
  }

  function effect(name) {
    if (!context || paused || muted || volume === 0) return;
    const at = context.currentTime + 0.008;
    switch (name) {
      case "click":
        tone(volumeBus, 510, at, 0.095, 0.07, { slide: 380 });
        break;
      case "type":
      case "typing":
        if (at - lastType < 0.04) return;
        lastType = at;
        tone(volumeBus, 630 + Math.random() * 230, at, 0.047, 0.036, { attack: 0.003, slide: 480 });
        break;
      case "notification":
      case "chime":
        tone(volumeBus, 659, at, 0.32, 0.075, { piano: true });
        tone(volumeBus, 880, at + 0.075, 0.47, 0.057, { piano: true });
        break;
      case "send":
        tone(volumeBus, 392, at, 0.19, 0.085, { slide: 565 });
        tone(volumeBus, 784, at + 0.05, 0.25, 0.04, { piano: true });
        break;
      case "whoosh":
        playWhoosh(at);
        break;
    }
  }

  function resume() {
    paused = false;
    buildAudio();
    if (context) {
      context.resume().catch(() => {});
      glide(pauseBus.gain, 1);
      startTrack();
      if (scheduler === undefined) scheduleScore();
    }
    playChorus();
  }

  function pause() {
    if (paused) return;
    paused = true;
    cancelSchedule();
    pauseChorus();
    if (context) {
      glide(pauseBus.gain, 0);
      context.suspend().catch(() => {});
    }
  }

  window.StoryAudio = {
    unlock: resume,
    resume,
    pause,
    effect,
    chapter(index) {
      if (Number.isInteger(index) && index >= -1 && index <= 4) selectScore(index + 1);
    },
    ending() {
      selectScore(scores.length - 1);
      playChorus();
    },
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      volume = Math.min(1, Math.max(0, value));
      updateVolume();
    },
    setMuted(value) {
      muted = Boolean(value);
      updateVolume();
    },
    stop() {
      pause();
      resetChorus();
      clearTrack();
      scoreIndex = 0;
    }
  };
})();
