import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const cache=new Map()
/** Minimal local TypeScript loader for pure data/formatting regression checks. */
export function loadTs(file){
 const absolute=path.resolve(file)
 if(cache.has(absolute))return cache.get(absolute).exports
 const module={exports:{}};cache.set(absolute,module)
 const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
 const require=specifier=>{if(!specifier.startsWith('.'))throw new Error('Unexpected runtime dependency: '+specifier);return loadTs(path.resolve(path.dirname(absolute),specifier)+'.ts')}
 new Function('module','exports','require',code)(module,module.exports,require)
 return module.exports
}
