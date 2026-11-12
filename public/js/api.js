import { EQUIPMENT } from './equipment.js';

export async function loadEquipment() {
  try {
    const res = await fetch('/api/equipment');
    return res.ok ? await res.json() : EQUIPMENT;
  } catch {
    return EQUIPMENT; // без сервера (GitHub Pages) берём встроенный список
  }
}
