import React, { useRef, useState } from 'react';
import {
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormDatePicker,
  ProFormRadio,
  ProFormSwitch,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { DrawerForm } from '@ant-design/pro-form';
import { Form, InputNumber, Tag, Space, Typography, message, Divider } from 'antd';
import AddableSelect from '../../components/AddableSelect';
import ImageUpload from '../../components/ImageUpload';
import {
  getOptions,
  addCustomOption,
  pushOrderTitleHistory,
} from '../../services/optionService';
import { upsertOrder } from '../../services/orderService';
import { ORDER_TYPES } from '../../constants/options';
import { num, round2, todayStr, yuan } from '../../utils/format';

export default function OrderForm({ open, record, onClose, onSuccess }) {
  const formRef = useRef();
  const [opts, setOpts] = useState(getOptions());

  const editing = record || null;

  const initialValues = editing
    ? {
        date: editing.date,
        type: editing.type,
        title: editing.title,
        customerName: editing.customerName,
        channel: editing.channel,
        qty: editing.qty,
        price: editing.price,
        manualTotal: editing.isManualTotal,
        totalAmount: editing.totalAmount,
        payMethod: editing.payMethod,
        remark: editing.remark,
        imageKey: editing.imageKey || null,
      }
    : {
        date: todayStr(),
        type: ORDER_TYPES[0],
        qty: 1,
        price: 0,
        manualTotal: false,
        totalAmount: 0,
        channel: getOptions().channels[0],
        payMethod: getOptions().payMethods[0],
      };

  const reAutoTotal = (all) => {
    if (!all.manualTotal) {
      formRef.current?.setFieldValue('totalAmount', round2(num(all.qty) * num(all.price)));
    }
  };

  const onValuesChange = (changed, all) => {
    if ('qty' in changed || 'price' in changed) reAutoTotal(all);
    if ('manualTotal' in changed && !all.manualTotal) reAutoTotal(all);
  };

  const onFinish = async (values) => {
    const order = {
      date: values.date,
      type: values.type,
      title: values.title?.trim(),
      customerName: values.customerName?.trim(),
      channel: values.channel,
      qty: num(values.qty),
      price: num(values.price),
      totalAmount: num(values.totalAmount),
      isManualTotal: !!values.manualTotal,
      payMethod: values.payMethod,
      remark: values.remark,
      imageKey: values.imageKey || null,
    };
    if (editing) order.id = editing.id;
    upsertOrder(order);
    pushOrderTitleHistory(order.title);
    message.success(editing ? '订单已更新' : '订单已创建');
    onSuccess?.();
    onClose?.();
  };

  const handleAdd = (field, v) => {
    addCustomOption(field, v);
    setOpts(getOptions());
  };

  return (
    <DrawerForm
      title={editing ? '编辑订单' : '新建订单'}
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      width="50%"
      drawerProps={{ destroyOnClose: true }}
      formRef={formRef}
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      onFinish={onFinish}
      submitter={{
        searchConfig: { submitText: '保存', resetText: '取消' },
        resetButtonProps: { onClick: () => onClose?.() },
      }}
    >
      <div className="form-section-title">基础信息</div>
      <ProFormDatePicker
        name="date"
        label="订单日期"
        rules={[{ required: true, message: '请选择订单日期' }]}
        fieldProps={{ style: { width: '100%' }, format: 'YYYY-MM-DD' }}
      />
      <ProFormRadio.Group
        name="type"
        label="订单类型"
        rules={[{ required: true, message: '请选择订单类型' }]}
        options={ORDER_TYPES.map((t) => ({ label: t, value: t }))}
      />
      <ProFormText
        name="title"
        label="订单标题"
        placeholder="输入标题，下方可快速复用历史"
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

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">客户信息</div>
      <ProFormText name="customerName" label="客户名称" placeholder="选填" />
      <Form.Item
        name="channel"
        label="联系渠道"
        rules={[{ required: true, message: '请选择联系渠道' }]}
      >
        <AddableSelect
          placeholder="选择或输入自定义渠道"
          options={opts.channels}
          onAdd={(v) => handleAdd('channels', v)}
        />
      </Form.Item>

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">销售信息</div>
      <ProFormDigit
        name="qty"
        label="数量"
        rules={[{ required: true, message: '请输入数量' }]}
        fieldProps={{ min: 0, precision: 2, style: { width: '100%' } }}
      />
      <ProFormDigit
        name="price"
        label="单价"
        rules={[{ required: true, message: '请输入单价' }]}
        fieldProps={{ min: 0, precision: 2, style: { width: '100%' }, prefix: '¥' }}
      />
      <ProFormSwitch name="manualTotal" label="手动调整总金额" />
      <Form.Item
        noStyle
        shouldUpdate={(prev, cur) => prev.manualTotal !== cur.manualTotal}
      >
        {({ getFieldValue }) => (
          <Form.Item
            name="totalAmount"
            label="销售总金额"
            tooltip="关闭「手动调整」时，自动按 数量×单价 计算"
            rules={[{ required: true, message: '请输入销售总金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
              disabled={!getFieldValue('manualTotal')}
            />
          </Form.Item>
        )}
      </Form.Item>

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">收款信息</div>
      <Form.Item
        name="payMethod"
        label="收款方式"
        rules={[{ required: true, message: '请选择收款方式' }]}
      >
        <AddableSelect
          placeholder="选择或输入自定义收款方式"
          options={opts.payMethods}
          onAdd={(v) => handleAdd('payMethods', v)}
        />
      </Form.Item>

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">其他</div>
      <ProFormTextArea name="remark" label="备注" placeholder="选填" />
      <Form.Item name="imageKey" label="货品图片">
        <ImageUpload />
      </Form.Item>
    </DrawerForm>
  );
}
