import React, { useRef, useState, useEffect } from 'react';
import {
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormDatePicker,
  ProFormRadio,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { ModalForm } from '@ant-design/pro-form';
import {
  Form,
  InputNumber,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Divider,
  Card,
  Row,
  Col,
  Table,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import AddableSelect from '../../components/AddableSelect';
import ImageUpload from '../../components/ImageUpload';
import {
  getOptions,
  addCustomOption,
  pushOrderTitleHistory,
} from '../../services/optionService';
import { upsertOrder } from '../../services/orderService';
import { upsertPayable, getPayables } from '../../services/payableService';
import { ORDER_TYPES } from '../../constants/options';
import { num, round2, todayStr } from '../../utils/format';

const CHANNEL_OPTIONS = [
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: '微信', value: '微信' },
];

const emptyItem = () => ({
  product: '',
  qty: 1,
  price: 0,
  amount: 0,
  supplier: '',
  goodsExpense: 0,
  materialExpense: 0,
  laborExpense: 0,
  logisticsExpense: 0,
  otherExpense: 0,
});

// 表格列定义（销售信息 + 应付明细 合并为简道云式一行记录）
const itemColumns = (remove) => [
  {
    title: '货品',
    width: 130,
    render: (_, f) => (
      <Form.Item name={[f.name, 'product']} style={{ margin: 0 }} rules={[{ required: true, message: '必填' }]}>
        <Input placeholder="货品" />
      </Form.Item>
    ),
  },
  {
    title: '数量',
    width: 90,
    render: (_, f) => (
      <Form.Item name={[f.name, 'qty']} style={{ margin: 0 }} rules={[{ required: true, message: '必填' }]}>
        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '单价',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'price']} style={{ margin: 0 }} rules={[{ required: true, message: '必填' }]}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '单项金额',
    width: 110,
    render: (_, f) => (
      <Form.Item name={[f.name, 'amount']} style={{ margin: 0 }}>
        <InputNumber disabled prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '货品供应商',
    width: 130,
    render: (_, f) => (
      <Form.Item name={[f.name, 'supplier']} style={{ margin: 0 }}>
        <Input placeholder="供货商" />
      </Form.Item>
    ),
  },
  {
    title: '货品支出',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'goodsExpense']} style={{ margin: 0 }}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '材料支出',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'materialExpense']} style={{ margin: 0 }}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '人工支出',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'laborExpense']} style={{ margin: 0 }}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '物流支出',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'logisticsExpense']} style={{ margin: 0 }}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '其他支出',
    width: 100,
    render: (_, f) => (
      <Form.Item name={[f.name, 'otherExpense']} style={{ margin: 0 }}>
        <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
      </Form.Item>
    ),
  },
  {
    title: '操作',
    width: 60,
    fixed: 'right',
    render: (_, f) => (
      <MinusCircleOutlined
        onClick={() => remove(f.name)}
        style={{ color: '#ff4d4f', cursor: 'pointer' }}
      />
    ),
  },
];

