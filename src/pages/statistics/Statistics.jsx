import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Input,
  Button,
  Table,
  Space,
  Typography,
  message,
  Segmented,
  Collapse,
  Spin,
} from 'antd';
import {
  DownloadOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FundOutlined,
  RiseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import SummaryBar from '../../components/SummaryBar';
import EmptyState from '../../components/EmptyState';
import api from '../../services/apiClient';
import { yuan, formatMoney, num } from '../../utils/format';
import { exportExcel } from '../../utils/exportService';
import { ORDER_TYPES, DATE_RANGE_PRESETS } from '../../constants/options';
import { COLORS } from '../../utils/theme';

const { RangePicker } = DatePicker;

const DIM_OPTIONS = [
  { label: '按天', value: 'day' },
  { label: '按月', value: 'month' },
  { label: '按年', value: 'year' },
];

export default function Statistics() {
  const [dim, setDim] = useState('month');
  const [dateRange, setDateRange] = useState(null);
  const [orderType, setOrderType] = useState(undefined);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalQty: 0, totalSales: 0, totalExpense: 0, totalProfit: 0, totalUnpaid: 0 });
  const [rows, setRows] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('dim', dim);
      if (dateRange && dateRange.length === 2) {
        params.set('startDate', dateRange[0]);
        params.set('endDate', dateRange[1]);
      }
      if (orderType) params.set('type', orderType);
      if (customerName) params.set('channel', customerName); // 后端 stats 用 channel 筛选
      const data = await api.get(`/stats?${params.toString()}`);
      setSummary(data.summary);
      setRows(data.rows);
    } catch (e) {
      message.error('加载统计数据失败：' + (e.message || '网络错误'));
    } finally {
      setLoading(false);
    }
  }, [dim, dateRange, orderType, customerName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = () => {
    if (rows.length === 0) {
      message.warning('当前统计无数据可导出');
      return;
    }
    exportExcel({
      filename: `统计报表_${dim}_${new Date().toISOString().slice(0, 10)}`,
      columns: [
        { title: dim === 'day' ? '日期' : dim === 'month' ? '月份' : '年份', dataIndex: 'dimLabel' },
        { title: '销售数量', dataIndex: 'qty' },
        { title: '销售金额', dataIndex: 'sales' },
        { title: '已支付支出', dataIndex: 'expense' },
        { title: '利润', dataIndex: 'profit' },
      ],
      dataSource: rows.map((r) => ({
        dimLabel: r.dimLabel,
        qty: r.qty,
        sales: r.sales,
        expense: r.expense,
        profit: r.profit,
      })),
    });
    message.success('导出成功');
  };

  const dimLabel = dim === 'day' ? '日期' : dim === 'month' ? '月份' : '年份';
  const dimTitle = dim === 'day' ? '按日' : dim === 'month' ? '按月' : '按年';

  const columns = [
    {
      title: dimLabel,
      dataIndex: 'dimLabel',
      width: 140,
      sorter: (a, b) => (a.dimKey < b.dimKey ? 1 : -1),
      defaultSortOrder: 'ascend',
    },
    { title: '销售数量', dataIndex: 'qty', width: 120, render: (v) => formatMoney(v) },
    { title: '销售金额', dataIndex: 'sales', width: 140, render: (v) => yuan(v) },
    {
      title: '已支付支出',
      dataIndex: 'expense',
      width: 140,
      render: (v) => <span style={{ color: COLORS.danger, fontWeight: 500 }}>{yuan(v)}</span>,
    },
    {
      title: '利润',
      dataIndex: 'profit',
      width: 140,
      render: (v) => (
        <span style={{ color: v < 0 ? COLORS.danger : COLORS.success, fontWeight: 600 }}>
          {yuan(v)}
        </span>
      ),
      sorter: (a, b) => a.profit - b.profit,
    },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <Space>
              <Typography.Text strong style={{ color: COLORS.textPrimary }}>
                时间维度：
              </Typography.Text>
              <Segmented
                value={dim}
                onChange={setDim}
                options={DIM_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              />
            </Space>
          </Col>
          <Col flex="auto">
            <RangePicker
              value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
              onChange={(_, dateStrings) => setDateRange(dateStrings && dateStrings[0] ? dateStrings : null)}
              format="YYYY-MM-DD"
              presets={DATE_RANGE_PRESETS}
              style={{ width: 260 }}
            />
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="订单类型"
              value={orderType}
              onChange={setOrderType}
              style={{ width: 120 }}
              options={ORDER_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Col>
          <Col>
            <Input
              allowClear
              placeholder="客户名称"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: 140 }}
            />
          </Col>
          <Col>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} style={{ background: COLORS.primary, borderColor: COLORS.primary }}>
              导出统计
            </Button>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <SummaryBar
          items={[
            { label: '总销售数量', value: summary.totalQty, precision: 0, color: COLORS.metricQty, icon: <ShoppingCartOutlined /> },
            { label: '总销售金额', value: summary.totalSales, color: COLORS.metricSales, icon: <DollarOutlined /> },
            { label: '总已支付支出', value: summary.totalExpense, color: COLORS.metricExpense, icon: <FundOutlined /> },
            { label: '总利润', value: summary.totalProfit, color: COLORS.metricProfit, icon: <RiseOutlined /> },
            { label: '总未结清金额', value: summary.totalUnpaid, color: COLORS.metricUnpaid, icon: <WarningOutlined /> },
          ]}
        />
      </Spin>

      <Card
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>{dimTitle}统计明细</span>
        }
        size="small"
        extra={<Typography.Text type="secondary">共 {rows.length} 个周期</Typography.Text>}
        style={{ marginTop: 16 }}
      >
        <Spin spinning={loading}>
          {!loading && rows.length === 0 ? (
            <EmptyState
              variant="no-data"
              title="暂无统计数据"
              description="先在「销售订单」录入一些订单数据，这里就会自动聚合"
            />
          ) : (
            <Table
              rowKey="dimKey"
              size="middle"
              columns={columns}
              dataSource={rows}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              summary={(pageData) => {
                const tQty = pageData.reduce((s, r) => s + num(r.qty), 0);
                const tSales = pageData.reduce((s, r) => s + num(r.sales), 0);
                const tExp = pageData.reduce((s, r) => s + num(r.expense), 0);
                const tProfit = pageData.reduce((s, r) => s + num(r.profit), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafbfc' }}>
                      <Table.Summary.Cell index={0}><strong>本页合计</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>{formatMoney(tQty)}</Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>{yuan(tSales)}</Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <span style={{ color: COLORS.danger, fontWeight: 500 }}>{yuan(tExp)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <span style={{ color: tProfit < 0 ? COLORS.danger : COLORS.success, fontWeight: 600 }}>
                          {yuan(tProfit)}
                        </span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          )}
        </Spin>
      </Card>

      <Collapse
        ghost
        style={{ marginTop: 16, background: '#fff', borderRadius: 8 }}
        items={[
          {
            key: '1',
            label: (
              <Space>
                <InfoCircleOutlined style={{ color: COLORS.primary }} />
                <span style={{ fontSize: 13 }}>统计口径说明</span>
              </Space>
            ),
            children: (
              <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                订单支出按订单日期归属到对应周期；月度支出仅在「按月/按年」维度计入，按天维度不摊入单日利润。利润 = 销售金额 − 已支付支出；未结清金额为应付款剩余合计，不影响当期利润。
              </Typography.Paragraph>
            ),
          },
        ]}
      />
    </div>
  );
}
