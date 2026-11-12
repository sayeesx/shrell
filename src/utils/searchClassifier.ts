const KNOWN_SHORT_ENGLISH_WORDS = new Set([
  'in', 'on', 'to', 'by', 'my', 'up', 'go', 'no', 'so', 'it', 'is', 'at', 'or', 'an', 'as', 'of', 'us', 'we', 'he', 'me',
  'ok', 'hd', '4k', '3d', '7d', 'car', 'cat', 'dog', 'bag', 'hat', 'cap', 'key', 'led', 'hid', 'fog', 'suv', 'van', 'bus',
  'mat', 'mats', 'wax', 'oil', 'kit', 'pad', 'air', 'tyre', 'tire', 'bulb', 'lamp', 'horn', 'lock', 'rack', 'roof', 'tow',
  'bar', 'net', 'box', 'cup', 'fan', 'map', 'gps', 'cam', 'usb', 'aux', 'amp', 'sub', 'rim', 'hub', 'lug', 'nut', 'bolt',
  'dry', 'fly', 'try', 'gym', 'sky', 'shy', 'cry', 'why', 'buy', 'toy', 'pen', 'tea', 'ice', 'pie', 'hat', 'shoe', 'bed',
  'tv', 'pc', 'ac', 'dc', 'ev', 'rv', '4x4', '4wd', 'awd', 'abs', 'oem', 'drl', 'tpe', 'cnc', 'ppf', 'clay', 'foam',
  'wash', 'trim', 'seat', 'door', 'hood', 'boot', 'tent', 'rope', 'pump', 'fuse', 'wire', 'tape', 'glue', 'bolt', 'jack',
]);

const KEYBOARD_MASH_SUBSTRINGS = [
  'qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop',
  'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'jklm',
  'zxcv', 'xcvb', 'cvbn', 'vbnm',
  'poiuy', 'oiuyt', 'lkjh', 'kjhg', 'jhgf', 'hgfd', 'gfds', 'fdsa',
  'mnbv', 'nbvc', 'bvcx', 'vcxz',
  'qazw', 'wsxe', 'edcr', 'rfvt', 'fjdk', 'djsk', 'skdj', 'akjd', 'kjas', 'sdjf', 'hfjd', 'fhsd',
];

const IMPOSSIBLE_BIGRAMS = [
  'zx', 'xz', 'qx', 'xq', 'qj', 'jq', 'qk', 'kq', 'qz', 'zq', 'vx', 'xv',
  'bx', 'cx', 'fx', 'gx', 'hx', 'jx', 'kx', 'mx', 'px', 'wx',
  'jk', 'kj', 'hj', 'jh', 'fq', 'qf', 'vj', 'jv', 'bq', 'qb', 'pz', 'zp',
];

function isGibberishToken(rawToken: string): boolean {
  const token = rawToken.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (!token) return false;
  if (KNOWN_SHORT_ENGLISH_WORDS.has(token)) return false;

  // Purely numeric or symbol strings cleanly count as random non-word search queries
  const lettersOnly = token.replace(/[^a-z]/g, '');
  if (!lettersOnly) return true;

  // Mix of digits + random short letters like "x9k2" or "abc123mash" (allow 12v, 7d, 4wd etc.)
  if (/[0-9]/.test(token) && !/^(12v|24v|3d|5d|7d|4x4|4wd|2wd|100w|55w|150psi|500ml)$/i.test(token)) {
    if (lettersOnly.length < 3 || /(.)\1{2,}/.test(token)) return true;
  }

  // Repeated same character >= 3 times (e.g. "aaaa", "zzz")
  if (/(.)\1{2,}/.test(lettersOnly)) return true;

  // Known keyboard row mash chunks
  if (KEYBOARD_MASH_SUBSTRINGS.some((chunk) => lettersOnly.includes(chunk))) return true;

  // Unpronounceable consonant clusters
  if (IMPOSSIBLE_BIGRAMS.some((bg) => lettersOnly.includes(bg))) return true;

  // Long run of consonants (>= 4) unless valid English clusters
  const consonantRuns = lettersOnly.match(/[bcdfghjklmnpqrstvwxz]+/g) || [];
  for (const run of consonantRuns) {
    if (run.length >= 4 && !/(ngth|ghts|str|sch|tch|nth|mph|nch|rld|cks|nts|rts|lts|nds)/.test(run)) {
      return true;
    }
  }

  // >= 4 vowels in a row (e.g. "aeiouu")
  if (/[aeiou]{4,}/.test(lettersOnly)) return true;

  // Word length >= 3 with zero vowels (excluding known y-words checked above)
  const vowelCount = (lettersOnly.match(/[aeiouy]/g) || []).length;
  if (lettersOnly.length >= 3 && vowelCount === 0) return true;

  // 2-letter tokens not in short English dictionary
  if (lettersOnly.length === 2 && vowelCount === 0) return true;

  // Long tokens with very low vowel ratio (< 18%) are usually keyboard mashing
  if (lettersOnly.length >= 6 && vowelCount / lettersOnly.length < 0.18) return true;

  return false;
}

/**
 * Determines whether a search query looks like random keyboard characters / gibberish
 * vs a genuine English word / product phrase with no inventory matches.
 */
export function isGibberishSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;

  // Strings with weird non-alphanumeric symbol punctuation
  if (/[^a-zA-Z0-9\s\-&'+.]/.test(trimmed)) return true;

  const tokens = trimmed.split(/[\s\-_]+/).filter(Boolean);
  if (tokens.length === 0) return false;

  return tokens.some((tok) => isGibberishToken(tok));
}
