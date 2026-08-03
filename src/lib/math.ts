export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function nextPowerOfTwo(n: number): number {
  let v = Math.max(1, n);
  v -= 1;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v + 1;
}

export function hypot2(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}
