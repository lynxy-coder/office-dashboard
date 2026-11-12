import { loadEquipment } from './api.js';
import { startDataSource } from './socket.js';
import { state, setEquipment, applyTelemetry, ack } from './state.js';
import { renderAll, fillFilters, setAlarmView } from './render.js';
import { initCharts, updateCharts } from './charts.js';
import { beep } from './sound.js';

const $ = (id) => document.getElementById(id);

function refresh() {
  renderAll();
  updateCharts();

  const eq = state.equipment.find((e) => e.id === state.selectedId);
  $('selected-name').textContent = eq ? eq.name : '—';
  $('control-mode-box').hidden = !eq?.modes;

  // пока список в фокусе, значение не трогаем
  const mode = state.telemetry.get(state.selectedId)?.mode;
  if (mode && document.activeElement !== $('control-mode')) $('control-mode').value = mode;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('theme-toggle').textContent = theme === 'light' ? 'Тёмная тема' : 'Светлая тема';
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // в приватном режиме localStorage может быть недоступен: тема просто не запомнится
  }
}

function savedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
}

function select(id) {
  state.selectedId = id;
  refresh();
}

async function start() {
  setEquipment(await loadEquipment());
  fillFilters();
  setTheme(savedTheme() || 'dark');

  if (!initCharts($('chart-temperature'), $('chart-pressure'))) $('charts-warning').hidden = false;

  const source = startDataSource({
    onStatus(status) {
      state.connection = status;
      refresh();
    },
    onTelemetry(items, ts) {
      const raised = applyTelemetry(items, ts);
      if (raised.length && state.sound) beep();
      refresh();
    },
  });

  $('cards').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) select(card.dataset.id);
  });

  $('cards').addEventListener('keydown', (e) => {
    const card = e.target.closest('.card');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      select(card.dataset.id);
    }
  });

  for (const key of ['floor', 'type', 'status', 'search']) {
    $(`filter-${key}`).addEventListener('input', (e) => {
      state.filters[key] = e.target.value;
      refresh();
    });
  }

  document.querySelectorAll('[data-alarm-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      setAlarmView(tab.dataset.alarmView);
      refresh();
    });
  });

  $('alarm-list').addEventListener('click', (e) => {
    const button = e.target.closest('[data-ack]');
    if (!button) return;
    ack(Number(button.dataset.ack));
    refresh();
  });

  $('control-mode').addEventListener('change', (e) => source.setMode(state.selectedId, e.target.value));
  $('fail-sensor').addEventListener('click', () => source.toggleFault(state.selectedId));

  // звук можно включить только кликом, так хочет браузер
  $('sound-toggle').addEventListener('click', () => {
    state.sound = !state.sound;
    $('sound-toggle').textContent = state.sound ? 'Звук: вкл' : 'Звук: выкл';
    if (state.sound) beep();
  });

  $('theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    updateCharts();
  });

  refresh();
}

start();
