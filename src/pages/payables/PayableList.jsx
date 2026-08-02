import React, { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Popconfirm, message, Tooltip } from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import SummaryBar from '../../components/SummaryBar';
import PayableForm from './PayableForm';
import PayableDetail from './PayableDetail';
import SettleModal from './SettleModal';
import { getPayables, deletePayable, payableStatusOf } from '../../services/payableService';
import { getOrders } from '../../services/orderService';
import { payableRemaining } from '../../utils/calc';
import { yuan, num } from '../../utils/format';
import { exportExcel } from '../../utils/exportService';
import { BELONG_TYPE_ENUM, PAYABLE_STATUS, PAYABLE_STATUS_ENUM, DATE_RANGE_PRESETS } from '../../constants/options';
import { COLORS } from '../../utils/theme';

const STATUS_ENUM = {
  [PAYABLE_STATUS.UNPAID]: { text: PAYABLE_STATUS.UNPAID },
  [PAYABLE_STATUS.PARTIAL]: { text: PAYABLE_STATUS.PARTIAL },
  [PAYABLE_STATUS.PAID]: { text: PAYABLE_STATUS.PAID },
};

export default function PayableList() {
  const actionRef = useRef();
  const [summary, setSummary] = useState(0);
  const [filteredAll, setFilteredAll] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settle, setSettle] = useState(null);
  const [settleOpen, setSettleOpen] = useState(false);

  const orderMap = () => {
    const m = {};
    getOrders().forEach((o) => (m[o.id] = o.title));
    return m;
  };

  const request = async (params) => {
    let data = await getPayables();
    if (params.dateRange?.length === 2) {
      const [s, e] = params.dateRange;
      data = data.filter((x) => x.date >= s && x.date <= e);
    }
    if (params.belongType) data = data.filter((x) => x.belongType === params.belongType);
    if (params.status) data = data.filter((x) => payableStatusOf(x) === params.status);
    if (params.supplier) data = data.filter((x) => (x.supplier || '').includes(params.supplier));

    const totalRemaining = data.reduce((s, x) => s + payableRemaining(x), 0);
    setSummary(totalRemaining);
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
      filename: `应付款_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { title: '创建日期', dataIndex: 'date' },
        { title: '归属类型', dataIndex: 'belongType' },
        { title: '归属对象', dataIndex: 'belong' },
        { title: '供货商', dataIndex: 'supplier' },
        { title: '应付总金额', dataIndex: 'totalAmount' },
        { title: '已结清金额', dataIndex: 'paidAmount' },
        { title: '剩余未结', dataIndex: 'remaining' },
        { title: '结清状态', dataIndex: 'status' },
      ],
      dataSource: filteredAll.map((x) => ({
        date: x.date,
        belongType: x.belongType,
        belong: x.belongType === '订单支出' ? m[x.orderId] || '-' : x.month,
        supplier: x.supplier,
        totalAmount: x.totalAmount,
        paidAmount: x.paidAmount,
        remaining: payableRemaining(x),
        status: payableStatusOf(x),
      })),
    });
    message.success('导出成功');
  };

  const handleDelete = async (id) => {
    await deletePayable(id);
    message.success('已删除');
    actionRef.current?.reload();
  };

  const openDetail = (p) => {
    setDetail(p);
    setDetailOpen(true);
  };

  const columns = [
    { title: '创建日期', dataIndex: 'date', valueType: 'date', hideInSearch: true, width: 110 },
    { title: '创建日期', dataIndex: 'dateRange', valueType: 'dateRange', hideInTable: true, fieldProps: { presets: DATE_RANGE_PRESETS } },
    { title: '归属类型', dataIndex: 'belongType', valueType: 'select', valueEnum: BELONG_TYPE_ENUM, width: 100 },
    {
      title: '归属对象',
      dataIndex: 'belong',
      hideInSearch: true,
      width: 150,
      render: (_, r) => (r.belongType === '订单支出' ? orderMap()[r.orderId] || '-' : r.month),
    },
    { title: '供货商', dataIndex: 'supplier', width: 120 },
    { title: '应付总额', dataIndex: 'totalAmount', hideInSearch: true, width: 110, render: (_, r) => yuan(r.totalAmount) },
    { title: '已结清', dataIndex: 'paidAmount', hideInSearch: true, width: 110, render: (_, r) => yuan(r.paidAmount) },
    {
      title: '剩余未结',
      dataIndex: 'remaining',
      hideInSearch: true,
      width: 110,
      render: (_, r) => <span style={{ color: '#d46b08' }}>{yuan(payableRemaining(r))}</span>,
    },
    {
      title: '结清状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: STATUS_ENUM,
      width: 100,
      render: (_, r) => {
        const s = payableStatusOf(r);
        return <Tag color={PAYABLE_STATUS_ENUM[s].status}>{s}</Tag>;
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, r) => [
        <Tooltip key="detail" title="详情">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: COLORS.primary }} />}
            onClick={() => openDetail(r)}
          />
        </Tooltip>,
        <Tooltip key="settle" title="结清">
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined style={{ color: COLORS.success }} />}
            disabled={payableRemaining(r) <= 0}
            onClick={() => {
              setSettle(r);
              setSettleOpen(true);
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
        <Popconfirm key="del" title="删除应付款将一并删除其结清流水，确认？" onConfirm={() => handleDelete(r.id)}>
          <Tooltip title="删除">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div>
      <SummaryBar items={[{ label: '总未结清金额', value: summary, color: COLORS.metricUnpaid, icon: <WarningOutlined /> }]} />
      <ProTable
        headerTitle={<span style={{ fontSize: 16, fontWeight: 600 }}>应付款管理</span>}
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
            新增应付款
          </Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出当前结果
          </Button>,
        ]}
      />
      <PayableForm
        open={formOpen}
        record={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />
      <PayableDetail
        open={detailOpen}
        payable={detail}
        onClose={() => setDetailOpen(false)}
        onSettle={(p) => {
          setDetailOpen(false);
          setSettle(p);
          setSettleOpen(true);
        }}
      />
      <SettleModal
        open={settleOpen}
        payable={settle}
        onClose={() => setSettleOpen(false)}
        onSuccess={() => {
          setSettleOpen(false);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
