/** Read a position that the caller's domain rules require to exist. */
export function requiredAt<T>(values: Readonly<Record<number, T>>, index: number): T {
  const value = values[index];
  if (value === undefined) {
    throw new RangeError(`Missing value at index ${index}`);
  }
  return value;
}
