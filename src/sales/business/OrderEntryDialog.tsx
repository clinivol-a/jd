import { Dialog, Button } from 'tdesign-react';
import { EditIcon, ImageIcon, CloudIcon } from '../../design-system/tdesign';
export function OrderEntryDialog({ visible, onClose, onChoose }: {
    visible: boolean;
    onClose: () => void;
    onChoose: (mode: string) => void;
}) { return <Dialog visible={visible} header="选择订单录入方式" footer={false} onClose={onClose} width={720}><div className="business-entry-options">{[{ id: 'manual', name: '手动录入', text: '填写客户与患者、服务需求并上传资料。', icon: <EditIcon /> }, { id: 'report', name: '报告识别导入', text: '上传报告及患者资料照片，授权获取影像并核对。', icon: <ImageIcon /> }, { id: 'pacs', name: 'PACS导入', text: '通过授权医院连接选择检查与影像序列。', icon: <CloudIcon /> }].map(item => <Button key={item.id} variant="outline" className="business-entry-option" onClick={() => onChoose(item.id)}><span>{item.icon}<strong>{item.name}</strong><span>{item.text}</span></span></Button>)}</div></Dialog>; }
