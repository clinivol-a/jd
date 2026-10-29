import type { CadObject } from './cadProject'
/** Object-space transforms for editable design objects; reference meshes are never mutated. */
export function transformCadObject(object: CadObject, command: string, axis: string, angle: number, factor: number): CadObject {
  if (object.kind === 'reference' || object.locked) return object
  const index = Math.max(0, ['X', 'Y', 'Z'].indexOf(axis))
  if (command === '旋转对象') { const rotation = [...(object.rotation ?? [0,0,0])] as [number,number,number]; rotation[index] += Number.isFinite(angle) ? angle : 0; return { ...object, rotation } }
  if (command === '缩放对象') { const scale = (object.scale ?? [1,1,1]).map((value) => value * (Number.isFinite(factor) && factor > 0 ? factor : 1)) as [number,number,number]; return { ...object, scale } }
  if (command === '镜像') { const scale = [...(object.scale ?? [1,1,1])] as [number,number,number]; const position = [...object.position] as [number,number,number]; scale[index] *= -1; position[index] *= -1; return { ...object, scale, position } }
  return object
}
