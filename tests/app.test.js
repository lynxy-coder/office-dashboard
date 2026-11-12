import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EQUIPMENT } from '../public/js/equipment.js';
import { conditions, worst } from '../public/js/alarms.js';
import { filterEquipment } from '../public/js/filters.js';
import { state, setEquipment, applyTelemetry, activeAlarms } from '../public/js/state.js';

const ahu = EQUIPMENT.find((eq) => eq.id === 'ahu-1'); // уставка 22 °C, 300 Па

test('в норме нарушений нет', () => {
  assert.equal(worst(conditions(ahu, { temp: 22, press: 300 })), 'ok');
});

test('отклонение температуры: предупреждение и авария', () => {
  assert.equal(worst(conditions(ahu, { temp: 24.5, press: 300 })), 'warning');
  assert.equal(worst(conditions(ahu, { temp: 27, press: 300 })), 'alarm');
});

test('отказ датчика - авария', () => {
  const list = conditions(ahu, { temp: null, press: 300 });
  assert.equal(list[0].code, 'TEMP_FAULT');
});

test('уставка берётся из режима регулирования', () => {
  assert.equal(worst(conditions(ahu, { temp: 24, press: 300, tempSp: 22 })), 'warning');
  assert.equal(worst(conditions(ahu, { temp: 24, press: 300, tempSp: 24 })), 'ok');
});

test('фильтр по типу и поиск', () => {
  const all = { floor: 'all', type: 'all', status: 'all', search: '' };
  const ok = () => 'ok';
  assert.equal(filterEquipment(EQUIPMENT, { ...all, type: 'chiller' }, ok).length, 2);
  assert.equal(filterEquipment(EQUIPMENT, { ...all, search: 'pump-2' }, ok).length, 1);
});

test('авария появляется и снимается', () => {
  setEquipment(EQUIPMENT);
  state.connection = 'online';

  applyTelemetry([{ id: 'ahu-1', temp: 27, press: 300 }], 1000);
  assert.equal(activeAlarms().length, 1);

  applyTelemetry([{ id: 'ahu-1', temp: 22, press: 300 }], 2000);
  assert.equal(activeAlarms().length, 0);
});
