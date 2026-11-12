function deviation(key, value, setpoint, eq) {
  const diff = value - setpoint;
  const { warn, alarm } = eq.limits[key];
  if (Math.abs(diff) < warn) return null;

  const name = key === 'temp' ? 'Температура' : 'Давление';
  return {
    code: `${key.toUpperCase()}_${diff > 0 ? 'HIGH' : 'LOW'}`,
    level: Math.abs(diff) >= alarm ? 'alarm' : 'warning',
    text: `${name} ${diff > 0 ? 'выше' : 'ниже'} нормы`,
  };
}

export function conditions(eq, t) {
  const list = [];

  if (t.temp === null) {
    list.push({ code: 'TEMP_FAULT', level: 'alarm', text: 'Отказ датчика температуры' });
  } else {
    list.push(deviation('temp', t.temp, t.tempSp ?? eq.temp, eq));
  }
  list.push(deviation('press', t.press, eq.press, eq));

  return list.filter(Boolean);
}

export function worst(list) {
  if (list.some((c) => c.level === 'alarm')) return 'alarm';
  return list.length ? 'warning' : 'ok';
}
