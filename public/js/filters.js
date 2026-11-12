export function filterEquipment(list, f, statusOf) {
  const query = f.search.trim().toLowerCase();

  return list.filter(
    (eq) =>
      (f.floor === 'all' || String(eq.floor) === f.floor) &&
      (f.type === 'all' || eq.type === f.type) &&
      (f.status === 'all' || statusOf(eq.id) === f.status) &&
      eq.name.toLowerCase().includes(query),
  );
}
