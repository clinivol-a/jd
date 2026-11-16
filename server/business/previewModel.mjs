import { readFileSync } from 'node:fs';
// Quantized display derivative only; the original STL is never returned by a sharing API.
const source = readFileSync(new URL('../../public/assets/cad/HumanSkull_Jaw.stl', import.meta.url));
const count = source.readUInt32LE(80), vertices = [], triangles = [], map = new Map();
for (let i = 0; i < count; i++) {
    const ids = [];
    for (let j = 0; j < 3; j++) {
        const p = [0, 1, 2].map(k => Math.round(source.readFloatLE(84 + i * 50 + 12 + j * 12 + k * 4) * 1.5) / 1.5), key = p.join(',');
        let id = map.get(key);
        if (id === undefined) {
            id = vertices.length / 3;
            map.set(key, id);
            vertices.push(...p);
        }
        ids.push(id);
    }
    if (new Set(ids).size === 3)
        triangles.push(...ids);
}
export function previewModel(key) { return { positions: vertices, indices: triangles, kind: key.endsWith('-2') ? 'cad' : 'reconstruction', variant: [...key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 7 / 6, resultKey: key }; }
