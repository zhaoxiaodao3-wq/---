import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Popconfirm, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FundOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import SummaryBar from '../../components/SummaryBar';
import OrderForm from './OrderForm';
import OrderDetail from './OrderDetail';
import { getOrders, deleteOrder } from '../../services/orderService';
import { getExpenses } from '../../services/expenseService';
import { getPayables } from '../../services/payableService';
import {
  orderExpenseAmount,
  orderProfit,
  summarizeOrders,
  payableRemaining,
  aggregatePayableStatusForOrder,
} from '../../utils/calc';
import { yuan, formatMoney, num } from '../../utils/format';
import { exportExcel } from '../../utils/exportService';
import { ORDER_TYPE_ENUM, PAYABLE_STATUS_ENUM, DATE_RANGE_PRESETS } from '../../constants/options';
import { COLORS } from '../../utils/theme';

export default function OrderList() {
  const actionRef = useRef();
  const [summary, setSummary] = useState({ totalQty: 0, totalSales: 0, totalExpense: 0, totalProfit: 0, unpaid: 0 });
  const [filteredAll, setFilteredAll] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const request = async (params) => {
    const expenses = await getExpenses();
    const payables = await getPayables();
    let data = await getOrders();

    if (params.dateRange?.length === 2) {
      const [s, e] = params.dateRange;
      data = data.filter((o) => o.date >= s && o.date <= e);
    }
    if (params.type) data = data.filter((o) => o.type === params.type);
    if (params.customerName)
      data = data.filter((o) => (o.customerName || '').includes(params.customerName));
    if (params.payMethod) data = data.filter((o) => o.payMethod === params.payMethod);

    const rows = data.map((o) => ({
      ...o,
      _expense: orderExpenseAmount(o.id, expenses),
      _profit: orderProfit(o, expenses),
      _payStatus: aggregatePayableStatusForOrder(o.id, payables),
    }));

    // 汇总指标
    const sum = summarizeOrders(data, expenses);
    const ids = new Set(data.map((o) => o.id));
    const unpaid = payables
      .filter((p) => p.belongType === '订单支出' && ids.has(p.orderId))
      .reduce((s, p) => s + payableRemaining(p), 0);
    setSummary({ ...sum, unpaid });
    setFilteredAll(rows);

    const current = params.current || 1;
    const pageSize = params.pageSize || 20;
    const start = (current - 1) * pageSize;
    return {
      data: rows.slice(start, start + pageSize),
      success: true,
      total: rows.length,
    };
  };

  const handleExport = () => {
    if (filteredAll.length === 0) {
      message.warning('当前筛选无数据可导出');
      return;
    }
    exportExcel({
      filename: `销售订单_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { title: '订单日期', dataIndex: 'date' },
        { title: '订单类型', dataIndex: 'type' },
        { title: '订单标题', dataIndex: 'title' },
        { title: '客户名称', dataIndex: 'customerName' },
        { title: '数量', dataIndex: 'qty' },
        { title: '单价', dataIndex: 'price' },
        { title: '销售总金额', dataIndex: 'totalAmount' },
        { title: '收款方式', dataIndex: 'payMethod' },
        { title: '已支付支出', dataIndex: 'expense' },
        { title: '利润', dataIndex: 'profit' },
        { title: '关联应付款状态', dataIndex: 'payStatus' },
      ],
      dataSource: filteredAll.map((r) => ({
        date: r.date,
        type: r.type,
        title: r.title,
        customerName: r.customerName,
        qty: r.qty,
        price: r.price,
        totalAmount: r.totalAmount,
        payMethod: r.payMethod,
        expense: formatMoney(r._expense),
        profit: formatMoney(r._profit),
        payStatus: r._payStatus || '无',
      })),
    });
    message.success('导出成功');
  };

  const handleDelete = async (id) => {
    const r = await deleteOrder(id);
    message.success(`已删除订单（含 ${r.expenses} 条支出、${r.payables} 条应付款）`);
    actionRef.current?.reload();
  };

  const columns = [
    { title: '订单日期', dataIndex: 'date', valueType: 'date', hideInSearch: true, width: 110 },
    {
      title: '订单日期',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      fieldProps: { presets: DATE_RANGE_PRESETS },
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: ORDER_TYPE_ENUM,
      width: 100,
    },
    { title: '订单标题', dataIndex: 'title', hideInSearch: true, ellipsis: true },
    { title: '客户名称', dataIndex: 'customerName', hideInSearch: true, width: 110 },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      hideInTable: true,
      valueType: 'text',
    },
    { title: '数量', dataIndex: 'qty', hideInSearch: true, width: 80 },
    {
      title: '单价',
      dataIndex: 'price',
      hideInSearch: true,
      width: 110,
      render: (_, r) => yuan(r.price),
    },
    {
      title: '销售总金额',
      dataIndex: 'totalAmount',
      hideInSearch: true,
      width: 120,
      render: (_, r) => yuan(r.totalAmount),
    },
    {
      title: '收款方式',
      dataIndex: 'payMethod',
      hideInSearch: true,
      width: 110,
    },
    {
      title: '收款方式',
      dataIndex: 'payMethod',
      hideInTable: true,
      valueType: 'text',
    },
    {
      title: '已支付支出',
      dataIndex: '_expense',
      hideInSearch: true,
      width: 120,
      render: (_, r) => yuan(r._expense),
    },
    {
      title: '利润',
      dataIndex: '_profit',
      hideInSearch: true,
      width: 120,
      render: (_, r) => <span style={{ color: r._profit < 0 ? '#cf1322' : '#3f8600' }}>{yuan(r._profit)}</span>,
    },
    {
      title: '关联应付款',
      dataIndex: '_payStatus',
      hideInSearch: true,
      width: 100,
      render: (_, r) =>
        r._payStatus ? <Tag color={PAYABLE_STATUS_ENUM[r._payStatus].status}>{r._payStatus}</Tag> : '无',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 110,
      fixed: 'right',
      render: (_, r) => [
        <Tooltip key="detail" title="详情">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: COLORS.primary }} />}
            onClick={() => {
              setDetailId(r.id);
              setDetailOpen(true);
            }}
          />
        </Tooltip>,
        <Tooltip key="edit" title="编辑">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: COLORS.warning }} />}
            onClick={() => {
              setEditing(r);
              setFormOpen(true);
            }}
          />
        </Tooltip>,
        <Popconfirm
          key="del"
          title="删除订单将级联删除其关联支出与应付款，确认？"
          onConfirm={() => handleDelete(r.id)}
        >
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div>
      <SummaryBar
        items={[
          { label: '总销售数量', value: summary.totalQty, precision: 0, color: COLORS.metricQty, icon: <ShoppingCartOutlined /> },
          { label: '总销售金额', value: summary.totalSales, color: COLORS.metricSales, icon: <DollarOutlined /> },
          { label: '总已支付支出', value: summary.totalExpense, color: COLORS.metricExpense, icon: <FundOutlined /> },
          { label: '总利润', value: summary.totalProfit, color: COLORS.metricProfit, icon: <RiseOutlined /> },
          { label: '总未结清金额', value: summary.unpaid, color: COLORS.metricUnpaid, icon: <WarningOutlined /> },
        ]}
      />
      <ProTable
        headerTitle={
          <span style={{ fontSize: 16, fontWeight: 600 }}>销售订单</span>
        }
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            style={{ background: COLORS.primary, borderColor: COLORS.primary }}
          >
            新建订单
          </Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出当前结果
          </Button>,
        ]}
      />
      <OrderForm
        open={formOpen}
        record={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />
      <OrderDetail open={detailOpen} orderId={detailId} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
