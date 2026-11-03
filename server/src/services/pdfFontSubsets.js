// Which characters the small certificate fonts in assets/fonts hold (from scripts/subset-fonts.js).
export const TEXT_SUBSET_RANGE = [0x20, 0x7e]
// Also everything a Latin-script name normally needs (ñ, é, ł…) and typographic quotes and dashes.
export const NAME_SUBSET_RANGES = [TEXT_SUBSET_RANGE, [0xa0, 0x17f], [0x2013, 0x2014], [0x2018, 0x2019], [0x201c, 0x201d], [0x2026, 0x2026]]

export const inNameSubset = (text) =>
  [...String(text ?? '')].every((char) => {
    const code = char.codePointAt(0)
    return NAME_SUBSET_RANGES.some(([from, to]) => code >= from && code <= to)
  })
