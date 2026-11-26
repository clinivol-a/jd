# 管理员卡片底角与分享筛选修复

2026-11-26，本地 http://127.0.0.1:5260 验证；未部署、未推送。

## 修改

- 管理员列表 Card 使用原有官方 6px 圆角，在 Card 边界裁切内部表格背景，防止底角被覆盖；不调整全局 Token。
- 成果分享管理的筛选 Label 为「订单编号」，Placeholder 为「搜索订单编号」，仅匹配关联订单 businessNo。旧关键词条件不继续生效；医院筛选保持不变。

## 浏览器检查

| 页面/页签 | 圆角 | Card overflow | 结果 |
| --- | --- | --- | --- |
| 组织管理 | 四角 6px | hidden | 通过 |
| 医院管理 | 四角 6px | hidden | 通过 |
| 岗位管理 | 四角 6px | hidden | 通过 |
| 成员管理 | 四角 6px | hidden | 通过 |
| 专业成果 | 四角 6px | hidden | 通过 |
| 成果分享管理 | 四角 6px | hidden | 通过 |
| 审计日志 | 四角 6px | hidden | 通过 |

逐页切换并保存同名截图。成果分享管理深色模式另存截图，四角仍为 6px、背景使用现有深色 Token。measurements.json 为初次 DOM 测量；bottomCornerInside 是小数坐标命中测试，不能单独作为视觉裁切结论。

筛选 CV-2026-0014 得到该订单的两条分享记录；输入李明得到空数据；重置后恢复全部四条分享记录。验证了搜索只匹配订单编号。

表格原有横向滚动容器 overflow-x:auto 保留；浏览器检查前三列及最后操作列 position:sticky 和原偏移保留。本次原生横向滚动操作未产生 scrollLeft 变化，因此未将实际滚动交互列为通过。

## 构建与边界

- TypeScript `tsc -b`：通过。
- Vite production build：通过；存在原有大体积 chunk 警告。
- `git diff --check`：通过。
- Impeccable 定向检测：无报告项。
- 无服务端或业务数据改动，无销售端、设计师端、专业工作区及全局 Token 改动。
- 安全恢复分支：`codex/backup-admin-card-corners-20261126-79d3be8`。
