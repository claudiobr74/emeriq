function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function tokenize(value: string): string[] {
  return normalizeWhitespace(value).split(" ").filter(Boolean);
}

function comparable(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .replace(/[.,;:!?…"'“”‘’()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function reconcileTranscript(
  confirmedTranscript: string,
  incomingSegment: string,
): string {
  const confirmed = normalizeWhitespace(confirmedTranscript);
  const incoming = normalizeWhitespace(incomingSegment);

  if (!incoming) return confirmed;
  if (!confirmed) return incoming;

  const confirmedCmp = comparable(confirmed);
  const incomingCmp = comparable(incoming);

  if (confirmedCmp.includes(incomingCmp)) {
    return confirmed;
  }

  if (incomingCmp.includes(confirmedCmp) && incoming.length > confirmed.length) {
    return incoming;
  }

  const confirmedWords = tokenize(confirmed);
  const incomingWords = tokenize(incoming);
  const maxWords = Math.min(confirmedWords.length, incomingWords.length);

  for (let length = maxWords; length >= 2; length -= 1) {
    const suffix = comparable(confirmedWords.slice(-length).join(" "));
    const prefix = comparable(incomingWords.slice(0, length).join(" "));
    if (suffix && suffix === prefix) {
      const rest = incomingWords.slice(length).join(" ");
      return normalizeWhitespace(`${confirmed} ${rest}`);
    }
  }

  const minChars = 12;
  const maxChars = Math.min(confirmedCmp.length, incomingCmp.length);

  for (let length = maxChars; length >= minChars; length -= 1) {
    if (confirmedCmp.slice(-length) === incomingCmp.slice(0, length)) {
      const originalPrefixLength = findOriginalOverlapEnd(incoming, length);
      return normalizeWhitespace(
        `${confirmed}${incoming.slice(originalPrefixLength)}`,
      );
    }
  }

  return `${confirmed} ${incoming}`;
}

function findOriginalOverlapEnd(incoming: string, comparableLength: number): number {
  const source = incoming.trim();
  let count = 0;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]!;
    if (/[.,;:!?…"'“”‘’()[\]]/.test(ch)) continue;
    if (/\s/.test(ch)) {
      count += 1;
    } else {
      count += 1;
    }
    if (count >= comparableLength) {
      return i + 1;
    }
  }
  return Math.min(source.length, comparableLength);
}

export function transcriptTail(text: string, maxChars = 180): string {
  const normalized = normalizeWhitespace(text);
  if (normalized.length <= maxChars) return normalized;
  return normalized.slice(-maxChars);
}
