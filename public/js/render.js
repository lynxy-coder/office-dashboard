import { TYPES, MODES, floorLabel } from './equipment.js';
import { state, statusOf, activeAlarms, archivedAlarms } from './state.js';
import { filterEquipment } from './filters.js';

const STATUS = { ok: 'Норма', warning: 'Предупреждение', alarm: 'Авария', offline: 'Нет связи' };
const CONNECTION = {
  connecting: 'Подключение…',
  online: 'Связь есть',
  offline: 'Нет связи, переподключение…',
  demo: 'Демо-режим (без сервера)',
};

export let alarmView = 'active';
export const setAlarmView = (view) => (alarmView = view);

const cards = new Map();
let lastAlarmsHtml = '';

const $ = (id) => document.getElementById(id);
const time = (ts) => new Date(ts).toLocaleTimeString('ru-RU');

export function fillFilters() {
  const floors = [...new Set(state.equipment.map((eq) => eq.floor))].sort((a, b) => a - b);
  const types = [...new Set(state.equipment.map((eq) => eq.type))];

  floors.forEach((f) => $('filter-floor').add(new Option(floorLabel(f), f)));
  types.forEach((t) => $('filter-type').add(new Option(TYPES[t].label, t)));
}

export function renderAll() {
  $('connection').textContent = CONNECTION[state.connection];
  $('connection').dataset.state = state.connection;

  const counts = { ok: 0, warning: 0, alarm: 0, offline: 0 };
  state.equipment.forEach((eq) => counts[statusOf(eq.id)]++);
  Object.entries(counts).forEach(([status, n]) => ($(`count-${status}`).textContent = n));

  renderCards();
  renderAlarms();
}

function createCard(eq) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = eq.id;
  card.tabIndex = 0;
  card.innerHTML = `
    <header class="card-header">
      <h3 class="card-title">${eq.name}</h3>
      <span class="badge" data-role="badge"></span>
    </header>
    <p class="card-meta">${TYPES[eq.type].label} · ${floorLabel(eq.floor)}</p>
    <p class="card-mode" data-role="mode" hidden></p>
    <dl class="values">
      <div class="value">
        <dt>Температура</dt>
        <dd data-role="temp"></dd>
        <span class="setpoint" data-role="tempSp"></span>
      </div>
      <div class="value">
        <dt>Давление</dt>
        <dd data-role="press"></dd>
        <span class="setpoint">уставка ${eq.press} ${eq.unit}</span>
      </div>
    </dl>`;
  return card;
}

function updateCard(card, eq) {
  const t = state.telemetry.get(eq.id);
  const status = statusOf(eq.id);
  const part = (role) => card.querySelector(`[data-role="${role}"]`);

  card.dataset.status = status;
  card.classList.toggle('selected', eq.id === state.selectedId);
  part('badge').textContent = STATUS[status];

  part('mode').hidden = !t?.mode;
  if (t?.mode) part('mode').textContent = `Регулирование: ${MODES[t.mode].toLowerCase()}`;

  part('tempSp').textContent = `уставка ${t?.tempSp ?? eq.temp} °C`;
  part('temp').textContent = t?.temp != null ? `${t.temp.toFixed(1)} °C` : '—';
  part('press').textContent = t ? `${t.press.toFixed(eq.digits)} ${eq.unit}` : '—';
}

function renderCards() {
  const visible = filterEquipment(state.equipment, state.filters, statusOf);

  const elements = visible.map((eq) => {
    if (!cards.has(eq.id)) cards.set(eq.id, createCard(eq));
    updateCard(cards.get(eq.id), eq);
    return cards.get(eq.id);
  });

  // карточки не пересоздаём и не двигаем зря, иначе теряются клики
  const container = $('cards');
  const same = container.children.length === elements.length && elements.every((el, i) => el === container.children[i]);
  if (!same) container.replaceChildren(...elements);

  $('cards-empty').hidden = elements.length > 0;
}

function renderAlarms() {
  const list = alarmView === 'active' ? activeAlarms() : archivedAlarms();

  $('alarm-count').textContent = activeAlarms().length;
  document.querySelectorAll('[data-alarm-view]').forEach((tab) => {
    tab.setAttribute('aria-selected', tab.dataset.alarmView === alarmView);
  });

  const html = list.length
    ? list
        .map((a) => {
          const open = !a.clearedAt;
          const note = a.clearedAt ? ` · снята в ${time(a.clearedAt)}` : a.acked ? ' · квитирована' : '';
          return `
        <li class="alarm" data-severity="${a.level}" data-unacked="${open && !a.acked}">
          <div class="alarm-main">
            <strong>${a.name}</strong>
            <span>${a.text}</span>
            <small>${time(a.raisedAt)}${note}</small>
          </div>
          ${open && !a.acked ? `<button class="btn btn-small" data-ack="${a.id}">Квитировать</button>` : ''}
        </li>`;
        })
        .join('')
    : `<li class="alarm-empty">${alarmView === 'active' ? 'Активных аварий нет' : 'Архив пуст'}</li>`;

  // тот же html - не трогаем DOM
  if (html !== lastAlarmsHtml) {
    $('alarm-list').innerHTML = html;
    lastAlarmsHtml = html;
  }
}
