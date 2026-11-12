import { EQUIPMENT } from './equipment.js';
import { createEmulator } from './emulator.js';

export function startDataSource({ onTelemetry, onStatus }) {
  let socket;
  let demo = null;
  let wasConnected = false;

  function startDemo() {
    demo = createEmulator(EQUIPMENT);
    const tick = () => onTelemetry(demo.tick(), Date.now());
    setInterval(tick, 1000);
    onStatus('demo');
    tick();
  }

  function connect() {
    if (!location.host) return startDemo();

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${location.host}/ws`);

    socket.onopen = () => {
      wasConnected = true;
      onStatus('online');
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'telemetry') onTelemetry(msg.items, msg.ts);
    };

    socket.onclose = () => {
      // сервера не было вообще - уходим в демо, иначе пробуем переподключиться
      if (!wasConnected) return startDemo();
      onStatus('offline');
      setTimeout(connect, 3000);
    };
  }

  connect();

  function send(command) {
    if (demo) {
      if (command.type === 'fault') demo.toggleFault(command.id);
      if (command.type === 'mode') demo.setMode(command.id, command.mode);
    } else if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(command));
    }
  }

  return {
    toggleFault: (id) => send({ type: 'fault', id }),
    setMode: (id, mode) => send({ type: 'mode', id, mode }),
  };
}
