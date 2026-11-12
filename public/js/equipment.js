export const TYPES = {
  ventilation: {
    label: 'Вентиляция',
    unit: 'Па',
    digits: 0,
    temp: { warn: 2, alarm: 4 },
    press: { warn: 50, alarm: 100 },
  },
  chiller: {
    label: 'Чиллер',
    unit: 'бар',
    digits: 2,
    temp: { warn: 1.5, alarm: 3 },
    press: { warn: 0.6, alarm: 1.2 },
  },
  pump: {
    label: 'Насосы ИТП',
    unit: 'бар',
    digits: 2,
    temp: { warn: 5, alarm: 10 },
    press: { warn: 0.8, alarm: 1.5 },
  },
};

export const MODES = {
  supply: 'По приточному воздуху',
  exhaust: 'По вытяжному воздуху',
};

function make(id, name, type, floor, temp, press) {
  const t = TYPES[type];
  return {
    id,
    name,
    type,
    floor,
    temp,
    press,
    unit: t.unit,
    digits: t.digits,
    limits: { temp: t.temp, press: t.press },
    // вытяжной воздух теплее приточного градуса на два
    modes: type === 'ventilation' ? { supply: temp, exhaust: temp + 2 } : null,
  };
}

export const EQUIPMENT = [
  make('ahu-0', 'Приточная установка Swegon ПВ-0.1', 'ventilation', -1, 20, 240),
  make('ahu-1', 'Приточная установка Swegon ПВ-1.1', 'ventilation', 1, 22, 300),
  make('exh-1', 'Вытяжная установка Swegon В-1.1', 'ventilation', 1, 22, 200),
  make('ahu-2', 'Приточная установка Swegon ПВ-2.1', 'ventilation', 2, 21, 280),
  make('exh-2', 'Вытяжная установка Swegon В-2.1', 'ventilation', 2, 22, 200),
  make('chl-1', 'Чиллер BlueBox Ч-1', 'chiller', 1, 7, 4.0),
  make('chl-2', 'Чиллер BlueBox Ч-2', 'chiller', 2, 7, 4.2),
  make('pmp-1', 'Насос ИТП Pump-1 (отопление)', 'pump', -1, 60, 5.0),
  make('pmp-2', 'Насос ИТП Pump-2 (ГВС)', 'pump', -1, 55, 4.5),
  make('pmp-3', 'Насос ИТП Pump-3 (холодоснабжение)', 'pump', -1, 12, 4.0),
];

export const floorLabel = (floor) => (floor < 0 ? 'Подвал' : `${floor} этаж`);
