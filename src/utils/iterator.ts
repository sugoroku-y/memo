function indexOf<T>(
  iterable: Iterable<T> | undefined,
  t: T
): number | undefined {
  if (!iterable) {
    return undefined;
  }
  let i = 0;
  for (const e of iterable) {
    if (e === t) {
      return i;
    }
    ++i;
  }
  return undefined;
}
