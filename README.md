# 销售收支记账后台（前端 MVP · 本地数据版1）

面向个人经营者的轻量级销售收支记账后台。基于 **React 18 + Ant Design Pro + Vite** 实现，数据默认存储在浏览器 `localStorage`，无需后端即可运行。

## 功能范围（MVP）

- 默认 admin 登录（`admin / admin`）
- 销售订单管理：列表 + 顶部汇总栏 + 筛选 + 新建/编辑 + 详情 + Excel 导出 + 级联删除
- 支出管理：订单支出 / 月度支出，列表 + 筛选 + 导出
- 应付款管理：子事项、按金额/按事项结清、结清流水、状态自动计算、导出
- 一键全量数据备份（JSON，布局右上角「备份数据」）

> 统计中心、货品图片上传为二期规划，本期暂未实现。

## 本地运行

```bash
npm install
npm run dev      # 开发模式，默认 http://localhost:8000
npm run build    # 生产构建，产物在 dist/
npm run preview  # 预览构建产物
```

## 核心业务规则

| 指标 | 计算方式 |
| :-- | :-- |
| 订单利润 | 销售总金额 − 该订单已支付支出合计 |
| 全局总支出 | 所有已支付支出（订单支出 + 月度支出）之和 |
| 全局总利润 | 所有订单销售总金额 − 全局总支出 |
| 应付款剩余 | 应付总金额 − 累计已结清金额 |
| 结清状态 | 0 / 部分 / 全部，由结清流水自动计算 |

- 删除订单会**级联删除**其关联的支出与应付款（防误删有二次确认）。
- 应付款仅做负债统计，不影响当期利润。
- 「手动调整总金额」开关：关闭时金额按 数量×单价 或 子事项汇总 自动计算，开启后可手填。

## 技术说明

- 前端框架：React 18 + Vite 5 + TypeScript-free（JSX）
- UI：Ant Design 5 + `@ant-design/pro-components`（ProLayout / ProTable / ProForm）
- 数据层：`src/services/db.js` 封装 localStorage，后续可平滑替换为 SQLite / Supabase，业务代码无需改动
- 导出：`xlsx`（SheetJS）

## 目录结构

```
src/
  layout/        布局（ProLayout + 登录拦截）
  pages/
    orders/      订单管理
    expenses/    支出管理
    payables/    应付款管理
    statistics/  统计中心（二期占位）
  services/      数据服务（localStorage 封装）
  utils/         计算 / 格式化 / 导出
  constants/     预设选项与枚举
  components/    通用组件（可自定义下拉、汇总栏）
```
