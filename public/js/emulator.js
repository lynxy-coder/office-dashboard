// Имитация опроса контроллеров. Работает и на сервере, и в браузере (демо-режим).

const round = (n, digits) => Math.round(n * 10 ** digits) / 10 ** digits;

export function createEmulator(equipment) {
  const units = new Map(
    equipment.map((eq) => [
      eq.id,
      { eq, temp: eq.temp, press: eq.press, fault: false, mode: eq.modes ? 'supply' : null, dist: null },
    ]),
  );

  const tempSetpoint = (u) => (u.mode ? u.eq.modes[u.mode] : u.eq.temp);

  function step(u, key, setpoint) {
    const offset = u.dist && u.dist.key === key ? u.dist.offset : 0;
    const noise = (Math.random() * 2 - 1) * u.eq.limits[key].warn * 0.03;
    u[key] += (setpoint + offset - u[key]) * 0.15 + noise;
  }

  return {
    tick() {
      return [...units.values()].map((u) => {
        // иногда параметр уходит от уставки на 20-40 секунд
        if (!u.dist && Math.random() < 0.006) {
          const key = Math.random() < 0.5 ? 'temp' : 'press';
          const size = u.eq.limits[key].alarm * (0.6 + Math.random() * 0.8);
          u.dist = {
            key,
            offset: Math.random() < 0.5 ? -size : size,
            left: 20 + Math.floor(Math.random() * 20),
          };
        }

        step(u, 'temp', tempSetpoint(u));
        step(u, 'press', u.eq.press);
        if (u.dist && --u.dist.left <= 0) u.dist = null;

        return {
          id: u.eq.id,
          temp: u.fault ? null : round(u.temp, 1),
          press: round(u.press, u.eq.digits + 1),
          fault: u.fault,
          mode: u.mode,
          tempSp: tempSetpoint(u),
        };
      });
    },

    toggleFault(id) {
      const u = units.get(id);
      if (u) u.fault = !u.fault;
    },

    setMode(id, mode) {
      const u = units.get(id);
      if (u && u.eq.modes && u.eq.modes[mode] !== undefined) u.mode = mode;
    },
  };
}
