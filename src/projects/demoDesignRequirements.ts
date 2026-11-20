import type { Project } from './projectModel'

// Exact, historical design fixtures only. Actual order requirements and edits win.
const catalogLegacy = '术前结构评估、修复设计及成果确认。'
const requirements: Record<string, { taskId: string; original: string; text: string }> = {
  'CV260910-0184': { taskId: '001', original: '颌面创伤术前评估；重建面中部骨性结构，供医生确认骨折范围。', text: '依据头颌面薄层CT重建面中部骨性结构，分离上颌骨、颧骨及相关骨折片，清晰呈现骨折断端与移位关系。保留眶缘、牙槽骨等关键解剖轮廓，检查模型表面连续性，提供分部位三维模型及整体装配视图。' },
  'CV260908-0172': { taskId: '002', original: '下颌骨缺损修复术前规划；确认缺损边界与残余骨段。', text: '依据下颌骨薄层CT提取残余骨段及缺损边缘，分别呈现髁突、下颌角、牙根与下牙槽神经管的空间关系。检查骨面连续性及局部分割边界，保留修复定位所需的骨面细节，输出分离模型及缺损区域定位视图。' },
  'CV260907-0168': { taskId: '003', original: '颅骨缺损修复术前评估；输出颅骨完整表面供医生审核。', text: '依据头颅薄层CT重建颅骨表面及缺损边界，保留缺损周缘骨面、骨厚变化和邻近骨缝特征。清理非目标组织及离散碎片，检查表面孔洞与法向，输出颅骨三维模型和缺损边界视图，供修复体设计使用。' },
  'CV261019-0211': { taskId: '004', original: '面部骨骼修复术前设计；完成骨性结构重建并提交医生确认。', text: '完成面部骨骼与修复区域的分部位重建，明确缺损边界及邻近牙根、神经管等需避让结构。依据确认的修复轮廓设计修复体及定位导板，检查接触面贴合、装配关系与操作空间，输出分体模型及装配定位视图。' },
  'CV261020-0226': { taskId: '006', original: '下颌骨缺损修复术前设计；输出唯一审核通过模型供 CAD 使用。', text: '依据下颌骨薄层CT重建残余骨段与缺损区域，清晰标识牙根及下牙槽神经管。基于已审核的骨模型设计修复体，保持与残余骨面的贴合及装配关系，固定位置避让重要结构，输出骨模型、修复体模型及装配检查视图。' },
  'CV261102-0301': { taskId: 'P301-1', original: catalogLegacy, text: '完成颌面骨组织及缺损区域的三维重建，明确修复边界与需避让的解剖结构；依据确认的轮廓设计修复体及定位导板，检查贴合与装配关系。按确认的材料、载荷和约束条件建立有限元模型，整理应力与位移分布；依据批准模型完成打印前网格检查，保留各阶段对应的成果版本。' },
  'CV261101-0302': { taskId: 'P302-1', original: catalogLegacy, text: '依据头颅薄层CT分离颅骨及颌面骨性结构，保留眶缘、颧弓、牙槽骨和颅底关键轮廓。核对薄骨区与骨缝处的分割连续性，清理离散组织，输出可分部位查看的三维模型及整体结构视图。' },
  'CV261102-0303': { taskId: 'P303-1', original: catalogLegacy, text: '依据下颌骨影像重建残余骨段及缺损边界，保留牙根、髁突与神经管等关键结构。基于确认骨面设计修复体及定位结构，检查接触区域、固定孔位与装配干涉，输出分体模型及装配定位视图。' },
  'CV261101-0304': { taskId: 'P304-1', original: catalogLegacy, text: '依据薄层CT重建眶壁、眶缘、颧骨及颧弓，分离骨折片并标识缺损边界。检查薄骨区连续性及眶颧连接关系，保留修复定位所需的骨性标志，输出分部位模型与缺损区域视图。' },
  'CV261102-0305': { taskId: 'P305-1', original: catalogLegacy, text: '重建颅骨缺损边界及周围骨面，依据确认轮廓建立个体化修复体，使外形曲率与周围骨面平顺衔接。检查修复体厚度过渡、接触边缘及固定区域，输出颅骨、修复体分体模型和装配视图。' },
  'CV261101-0306': { taskId: 'P306-1', original: catalogLegacy, text: '依据头颌面CT重建上颌骨、牙槽骨与邻近骨性结构，清晰呈现上颌窦、鼻腔及牙根的空间关系。核对缺损边界和薄骨区连续性，保留定位标志及接触骨面细节，输出上颌骨分离模型和整体定位视图。' },
  'CV261102-0307': { taskId: 'P307-1', original: catalogLegacy, text: '完成颌骨缺损区域及邻近正常结构重建，明确骨面接触区域和重要结构的避让范围。依据确认轮廓设计修复体及导板，检查边缘过渡、固定孔位置与装配干涉，输出骨模型、修复体及导板模型和定位示意。' },
  'CV261101-0308': { taskId: 'P308-1', original: catalogLegacy, text: '依据下颌骨影像重建下颌角与相邻骨段，保留骨皮质轮廓、下缘曲线及神经管位置。核对修复区域边界与骨面连续性，清理离散碎片，输出下颌角局部模型及与整体下颌骨的定位视图。' },
}

export function projectDesignDemand(project: Project) {
  const task = project.tasks.find(task => task.designDemandContent || task.surgery?.trim())
  const fixture = requirements[project.id]
  const replaceFixture = !!fixture && !!task && project.dataOrigin === 'demo' && task.dataOrigin !== 'production' && !task.sharedBusiness && !task.designDemandContent &&
    fixture.taskId === task.id && task.surgery === fixture.original
  return { owner: task?.designDemandOwnerId || '', content: task?.designDemandContent, text: replaceFixture ? fixture.text : task?.surgery || '—' }
}
