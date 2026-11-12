import { conditions, worst } from './alarms.js';

const HISTORY_LIMIT = 300; // 5 минут при опросе раз в секунду

export const state = {
  equipment: [],
  telemetry: new Map(),
  history: new Map(),
  alarms: [],
  connection: 'connecting',
  selectedId: null,
  filters: { floor: 'all', type: 'all', status: 'all', search: '' },
  sound: false,
};

let nextAlarmId = 1;

export function setEquipment(list) {
  state.equipment = list;
  state.history = new Map(list.map((eq) => [eq.id, []]));
  state.selectedId = list[0]?.id ?? null;
}

export function statusOf(id) {
  const t = state.telemetry.get(id);
  const online = state.connection === 'online' || state.connection === 'demo';
  if (!t || !online) return 'offline';
  return worst(conditions(state.equipment.find((eq) => eq.id === id), t));
}

export function applyTelemetry(items, ts) {
  const raised = [];

  for (const item of items) {
    const eq = state.equipment.find((e) => e.id === item.id);
    state.telemetry.set(item.id, item);

    const history = state.history.get(item.id);
    history.push({ t: ts, temp: item.temp, press: item.press });
    if (history.length > HISTORY_LIMIT) history.shift();

    const found = conditions(eq, item);
    const open = state.alarms.filter((a) => a.equipmentId === eq.id && !a.clearedAt);

    for (const c of found) {
      const old = open.find((a) => a.code === c.code);
      if (!old) {
        const alarm = { id: nextAlarmId++, equipmentId: eq.id, name: eq.name, ...c, raisedAt: ts, clearedAt: null, acked: false };
        state.alarms.unshift(alarm);
        if (c.level === 'alarm') raised.push(alarm);
      } else if (old.level === 'warning' && c.level === 'alarm') {
        // было предупреждение, стало аварией - снова просим квитировать
        old.level = 'alarm';
        old.acked = false;
        raised.push(old);
      }
    }

    for (const a of open) {
      if (!found.some((c) => c.code === a.code)) a.clearedAt = ts;
    }
  }

  // архив не растёт бесконечно
  const archive = state.alarms.filter((a) => a.clearedAt);
  if (archive.length > 100) {
    const drop = new Set(archive.slice(100));
    state.alarms = state.alarms.filter((a) => !drop.has(a));
  }

  return raised;
}

export function ack(id) {
  const alarm = state.alarms.find((a) => a.id === id);
  if (alarm) alarm.acked = true;
}

export const activeAlarms = () => state.alarms.filter((a) => !a.clearedAt);
export const archivedAlarms = () => state.alarms.filter((a) => a.clearedAt);
