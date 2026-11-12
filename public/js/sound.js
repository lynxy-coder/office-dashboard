let ctx;

export function beep() {
  ctx = ctx || new AudioContext();
  const now = ctx.currentTime;

  [0, 0.25].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.2);
  });
}
