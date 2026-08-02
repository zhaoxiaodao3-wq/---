import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag, Tooltip } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  FundOutlined,
} from '@ant-design/icons';
import SummaryBar from '../../components/SummaryBar';
import ExpenseForm from './ExpenseForm';
import { getExpenses, deleteExpense } from '../../services/expenseService';
import { getOrders } from '../../services/orderService';
import { yuan, formatMoney, num } from '../../utils/format';
import { exportExcel } from '../../utils/exportService';
import { COLORS } from '../../utils/theme';
import { BELONG_TYPE_ENUM, DATE_RANGE_PRESETS } from '../../constants/options';

export default function ExpenseList() {
  const actionRef = useRef();
  const [summary, setSummary] = useState(0);
  const [filteredAll, setFilteredAll] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const orderMap = () => {
    const m = {};
    getOrders().forEach((o) => (m[o.id] = o.title));
    return m;
  };

  const request = async (params) => {
    let data = getExpenses();
    if (params.dateRange?.length === 2) {
      const [s, e] = params.dateRange;
      data = data.filter((x) => x.date >= s && x.date <= e);
    }
    if (params.belongType) data = data.filter((x) => x.belongType === params.belongType);
    if (params.source) data = data.filter((x) => (x.source || '').includes(params.source));
    if (params.title) data = data.filter((x) => (x.title || '').includes(params.title));

    const total = data.reduce((s, x) => s + num(x.amount), 0);
    setSummary(total);
    setFilteredAll(data);

    const current = params.current || 1;
    const pageSize = params.pageSize || 20;
    const start = (current - 1) * pageSize;
    return { data: data.slice(start, start + pageSize), success: true, total: data.length };
  };

  const handleExport = () => {
    if (filteredAll.length === 0) return message.warning('当前筛选无数据可导出');
    const m = orderMap();
    exportExcel({
      filename: `支出记录_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { title: '支出日期', dataIndex: 'date' },
        { title: '归属类型', dataIndex: 'belongType' },
        { title: '归属对象', dataIndex: 'belong' },
        { title: '支出标题', dataIndex: 'title' },
        { title: '支出金额', dataIndex: 'amount' },
        { title: '支出源头', dataIndex: 'source' },
        { title: '备注', dataIndex: 'remark' },
      ],
      dataSource: filteredAll.map((x) => ({
        date: x.date,
        belongType: x.belongType,
        belong: x.belongType === '订单支出' ? m[x.orderId] || '-' : x.month,
        title: x.title,
        amount: x.amount,
        source: x.source,
        remark: x.remark,
      })),
    });
    message.success('导出成功');
  };

  const handleDelete = (id) => {
    deleteExpense(id);
    message.success('已删除');
    actionRef.current?.reload();
  };

  const columns = [
    { title: '支出日期', dataIndex: 'date', valueType: 'date', hideInSearch: true, width: 110 },
    { title: '支出日期', dataIndex: 'dateRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: DATE_RANGE_PRESETS } },
    {
      title: '归属类型',
      dataIndex: 'belongType',
      valueType: 'select',
      valueEnum: BELONG_TYPE_ENUM,
      width: 100,
    },
    {
      title: '归属对象',
      dataIndex: 'belong',
      hideInSearch: true,
      width: 160,
      render: (_, r) => (r.belongType === '订单支出' ? orderMap()[r.orderId] || '-' : r.month),
    },
    { title: '支出标题', dataIndex: 'title', width: 140 },
    {
      title: '支出金额',
      dataIndex: 'amount',
      hideInSearch: true,
      width: 120,
      render: (_, r) => yuan(r.amount),
    },
    { title: '支出源头', dataIndex: 'source', width: 120 },
    { title: '备注', dataIndex: 'remark', hideInSearch: true, ellipsis: true },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, r) => [
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
        <Popconfirm key="del" title="确认删除该支出？" onConfirm={() => handleDelete(r.id)}>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div>
      <SummaryBar items={[{ label: '筛选支出合计', value: summary, color: COLORS.metricExpense, icon: <FundOutlined /> }]} />
      <ProTable
        headerTitle={<span style={{ fontSize: 16, fontWeight: 600 }}>支出管理</span>}
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
            新增支出
          </Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出当前结果
          </Button>,
        ]}
      />
      <ExpenseForm
        open={formOpen}
        record={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />
    </div>
  );
}
