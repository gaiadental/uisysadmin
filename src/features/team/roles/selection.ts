/** Pure helpers of the role permission checklist, which selects permission KEYS. */

/** Adds or removes one key. The result has no duplicates and keeps the input order. */
export function withKey(
  keys: readonly string[],
  key: string,
  checked: boolean
): string[] {
  const rest = keys.filter((candidate) => candidate !== key)
  return checked ? [...rest, key] : rest
}

/** True when both lists hold the same keys, in any order. */
export function sameKeySet(
  a: readonly string[],
  b: readonly string[]
): boolean {
  const left = new Set(a)
  const right = new Set(b)
  return left.size === right.size && [...left].every((key) => right.has(key))
}