export default function OrderForm({ open, record, onClose, onSuccess }) {
  const formRef = useRef();
  const syncing = useRef(false);
  const payableIdRef = useRef(null);
  const [opts, setOpts] = useState({
    payMethods: [],
    channels: [],
    orderTitleHistory: [],
    expenseTitleHistory: [],
  });

  useEffect(() => {
    getOptions().then(setOpts);
  }, []);

  const editing = record || null;

  const initialValues = editing
    ? {
        date: editing.date,
        type: editing.type,
        title: editing.title,
        customerName: editing.customerName,
        channel: editing.channel || 'WhatsApp',
        payMethod: editing.payMethod,
        remark: editing.remark,
        imageKey: editing.imageKey || null,
        customerPaid: editing.customerPaid || 0,
        items:
          editing.items && editing.items.length
            ? editing.items.map((it) => ({ ...emptyItem(), ...it }))
            : [{ ...emptyItem(), qty: editing.qty || 1, price: editing.price || 0 }],
        orderExpenseMatter: '',
        orderExpenseAmount: 0,
        orderExpenseRemark: '',
      }
    : {
        date: todayStr(),
        type: ORDER_TYPES[0],
        channel: 'WhatsApp',
        payMethod: opts?.payMethods?.[0] || '现金',
        customerPaid: 0,
        items: [emptyItem()],
        orderExpenseMatter: '',
        orderExpenseAmount: 0,
        orderExpenseRemark: '',
      };

  // 编辑时拉取已关联的应付款，回填支出明细与订单支出
  useEffect(() => {
    if (!editing || !editing.id) return;
    getPayables({ belongType: '订单支出' }).then((list) => {
      const p = (list || []).find((x) => x.orderId === editing.id);
      if (!p) return;
      payableIdRef.current = p.id;
      const set = {
        orderExpenseMatter: p.orderExpense?.matter || '',
        orderExpenseAmount: p.orderExpense?.amount || 0,
        orderExpenseRemark: p.orderExpense?.remark || '',
      };
      const items = formRef.current?.getFieldValue('items') || [];
      const merged = items.map((it) => {
        const sub = (p.subItems || []).find((s) => (s.product || s.name) === it.product);
        if (!sub) return it;
        return {
          ...it,
          supplier: sub.supplier || it.supplier,
          goodsExpense: sub.goodsExpense || 0,
          materialExpense: sub.materialExpense || 0,
          laborExpense: sub.laborExpense || 0,
          logisticsExpense: sub.logisticsExpense || 0,
          otherExpense: sub.otherExpense || 0,
        };
      });
      set.items = merged;
      formRef.current?.setFieldsValue(set);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // 数量/单价变化 → 自动算单项金额；订单支出金额变化 → 平均摊到各子项其他支出
  const onValuesChange = (changed, all) => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const items = all.items || [];
      items.forEach((it, i) => {
        const amt = round2(num(it?.qty) * num(it?.price));
        if (num(it?.amount) !== amt) {
          formRef.current?.setFieldValue(['items', i, 'amount'], amt);
        }
      });
      if ('orderExpenseAmount' in changed) {
        const n = items.length || 1;
        const share = round2(num(all.orderExpenseAmount) / n);
        items.forEach((_, i) => {
          formRef.current?.setFieldValue(['items', i, 'otherExpense'], share);
        });
      }
    } finally {
      syncing.current = false;
    }
  };

  const onFinish = async (values) => {
    const items = (values.items || []).map((it) => ({
      product: (it.product || '').trim(),
      qty: num(it.qty),
      price: round2(num(it.price)),
      amount: round2(num(it.qty) * num(it.price)),
      supplier: (it.supplier || '').trim(),
      goodsExpense: round2(num(it.goodsExpense)),
      materialExpense: round2(num(it.materialExpense)),
      laborExpense: round2(num(it.laborExpense)),
      logisticsExpense: round2(num(it.logisticsExpense)),
      otherExpense: round2(num(it.otherExpense)),
    }));
    const totalAmount = round2(items.reduce((s, i) => s + i.amount, 0));

    const order = {
      date: values.date,
      type: values.type,
      title: values.title?.trim(),
      customerName: values.customerName?.trim(),
      channel: values.channel,
      items,
      totalAmount,
      customerPaid: round2(num(values.customerPaid)),
      isManualTotal: false,
      payMethod: values.payMethod,
      remark: values.remark,
      imageKey: values.imageKey || null,
    };
    if (editing) order.id = editing.id;

    const saved = await upsertOrder(order);
    const orderId = saved?.id || editing?.id;

    if (orderId) {
      const subItems = items.map((it) => {
        const expenseTotal = round2(
          it.goodsExpense + it.materialExpense + it.laborExpense + it.logisticsExpense + it.otherExpense
        );
        return {
          id: `si_${Math.random().toString(36).slice(2, 8)}`,
          name: it.product,
          product: it.product,
          productQty: it.qty,
          productPrice: it.price,
          supplier: it.supplier,
          goodsExpense: it.goodsExpense,
          materialExpense: it.materialExpense,
          laborExpense: it.laborExpense,
          logisticsExpense: it.logisticsExpense,
          otherExpense: it.otherExpense,
          amount: expenseTotal,
        };
      });
      const payableTotal = round2(subItems.reduce((s, it) => s + it.amount, 0));
      const payable = {
        date: values.date,
        belongType: '订单支出',
        orderId,
        supplier: items[0]?.supplier || '',
        subItems,
        totalAmount: payableTotal,
        isManualTotal: false,
        remark: values.orderExpenseRemark || '',
        orderExpense: {
          matter: values.orderExpenseMatter || '',
          amount: round2(num(values.orderExpenseAmount)),
          remark: values.orderExpenseRemark || '',
        },
      };
      if (payableIdRef.current) payable.id = payableIdRef.current;
      await upsertPayable(payable);
    }

    await pushOrderTitleHistory(order.title);
    message.success(editing ? '订单已更新' : '订单已创建');
    onSuccess?.();
    onClose?.();
  };

  const handleAdd = async (field, v) => {
    await addCustomOption(field, v);
    const updated = await getOptions();
    setOpts(updated);
  };

  return (
    <ModalForm
      title={editing ? '编辑订单' : '新建订单'}
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      width="90%"
      modalProps={{ destroyOnClose: true, style: { maxWidth: 1200, minWidth: 320 } }}
      formRef={formRef}
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      onFinish={onFinish}
      submitter={{
        searchConfig: { submitText: '保存', resetText: '取消' },
        resetButtonProps: { onClick: () => onClose?.() },
      }}
    >
      {/* —— 基础信息 —— */}
      <div className="form-section-title">基础信息</div>
      <Row gutter={16}>
        <Col span={8}>
          <ProFormDatePicker
            name="date"
            label="订单日期"
            rules={[{ required: true, message: '请选择订单日期' }]}
            fieldProps={{ style: { width: '100%' }, format: 'YYYY-MM-DD' }}
          />
        </Col>
        <Col span={8}>
          <ProFormRadio.Group
            name="type"
            label="订单类型"
            rules={[{ required: true, message: '请选择订单类型' }]}
            options={ORDER_TYPES.map((t) => ({ label: t, value: t }))}
          />
        </Col>
        <Col span={8}>
          <ProFormText
            name="title"
            label="订单标题"
            placeholder="输入标题"
            rules={[{ required: true, message: '请输入订单标题' }]}
            extra={
              opts.orderTitleHistory.length > 0 ? (
                <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    最近：
                  </Typography.Text>
                  {opts.orderTitleHistory.map((t) => (
                    <Tag
                      key={t}
                      className="history-chip"
                      color="blue"
                      onClick={() => formRef.current?.setFieldValue('title', t)}
                    >
                      {t}
                    </Tag>
                  ))}
                </Space>
              ) : null
            }
          />
        </Col>
      </Row>

      {/* —— 客户与收款 —— */}
      <Divider style={{ margin: '12px 0 8px' }} />
      <div className="form-section-title">客户与收款</div>
      <Row gutter={16}>
        <Col span={8}>
          <ProFormText name="customerName" label="客户名称" placeholder="选填" />
        </Col>
        <Col span={8}>
          <Form.Item
            name="channel"
            label="联系渠道"
            rules={[{ required: true, message: '请选择联系渠道' }]}
          >
            <Select options={CHANNEL_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="payMethod"
            label="收款方式"
            rules={[{ required: true, message: '请选择收款方式' }]}
          >
            <AddableSelect
              placeholder="选择或输入"
              options={opts.payMethods}
              onAdd={(v) => handleAdd('payMethods', v)}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* —— 销售信息 + 应付明细（简道云式可编辑表格） —— */}
      <Divider style={{ margin: '12px 0 8px' }} />
      <div className="form-section-title">销售信息 / 应付明细</div>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        一行一条记录：前半为销售（货品/数量/单价，单项金额自动算），后半为应付支出（供应商/货品/材料/人工/物流/其他）。窗口缩小时表格内部横向滚动。
      </Typography.Text>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            <Table
              dataSource={fields}
              rowKey={(f) => f.key}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              columns={itemColumns(remove)}
            />
            <Button
              type="dashed"
              onClick={() => add(emptyItem())}
              block
              icon={<PlusOutlined />}
              style={{ marginTop: 8 }}
            >
              添加一行
            </Button>
          </>
        )}
      </Form.List>

      {/* 客户付款金额 + 销售总金额 + 应收余额 */}
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={8}>
          <Form.Item name="customerPaid" label="客户付款金额">
            <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            noStyle
            shouldUpdate={(p, c) =>
              JSON.stringify(p.items) !== JSON.stringify(c.items) || p.customerPaid !== c.customerPaid
            }
          >
            {({ getFieldValue }) => {
              const items = getFieldValue('items') || [];
              const sum = round2(items.reduce((s, it) => s + num(it?.amount), 0));
              const paid = round2(num(getFieldValue('customerPaid')));
              const balance = round2(sum - paid);
              return (
                <>
                  <Form.Item label="销售总金额" style={{ marginBottom: 0 }}>
                    <InputNumber value={sum} disabled prefix="¥" style={{ width: '100%' }} />
                  </Form.Item>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    应收余额：¥{balance}（销售总额 − 客户付款）
                  </Typography.Text>
                </>
              );
            }}
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={12}>
          <Form.Item name="imageKey" label="货品图片">
            <ImageUpload />
          </Form.Item>
        </Col>
        <Col span={12}>
          <ProFormTextArea
            name="remark"
            label="备注"
            placeholder="选填"
            fieldProps={{ autoSize: { minRows: 1, maxRows: 2 } }}
          />
        </Col>
      </Row>

      {/* ===== 订单支出（分摊到子项其他支出） ===== */}
      <Divider style={{ margin: '12px 0 8px' }} />
      <div className="form-section-title">订单支出</div>
      <Card size="small" title="订单支出（分摊到每行「其他支出」）" style={{ marginBottom: 12 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="orderExpenseMatter" label="事项">
              <Input placeholder="如：运费补贴" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="orderExpenseAmount" label="金额">
              <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="orderExpenseRemark" label="备注">
              <Input placeholder="选填" />
            </Form.Item>
          </Col>
        </Row>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          金额将平均分摊到每一行的「其他支出」
        </Typography.Text>
      </Card>

      {/* 支出总额（各子项支出求和） */}
      <Form.Item
        noStyle
        shouldUpdate={(p, c) => JSON.stringify(p.items) !== JSON.stringify(c.items)}
      >
        {({ getFieldValue }) => {
          const items = getFieldValue('items') || [];
          const sum = items.reduce(
            (s, it) =>
              s +
              num(it?.goodsExpense) +
              num(it?.materialExpense) +
              num(it?.laborExpense) +
              num(it?.logisticsExpense) +
              num(it?.otherExpense),
            0
          );
          return (
            <Form.Item label="支出总额" style={{ marginTop: 8, marginBottom: 0 }}>
              <Space>
                <InputNumber value={round2(sum)} disabled prefix="¥" style={{ width: 160 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  （货品+材料+人工+物流+其他 支出汇总）
                </Typography.Text>
              </Space>
            </Form.Item>
          );
        }}
      </Form.Item>
    </ModalForm>
  );
}
