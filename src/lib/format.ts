const ROMAN_NUMERALS = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
] as const

/** A whole number in lowercase Roman numerals: 32 → `xxxii`, 40 → `xl`, 74 → `lxxiv`. */
export function toRoman(value: number) {
  let rest = value
  let numeral = ''

  for (const [amount, symbol] of ROMAN_NUMERALS) {
    while (rest >= amount) {
      numeral += symbol
      rest -= amount
    }
  }

  return numeral
}

/** Seconds as `m:ss`. */
export function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** A timestamp as `10 sept. 2026 14:51`, in whatever locale the browser is set to. */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
