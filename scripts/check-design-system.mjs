import assert from 'node:assert/strict'
import fs from 'node:fs'
const data=JSON.parse(fs.readFileSync('design-system/tokens.json','utf8')),css=fs.readFileSync('src/design-system/tokens.css','utf8')
for(const [name,values] of Object.entries(data.palettes))values.forEach((value,index)=>assert.ok(css.includes(`--cv-palette-${name}-${index+1}: ${value};`)))
assert.equal(data.palettes.brand[6],'#0D7A5D');assert.equal(data.palettes.gray[1],'#EEEEEE');assert.equal(data.semantic.light['bg-color-page'],'#F5F7F9')
assert.equal(data.semantic.light['brand-color'],'{brand.7}');assert.equal(data.semantic.light['error-color'],'{error.6}');assert.equal(data.semantic.light['warning-color'],'{warning.5}');assert.equal(data.semantic.light['success-color'],'{success.5}')
for(const [role,{size,lineHeight}] of Object.entries(data.fonts)){assert.equal(lineHeight,size+8);assert.ok(css.includes(`--cv-font-size-${role}: ${size}px`));assert.ok(css.includes(`--td-font-size-${role}: var(--cv-font-size-${role})`))}
assert.deepEqual(data.radius,{small:'3px',default:'4px',medium:'8px',large:'12px','extra-large':'16px',circle:'50%'})
const official=fs.readFileSync('node_modules/tdesign-react/es/style/index.css','utf8')
const numbers=value=>value.match(/-?\d*\.?\d+/g).map(Number)
for(const [i,shadow] of data.shadows.light.entries()){const raw=official.match(new RegExp(`--td-shadow-${i+1}: ([^;]+);`))[1];assert.deepEqual(numbers(shadow),numbers(raw))}
const app=fs.readFileSync('src/App.tsx','utf8');const modes=app.slice(app.indexOf('const workspaceModes:'),app.indexOf('const initialProfessionalObjects:'))
assert.ok(!modes.includes("key: 'file'")&&!modes.includes("label: '文件'"));assert.ok(!app.includes('pluginOptions'))
const ai=modes.slice(modes.indexOf('  ai: ['),modes.indexOf('  view: ['))
const labels=[...ai.matchAll(/label:'([^']+)'/g)].map(m=>m[1])
assert.deepEqual(labels,['骨骼重建','器官重建','肺血管重建','支气管重建','腹部器官重建','脊柱与肋骨重建','腹部大血管重建','肺叶重建','皮肤重建','Mesh编辑'])
assert.equal([...ai.matchAll(/available:false/g)].length,10,'no fake AI success')
const view=modes.slice(modes.indexOf('  view: ['),modes.indexOf('  image: ['));assert.ok(view.includes('蒙版体积与统计')&&view.includes('STL属性统计'))
for(const file of fs.readdirSync('src',{recursive:true}).filter(file=>file.endsWith('.tsx')&&!file.startsWith('design-system/'))){const text=fs.readFileSync('src/'+file,'utf8');assert.ok(!/from ['"](?:tdesign-icons-react|lucide-react)['"]/.test(text),`${file} must use icon adapters`)}
const icons=fs.readFileSync('src/design-system/CliniVolIcon.tsx','utf8');assert.ok(icons.includes('strokeWidth: 1.5'));assert.ok(icons.includes('viewBox="0 0 24 24"'));assert.ok(!css.includes('svg { border-radius'))
const pages=fs.readFileSync('src/projects/ProjectPages.tsx','utf8'),columns=pages.slice(pages.indexOf('const columns:'),pages.indexOf('const data='));assert.deepEqual([...columns.matchAll(/title:'([^']+)'/g)].map(m=>m[1]),['项目编号','医院','手术项目名称','患者标识','设计阶段','当前进展','创建时间','预计交付时间','操作'])
assert.equal([...columns.matchAll(/fixed:'left'/g)].length,3);assert.ok(pages.includes('iconsOnly'));assert.ok(!pages.includes('专业阶段'))
for(const file of ['tokens.md','icons.md','component-rules.md','figma-variable-mapping.md'])assert.ok(fs.statSync('design-system/'+file).size>100)
console.log('PASS: final Figma palettes/semantic mapping, typography/radius/shadow sources, shared icons, AI capability boundaries, moved statistics and project columns')
