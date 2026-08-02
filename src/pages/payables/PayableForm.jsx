import React, { useRef, useState } from 'react';
import {
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormDatePicker,
  ProFormRadio,
  ProFormTextArea,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { DrawerForm } from '@ant-design/pro-form';
import { Form, InputNumber, Input, Button, Space, message, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { upsertPayable } from '../../services/payableService';
import { orderOptions } from '../../services/orderService';
import { BELONG_TYPES } from '../../constants/options';
import { num, round2, todayStr, currentMonthStr } from '../../utils/format';

export default function PayableForm({ open, record, defaultOrderId, onClose, onSuccess }) {
  const formRef = useRef();
  const [orders] = useState(() => orderOptions());
  const editing = record || null;

  const orderSelectOptions = orders.map((o) => ({ label: o.label, value: o.id }));

  const initialValues = editing
    ? {
        date: editing.date,
        belongType: editing.belongType,
        orderId: editing.orderId,
        month: editing.month,
        supplier: editing.supplier,
        subItems: editing.subItems && editing.subItems.length ? editing.subItems : [],
        isManualTotal: !!editing.isManualTotal,
        totalAmount: editing.totalAmount,
        remark: editing.remark,
      }
    : {
        date: todayStr(),
        belongType: BELONG_TYPES[0],
        orderId: defaultOrderId,
        month: currentMonthStr(),
        subItems: [],
        isManualTotal: false,
        totalAmount: 0,
      };

  const reAutoTotal = (all) => {
    if (!all.isManualTotal) {
      const sum = (all.subItems || []).reduce((s, it) => s + num(it?.amount), 0);
      formRef.current?.setFieldValue('totalAmount', round2(sum));
    }
  };

  const onValuesChange = (changed, all) => {
    if ('subItems' in changed) reAutoTotal(all);
    if ('isManualTotal' in changed && !all.isManualTotal) reAutoTotal(all);
  };

  const onFinish = async (values) => {
    const subItems = (values.subItems || []).map((it) => ({
      id: it.id || `si_${Math.random().toString(36).slice(2, 8)}`,
      name: it.name?.trim(),
      amount: num(it.amount),
    }));
    const payable = {
      date: values.date,
      belongType: values.belongType,
      supplier: values.supplier?.trim(),
      subItems,
      totalAmount: num(values.totalAmount),
      isManualTotal: !!values.isManualTotal,
      remark: values.remark,
      orderId: values.belongType === '订单支出' ? values.orderId : undefined,
      month: values.belongType === '月度支出' ? values.month : undefined,
    };
    if (editing) payable.id = editing.id;
    upsertPayable(payable);
    message.success(editing ? '应付款已更新' : '应付款已创建');
    onSuccess?.();
    onClose?.();
  };

  return (
    <DrawerForm
      title={editing ? '编辑应付款' : '新增应付款'}
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
        label="创建日期"
        rules={[{ required: true, message: '请选择创建日期' }]}
        fieldProps={{ style: { width: '100%' }, format: 'YYYY-MM-DD' }}
      />

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">归属与供货商</div>
      <ProFormRadio.Group
        name="belongType"
        label="归属类型"
        rules={[{ required: true }]}
        options={BELONG_TYPES.map((t) => ({ label: t, value: t }))}
      />
      <Form.Item noStyle shouldUpdate={(p, c) => p.belongType !== c.belongType}>
        {({ getFieldValue }) =>
          getFieldValue('belongType') === '订单支出' ? (
            <ProFormSelect
              name="orderId"
              label="关联订单"
              rules={[{ required: true, message: '请选择关联订单' }]}
              options={orderSelectOptions}
              showSearch
              fieldProps={{ filterOption: (input, option) => (option.label || '').includes(input) }}
            />
          ) : (
            <ProFormDatePicker.Month
              name="month"
              label="归属月份"
              rules={[{ required: true, message: '请选择归属月份' }]}
              fieldProps={{ style: { width: '100%' }, format: 'YYYY-MM' }}
            />
          )
        }
      </Form.Item>
      <ProFormText name="supplier" label="供货商名称" rules={[{ required: true, message: '请输入供货商名称' }]} />

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">应付子事项</div>
      <Form.Item label=" " colon={false} extra="逐项录入子事项，自动汇总成应付总额">
        <Form.List name="subItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item name={[name, 'name']} rules={[{ required: true, message: '名称' }]} style={{ marginBottom: 0 }}>
                    <Input placeholder="事项名称" style={{ width: 180 }} />
                  </Form.Item>
                  <Form.Item name={[name, 'amount']} rules={[{ required: true, message: '金额' }]} style={{ marginBottom: 0 }}>
                    <InputNumber min={0} precision={2} prefix="¥" placeholder="金额" style={{ width: 140 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add({ name: '', amount: 0 })} block icon={<PlusOutlined />}>
                添加子事项
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">应付总额</div>
      <ProFormSwitch name="isManualTotal" label="手动调整总额" />
      <Form.Item
        noStyle
        shouldUpdate={(p, c) => p.isManualTotal !== c.isManualTotal}
      >
        {({ getFieldValue }) => (
          <Form.Item
            name="totalAmount"
            label="应付总金额"
            tooltip="关闭「手动调整」时，自动按子事项金额汇总"
            rules={[{ required: true, message: '请输入应付总金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
              disabled={!getFieldValue('isManualTotal')}
            />
          </Form.Item>
        )}
      </Form.Item>

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">其他</div>
      <ProFormTextArea name="remark" label="备注" placeholder="选填" />
    </DrawerForm>
  );
}
