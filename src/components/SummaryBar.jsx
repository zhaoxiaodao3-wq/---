import React from 'react';
import { Row, Col } from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  FundOutlined,
  RiseOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

// 顶部汇总指标卡片：左侧色条 + 图标 + 数值
// items: [{ label, value, icon?, color?, suffix? }]
const DEFAULT_ICONS = {
  销售数量: <ShoppingOutlined />,
  总销售金额: <DollarOutlined />,
  总销售数量: <ShoppingOutlined />,
  已支付支出: <FundOutlined />,
  总已支付支出: <FundOutlined />,
  利润: <RiseOutlined />,
  总利润: <RiseOutlined />,
  未结清: <WarningOutlined />,
  总未结清金额: <WarningOutlined />,
  应付总额: <FileTextOutlined />,
};

export default function SummaryBar({ items = [] }) {
  return (
    <div className="summary-bar">
      <Row gutter={[16, 16]}>
        {items.map((it) => {
          const accent = it.color || '#1677ff';
          const bg = it.iconBg || accent;
          const icon = it.icon || DEFAULT_ICONS[it.label] || <DollarOutlined />;
          return (
            <Col key={it.label} xs={24} sm={12} md={Math.floor(24 / Math.min(items.length, 6))}>
              <div
                className="summary-card"
                style={{ '--card-accent': accent }}
              >
                <div className="icon-wrap" style={{ background: bg }}>
                  {icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="metric-label">{it.label}</div>
                  <div className="metric-value" style={{ color: accent }}>
                    {typeof it.value === 'number'
                      ? it.value.toLocaleString('zh-CN', {
                          minimumFractionDigits: it.precision ?? 2,
                          maximumFractionDigits: it.precision ?? 2,
                        })
                      : it.value}
                    {it.suffix && <span className="metric-suffix">{it.suffix}</span>}
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}