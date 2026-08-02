import React, { useState, useMemo, useEffect } from 'react';
import { Drawer, Descriptions, Table, Button, Tag, Popconfirm, message, Divider, Typography, Image, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { getOrder } from '../../services/orderService';
import { getExpenses, deleteExpense } from '../../services/expenseService';
import { getPayables, payableStatusOf } from '../../services/payableService';
import { getImageURL } from '../../services/imageService';
import { orderExpenseAmount, orderProfit, payableRemaining, aggregatePayableStatusForOrder } from '../../utils/calc';
import { yuan } from '../../utils/format';
import { PAYABLE_STATUS_ENUM } from '../../constants/options';
import ExpenseForm from '../expenses/ExpenseForm';
import PayableForm from '../payables/PayableForm';
import SettleModal from '../payables/SettleModal';
import PayableDetail from '../payables/PayableDetail';
import { COLORS } from '../../utils/theme';

export default function OrderDetail({ open, orderId, onClose }) {
  const [version, setVersion] = useState(0);
  const [expForm, setExpForm] = useState({ open: false, record: null });
  const [payForm, setPayForm] = useState({ open: false, record: null });
  const [settle, setSettle] = useState({ open: false, payable: null });
  const [payDetail, setPayDetail] = useState({ open: false, payable: null });
  const [imageUrl, setImageUrl] = useState(null);

  const order = useMemo(() => (orderId ? getOrder(orderId) : null), [orderId, version]);
  const expenses = useMemo(
    () => getExpenses().filter((e) => e.belongType === '订单支出' && e.orderId === orderId),
    [orderId, version]
  );
  const payables = useMemo(
    () => getPayables().filter((p) => p.belongType === '订单支出' && p.orderId === orderId),
    [orderId, version]
  );

  if (!order && open) return <Drawer open={open} onClose={onClose} />;

  // 加载图片
  useEffect(() => {
    let active = true;
    let revoke = null;
    if (order?.imageKey) {
      getImageURL(order.imageKey).then((u) => {
        if (active) {
          setImageUrl(u);
          revoke = u;
        }
      });
    } else {
      setImageUrl(null);
    }
    return () => {
      active = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [order?.imageKey]);

  const refresh = () => setVersion((v) => v + 1);

  const orderExpense = orderExpenseAmount(order?.id, getExpenses());
  const orderProfitVal = order ? orderProfit(order, getExpenses()) : 0;
  const aggPayableStatus = aggregatePayableStatusForOrder(order?.id, getPayables());

  const expenseColumns = [
    { title: '支出日期', dataIndex: 'date', width: 110 },
    { title: '支出标题', dataIndex: 'title' },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v) => <span style={{ color: COLORS.danger }}>{yuan(v)}</span> },
    { title: '支出源头', dataIndex: 'source', width: 120 },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, r) => [
        <Tooltip key="edit" title="编辑">
          <Button type="text" size="small" icon={<EditOutlined style={{ color: COLORS.warning }} />} onClick={() => setExpForm({ open: true, record: r })} />
        </Tooltip>,
        <Popconfirm key="del" title="确认删除该支出？" onConfirm={() => { deleteExpense(r.id); message.success('已删除'); refresh(); }}>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ],
    },
  ];

  const payableColumns = [
    { title: '供货商', dataIndex: 'supplier', width: 120 },
    { title: '应付总额', dataIndex: 'totalAmount', width: 110, render: (v) => yuan(v) },
    { title: '已结清', dataIndex: 'paidAmount', width: 110, render: (v) => <span style={{ color: COLORS.success }}>{yuan(v)}</span> },
    {
      title: '剩余未结',
      width: 110,
      render: (_, r) => <span style={{ color: COLORS.warning }}>{yuan(payableRemaining(r))}</span>,
    },
    {
      title: '状态',
      width: 100,
      render: (_, r) => {
        const s = payableStatusOf(r);
        return <Tag color={PAYABLE_STATUS_ENUM[s].status}>{s}</Tag>;
      },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, r) => [
        <Tooltip key="settle" title="结清">
          <Button type="text" size="small" icon={<CheckOutlined style={{ color: COLORS.success }} />} onClick={() => setSettle({ open: true, payable: r })} />
        </Tooltip>,
        <Tooltip key="detail" title="详情">
          <Button type="text" size="small" icon={<DollarOutlined style={{ color: COLORS.primary }} />} onClick={() => setPayDetail({ open: true, payable: r })} />
        </Tooltip>,
      ],
    },
  ];

  return (
    <Drawer title="订单详情" width={760} open={open} onClose={onClose}>
      {order && (
        <>
          {/* 关键指标高亮区 */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 20,
              padding: 16,
              background: '#fafbfc',
              borderRadius: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>销售总金额</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.metricSales, marginTop: 4 }}>
                {yuan(order.totalAmount)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>已支付支出</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.metricExpense, marginTop: 4 }}>
                {yuan(orderExpense)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>利润</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: orderProfitVal < 0 ? COLORS.danger : COLORS.metricProfit,
                  marginTop: 4,
                }}
              >
                {yuan(orderProfitVal)}
              </div>
            </div>
          </div>

          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="订单日期">{order.date}</Descriptions.Item>
            <Descriptions.Item label="订单类型">
              <Tag color={order.type === '老板订单' ? 'gold' : 'blue'}>{order.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单标题" span={2}>
              <strong>{order.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="客户名称">{order.customerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系渠道">{order.channel}</Descriptions.Item>
            <Descriptions.Item label="数量">{order.qty}</Descriptions.Item>
            <Descriptions.Item label="单价">{yuan(order.price)}</Descriptions.Item>
            <Descriptions.Item label="收款方式">{order.payMethod}</Descriptions.Item>
            <Descriptions.Item label="关联应付款" span={2}>
              {aggPayableStatus ? <Tag color={PAYABLE_STATUS_ENUM[aggPayableStatus].status}>{aggPayableStatus}</Tag> : '无'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{order.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="货品图片" span={2}>
              {imageUrl ? (
                <Image src={imageUrl} width={160} height={160} style={{ objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <Typography.Text type="secondary">未上传</Typography.Text>
              )}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left" style={{ marginTop: 24 }}>
            <span style={{ fontWeight: 600 }}>关联支出（{expenses.length}）</span>
          </Divider>
          <div style={{ background: '#fff', padding: '4px 0' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ marginBottom: 12 }}
              onClick={() => setExpForm({ open: true, record: null })}
            >
              新增支出
            </Button>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={expenseColumns}
              dataSource={expenses}
              locale={{ emptyText: '暂无关联支出' }}
            />
          </div>

          <Divider orientation="left" style={{ marginTop: 24 }}>
            <span style={{ fontWeight: 600 }}>关联应付款（{payables.length}）</span>
          </Divider>
          <div style={{ background: '#fff', padding: '4px 0' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ marginBottom: 12 }}
              onClick={() => setPayForm({ open: true, record: null })}
            >
              新增应付款
            </Button>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={payableColumns}
              dataSource={payables}
              locale={{ emptyText: '暂无关联应付款' }}
            />
          </div>

          <ExpenseForm
            open={expForm.open}
            record={expForm.record}
            defaultOrderId={orderId}
            onClose={() => setExpForm({ open: false, record: null })}
            onSuccess={refresh}
          />
          <PayableForm
            open={payForm.open}
            record={payForm.record}
            defaultOrderId={orderId}
            onClose={() => setPayForm({ open: false, record: null })}
            onSuccess={refresh}
          />
          <SettleModal
            open={settle.open}
            payable={settle.payable}
            onClose={() => setSettle({ open: false, payable: null })}
            onSuccess={refresh}
          />
          <PayableDetail
            open={payDetail.open}
            payable={payDetail.payable}
            onClose={() => setPayDetail({ open: false, payable: null })}
            onSettle={(p) => {
              setPayDetail({ open: false, payable: null });
              setSettle({ open: true, payable: p });
            }}
          />
        </>
      )}
    </Drawer>
  );
}