import { state } from './state.js';

let tempChart;
let pressChart;

function create(canvas, color) {
  return new Chart(canvas, {
    type: 'line',
    data: { labels: [], datasets: [{ data: [], borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.25 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: {}, ticks: { maxTicksLimit: 6, maxRotation: 0 } }, y: { grid: {}, ticks: {}, grace: '10%' } },
    },
  });
}

export function initCharts(tempCanvas, pressCanvas) {
  if (typeof Chart === 'undefined') return false;
  tempChart = create(tempCanvas, '#f59e0b');
  pressChart = create(pressCanvas, '#38bdf8');
  return true;
}

export function updateCharts() {
  if (!tempChart) return;
  const history = state.history.get(state.selectedId) || [];
  const labels = history.map((p) => new Date(p.t).toLocaleTimeString('ru-RU'));
  const style = getComputedStyle(document.documentElement);

  for (const [chart, key] of [[tempChart, 'temp'], [pressChart, 'press']]) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = history.map((p) => p[key]);
    for (const axis of ['x', 'y']) {
      chart.options.scales[axis].ticks.color = style.getPropertyValue('--text-muted');
      chart.options.scales[axis].grid.color = style.getPropertyValue('--border');
    }
    chart.update('none');
  }
}
