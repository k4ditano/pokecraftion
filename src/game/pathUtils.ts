import type { Vec2 } from './types'

export function pathLength(path: Vec2[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

export function slicePathByFraction(path: Vec2[], fraction: number): Vec2[] {
  if (path.length === 0) return []
  if (fraction <= 0) return [path[0]]
  if (fraction >= 1) return path.slice()

  const total = pathLength(path)
  if (total === 0) return [path[0]]
  const target = total * fraction

  const result: Vec2[] = [path[0]]
  let acc = 0
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    const segLen = Math.hypot(b.x - a.x, b.y - a.y)
    if (acc + segLen >= target) {
      const t = segLen === 0 ? 0 : (target - acc) / segLen
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      return result
    }
    acc += segLen
    result.push(b)
  }
  return result
}

export function transformPath(
  path: Vec2[],
  origin: Vec2,
  angle: number,
): Vec2[] {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return path.map((p) => ({
    x: origin.x + p.x * cos - p.y * sin,
    y: origin.y + p.x * sin + p.y * cos,
  }))
}
