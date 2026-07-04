export function createMock<T extends object>(partial: Partial<T> = {}): T {
  return partial as T;
}

export function createSpy<T extends (...args: never[]) => unknown>() {
  const calls: Parameters<T>[] = [];
  const fn = (...args: Parameters<T>) => {
    calls.push(args);
    return undefined;
  };
  return { fn: fn as T, calls };
}
