// Minimal OpenXML writer for the application's internal insurance template.
// No macros, formulas, external relationships or source-model links are emitted.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const crc = b => { let c = 0xffffffff; for (const n of b) {
    c ^= n;
    for (let j = 0; j < 8; j++)
        c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
} return (c ^ 0xffffffff) >>> 0; };
function zip(entries) { let offset = 0; const chunks = [], central = []; for (const [name, value] of entries) {
    const n = Buffer.from(name), b = Buffer.isBuffer(value) ? value : Buffer.from(value), h = Buffer.alloc(30), d = Buffer.alloc(46);
    h.writeUInt32LE(0x04034b50);
    h.writeUInt16LE(20, 4);
    h.writeUInt32LE(crc(b), 14);
    h.writeUInt32LE(b.length, 18);
    h.writeUInt32LE(b.length, 22);
    h.writeUInt16LE(n.length, 26);
    d.writeUInt32LE(0x02014b50);
    d.writeUInt16LE(20, 4);
    d.writeUInt16LE(20, 6);
    d.writeUInt32LE(crc(b), 16);
    d.writeUInt32LE(b.length, 20);
    d.writeUInt32LE(b.length, 24);
    d.writeUInt16LE(n.length, 28);
    d.writeUInt32LE(offset, 42);
    chunks.push(h, n, b);
    central.push(d, n);
    offset += h.length + n.length + b.length;
} const cb = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cb.length, 12); end.writeUInt32LE(offset, 16); return Buffer.concat([...chunks, cb, end]); }
export function insuranceXlsx(rows) {
    const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const cols = ['医院', '患者姓名', '性别', '身份证号', '手术项目名称', '订单编号', '完成时间', '批准静态成果图片'];
    const cell = (v, r, c, style = 0) => `<c r="${String.fromCharCode(65 + c)}${r}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${ns}" xmlns:r="${rel}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${[32, 16, 8, 24, 32, 24, 22, 36].map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData><row r="1" ht="30" customHeight="1">${cell('科立沃医保填报汇总', 1, 0, 1)}</row><row r="2" ht="28" customHeight="1">${cols.map((v, i) => cell(v, 2, i, 1)).join('')}</row>${rows.map((o, i) => `<row r="${i + 3}" ht="130" customHeight="1">${[o.hospital, o.patientName, o.sex, o.identityNumber, o.surgery, o.id].map((v, c) => cell(v, i + 3, c,c===3?3:0)).join('')}<c r="G${i + 3}" s="2"><v>${Date.parse(o.completedAt) / 86400000 + 25569 - new Date(o.completedAt).getTimezoneOffset() / 1440}</v></c></row>`).join('')}</sheetData><autoFilter ref="A2:H${rows.length + 2}"/><mergeCells count="1"><mergeCell ref="A1:H1"/></mergeCells><drawing r:id="drawing"/></worksheet>`;
    const drawing = `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${rel}">${rows.map((o, i) => `<xdr:oneCellAnchor><xdr:from><xdr:col>7</xdr:col><xdr:colOff>60000</xdr:colOff><xdr:row>${i + 2}</xdr:row><xdr:rowOff>60000</xdr:rowOff></xdr:from><xdr:ext cx="1428750" cy="1071562"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${i + 1}" name="批准静态成果 ${i + 1}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="image${i}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`).join('')}</xdr:wsDr>`;
    return zip([
        ['[Content_Types].xml', `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`],
        ['_rels/.rels', `<Relationships xmlns="${pkg}"><Relationship Id="workbook" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
        ['xl/workbook.xml', `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="医保内部汇总" sheetId="1" r:id="sheet"/></sheets></workbook>`],
        ['xl/_rels/workbook.xml.rels', `<Relationships xmlns="${pkg}"><Relationship Id="sheet" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="styles" Type="${rel}/styles" Target="styles.xml"/></Relationships>`],
        ['xl/styles.xml', `<styleSheet xmlns="${ns}"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Microsoft YaHei"/></font><font><b/><sz val="11"/><name val="Microsoft YaHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F5F0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"><alignment vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment vertical="center"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"><alignment vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
        ['xl/worksheets/sheet1.xml', sheet], ['xl/worksheets/_rels/sheet1.xml.rels', `<Relationships xmlns="${pkg}"><Relationship Id="drawing" Type="${rel}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`], ['xl/drawings/drawing1.xml', drawing], ['xl/drawings/_rels/drawing1.xml.rels', `<Relationships xmlns="${pkg}">${rows.map((_, i) => `<Relationship Id="image${i}" Type="${rel}/image" Target="../media/image${i}.png"/>`).join('')}</Relationships>`], ...rows.map((o, i) => [`xl/media/image${i}.png`, o.image])
    ]);
}
