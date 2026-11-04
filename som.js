(() => {
  'use strict';

  // Oito compassos originais. Notas em MIDI e posições em tempos de semínima.
  const song = [
    { bass: [50, 45], strings: [57, 61, 64, 66], tune: [[0.5, 69, 0.7], [1.5, 66, 0.4], [2.25, 64, 1.2]] },
    { bass: [47, 42], strings: [57, 62, 64, 66], tune: [[0, 62, 0.6], [1, 64, 0.3], [1.75, 66, 0.7], [3, 69, 0.8]] },
    { bass: [40, 47], strings: [55, 59, 62, 66], tune: [[0.5, 71, 1.0], [2, 69, 0.5], [3, 67, 0.7]] },
    { bass: [45, 52], strings: [55, 59, 61, 66], tune: [[0.25, 66, 0.9], [1.75, 64, 1.4]] },
    { bass: [42, 49], strings: [57, 61, 64, 68], tune: [[0.5, 68, 0.7], [1.5, 69, 0.4], [2.25, 73, 0.9], [3.5, 71, 0.45]] },
    { bass: [47, 42], strings: [57, 60, 63, 66], tune: [[0, 69, 1.0], [1.75, 66, 0.7], [3, 63, 0.75]] },
    { bass: [40, 47], strings: [55, 59, 62, 66], tune: [[0, 64, 1.2], [1.75, 67, 0.5], [2.5, 71, 0.65]] },
    { bass: [45, 52], strings: [55, 59, 62, 64], tune: [[0, 69, 0.8], [1.25, 67, 0.4], [2, 64, 0.7], [3.25, 61, 0.5]] },
  ];
  const beat = 60 / 91;
  const events = song.flatMap(({ bass, strings, tune }, bar) => {
    const base = 4 * bar;
    const notes = bass.map((pitch, i) => [base + 2 * i, pitch, 0.98, 0.17, 'bass']);
    const batida = bar % 2 ? [0.5, 1.75, 2.5, 3.5] : [0, 1.5, 2.75];
    for (const [stroke, offset] of batida.entries()) {
      strings.forEach((pitch, string) => {
        const stagger = (stroke % 2 ? 3 - string : string) * 0.012;
        notes.push([base + offset + stagger, pitch, stroke % 2 ? 0.52 : 0.82, 0.054, 'chord']);
      });
    }
    for (const [offset, pitch, length] of tune) {
      notes.push([base + offset, pitch, length, 0.115, 'lead']);
    }
    return notes;
  }).sort((a, b) => a[0] - b[0]);

  let context;
  let active;

  function pluck(bus, start, pitch, duration, level, voice) {
    const hz = 440 * 2 ** ((pitch - 69) / 12);
    const length = duration * beat + 0.17;
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const string = context.createOscillator();
    string.type = voice === 'bass' ? 'sine' : 'triangle';
    string.frequency.value = hz;
    filter.type = 'lowpass';
    filter.Q.value = 0.22;
    filter.frequency.setValueAtTime(hz * 5.4, start);
    filter.frequency.exponentialRampToValueAtTime(hz * 1.65, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.009);
    gain.gain.exponentialRampToValueAtTime(level * 0.45, start + 0.073);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    string.connect(filter).connect(gain).connect(bus);
    string.start(start);
    string.stop(start + length + 0.02);
    string.onended = () => {
      string.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  function run(session) {
    if (active !== session) return;
    const now = context.currentTime;
    if (now - session.start - session.turn * 32 * beat > 32 * beat + 0.2) {
      session.turn = Math.floor((now - session.start) / (32 * beat));
      session.index = 0;
    }
    while (true) {
      const [offset, pitch, duration, volume, voice] = events[session.index];
      const at = session.start + (session.turn * 32 + offset) * beat;
      if (at >= now + 0.16) break;
      if (at >= now - 0.025) pluck(session.bus, Math.max(at, now), pitch, duration, volume, voice);
      if (++session.index === events.length) {
        session.index = 0;
        session.turn++;
      }
    }
  }

  function parar() {
    if (!active) return;
    const session = active;
    active = null;
    clearInterval(session.timer);
    const now = context.currentTime;
    session.master.gain.cancelScheduledValues(now);
    session.master.gain.setValueAtTime(session.master.gain.value, now);
    session.master.gain.linearRampToValueAtTime(0.0001, now + 0.065);
    setTimeout(() => {
      session.nodes.forEach(node => node.disconnect());
      if (!active && context.state === 'running') context.suspend().catch(() => {});
    }, 100);
  }

  async function iniciar() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (active) return active.ready;
    try {
      if (!context || context.state === 'closed') context = new Audio();
      const bus = context.createGain();
      const master = context.createGain();
      const echo = context.createDelay();
      const room = context.createGain();
      master.gain.value = 0.52;
      echo.delayTime.value = 0.094;
      room.gain.value = 0.095;
      bus.connect(master).connect(context.destination);
      bus.connect(echo).connect(room).connect(master);
      const session = { bus, master, nodes: [bus, echo, room, master], index: 0, turn: 0 };
      active = session;
      session.ready = (async () => {
        try {
          await context.resume();
          if (active !== session) return false;
          session.start = context.currentTime + 0.04;
          run(session);
          session.timer = setInterval(() => run(session), 55);
          return true;
        } catch {
          if (active === session) parar();
          return false;
        }
      })();
      return session.ready;
    } catch {
      return false;
    }
  }

  window.Trilha = { iniciar, parar };
})();
