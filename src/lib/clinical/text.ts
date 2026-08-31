export function foldPt(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}\s/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function includesFolded(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  return foldPt(haystack).includes(foldPt(needle));
}

export function includesFoldedToken(haystack: string, needle: string): boolean {
  const n = foldPt(needle);
  if (!n) return false;
  const h = foldPt(haystack);
  if (n.length > 4) return h.includes(n);
  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`).test(h);
}

export function anyTerm(haystack: string, terms: readonly string[]): boolean {
  const folded = foldPt(haystack);
  return terms.some((term) => folded.includes(foldPt(term)));
}
