import * as THREE from 'three'

// Open mesh boundaries, not a second set of crease edges. Shared positions are
// welded only for adjacency counting; the source STL is never modified.
export function cadBoundaryGeometry(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute('position'); const index = geometry.index
  const edges = new Map<string, { count: number; a: number; b: number }>()
  const keys = Array.from({ length: position.count }, (_, i) => [position.getX(i), position.getY(i), position.getZ(i)].map((value) => Math.round(value * 100000)).join(','))
  const count = index?.count ?? position.count
  for (let i = 0; i < count; i += 3) {
    const triangle = [0,1,2].map((offset) => index ? index.getX(i + offset) : i + offset)
    for (let j = 0; j < 3; j++) {
      const a = triangle[j]; const b = triangle[(j + 1) % 3]
      if (keys[a] === keys[b]) continue
      const key = keys[a] < keys[b] ? `${keys[a]}|${keys[b]}` : `${keys[b]}|${keys[a]}`
      const edge = edges.get(key); if (edge) edge.count++; else edges.set(key, { count: 1, a, b })
    }
  }
  const points: number[] = []
  edges.forEach(({ count, a, b }) => { if (count === 1) points.push(position.getX(a), position.getY(a), position.getZ(a), position.getX(b), position.getY(b), position.getZ(b)) })
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
}
export type CadShading = 'edges' | 'shaded' | 'wireframe' | 'translucent'
