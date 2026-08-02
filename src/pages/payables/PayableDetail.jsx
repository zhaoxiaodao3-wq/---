import React from 'react';
import { Drawer, Descriptions, Table, Tag, Button, Typography, Empty, Timeline, Space } from 'antd';
import { CheckOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getOrders } from '../../services/orderService';
import { payableStatusOf } from '../../services/payableService';
import { payableRemaining } from '../../utils/calc';
import { yuan } from '../../utils/format';
import { PAYABLE_STATUS_ENUM } from '../../constants/options';
import { COLORS } from '../../utils/theme';

export default function PayableDetail({ open, payable, onClose, onSettle }) {
  if (!payable) return <Drawer open={open} onClose={onClose} />;

  const orderMap = {};
  getOrders().forEach((o) => (orderMap[o.id] = o.title));
  const belongText = payable.belongType === '订单支出' ? orderMap[payable.orderId] || '-' : payable.month;
  const status = payableStatusOf(payable);
  const remaining = payableRemaining(payable);

  const subColumns = [
    { title: '事项名称', dataIndex: 'name' },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v) => yuan(v) },
  ];

  const settlements = [...(payable.settlements || [])].sort((a, b) => (a.time < b.time ? 1 : -1));

  return (
    <Drawer
      title={`应付款详情 - ${payable.supplier}`}
      width={640}
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<CheckOutlined />}
          disabled={remaining <= 0}
          onClick={() => onSettle?.(payable)}
          style={{ background: COLORS.primary, borderColor: COLORS.primary }}
        >
          结清
        </Button>
      }
    >
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="创建日期">{payable.date}</Descriptions.Item>
        <Descriptions.Item label="归属类型">{payable.belongType}</Descriptions.Item>
        <Descriptions.Item label="归属对象" span={2}>{belongText}</Descriptions.Item>
        <Descriptions.Item label="供货商">{payable.supplier}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={PAYABLE_STATUS_ENUM[status].status}>{status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="应付总额">
          <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{yuan(payable.totalAmount)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="已结清">
          <span style={{ fontWeight: 600, color: COLORS.success }}>{yuan(payable.paidAmount)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="剩余未结" span={2}>
          <span style={{ fontWeight: 600, color: remaining > 0 ? COLORS.warning : COLORS.textTertiary, fontSize: 16 }}>
            {yuan(remaining)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>{payable.remark || '-'}</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
        应付子事项
      </Typography.Title>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        columns={subColumns}
        dataSource={payable.subItems || []}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无子事项" /> }}
      />

      <Typography.Title level={5} style={{ marginTop: 24, marginBottom: 12 }}>
        结清流水
      </Typography.Title>
      {settlements.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无结清记录" />
      ) : (
        <Timeline
          items={settlements.map((s) => ({
            color: COLORS.success,
            dot: <CheckCircleOutlined style={{ color: COLORS.success }} />,
            children: (
              <div>
                <Space size={8} wrap>
                  <Tag color={s.mode === '金额' ? 'blue' : 'purple'}>{s.mode}</Tag>
                  <strong style={{ color: COLORS.success, fontSize: 15 }}>{yuan(s.amount)}</strong>
                  <Typography.Text type="secondary">
                    <ClockCircleOutlined /> {new Date(s.time).toLocaleString('zh-CN')}
                  </Typography.Text>
                </Space>
                <div style={{ marginTop: 4, fontSize: 13, color: '#595959' }}>
                  {s.items && s.items.length > 0 ? `结清事项：${s.items.join('、')}` : '按金额结清'}
                  {s.remark ? ` ｜ 备注：${s.remark}` : ''}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
}