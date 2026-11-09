// Grid: the last row is completed with empty cells so every card keeps the same width.
export function padGrid<T extends { id: string }>(items: T[], columns: number): (T | { id: string; pad: true })[] {
  if (columns <= 1 || items.length % columns === 0) return items;
  return [...items, ...Array.from({ length: columns - (items.length % columns) }, (_, index) => ({ id: `__pad-${index}`, pad: true as const }))];
}
