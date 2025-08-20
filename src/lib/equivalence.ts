export type EpicItem = { id:string; label:string; baseKg:number; fact:string; emoji?:string };

export function bestEpicMatch(tonnageKg: number, items: EpicItem[]) {
  let best = { item: items[0], n: 1, approxKg: items[0].baseKg };
  let bestDiff = Math.abs(tonnageKg - best.approxKg);
  for (const item of items) {
    const n = Math.min(60, Math.max(1, Math.round(tonnageKg / item.baseKg)) || 1);
    const approxKg = n * item.baseKg;
    const diff = Math.abs(tonnageKg - approxKg);
    if (diff < bestDiff) {
      best = { item, n, approxKg };
      bestDiff = diff;
    }
  }
  return best;
}

export function formatEquivalence({ item, n }: { item: EpicItem; n: number }) {
  return {
    text: `≈ ${n} ${item.label}${n > 1 ? 's' : ''}`,
    emoji: item.emoji,
  };
}
