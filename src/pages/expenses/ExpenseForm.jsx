import React, { useEffect, useRef, useState } from 'react';
import {
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormDatePicker,
  ProFormRadio,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-components';
import { DrawerForm } from '@ant-design/pro-form';
import { Form, Tag, Space, Typography, message, Divider } from 'antd';
import { getOptions, pushExpenseTitleHistory } from '../../services/optionService';
import { upsertExpense } from '../../services/expenseService';
import { orderOptions } from '../../services/orderService';
import { BELONG_TYPES } from '../../constants/options';
import { num, todayStr, currentMonthStr } from '../../utils/format';

export default function ExpenseForm({ open, record, defaultOrderId, onClose, onSuccess }) {
  const formRef = useRef();
  const [titleHistory, setTitleHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const editing = record || null;

  useEffect(() => {
    (async () => {
      const opts = await getOptions();
      setTitleHistory(opts.expenseTitleHistory || []);
      const list = await orderOptions();
      setOrders(list);
    })();
  }, []);

  const orderSelectOptions = orders.map((o) => ({ label: o.label, value: o.id }));

  const initialValues = editing
    ? {
        date: editing.date,
        belongType: editing.belongType,
        orderId: editing.orderId,
        month: editing.month,
        title: editing.title,
        amount: editing.amount,
        source: editing.source,
        remark: editing.remark,
      }
    : {
        date: todayStr(),
        belongType: BELONG_TYPES[0],
        orderId: defaultOrderId,
        month: currentMonthStr(),
        amount: 0,
      };

  const onFinish = async (values) => {
    const expense = {
      date: values.date,
      belongType: values.belongType,
      title: values.title?.trim(),
      amount: num(values.amount),
      source: values.source?.trim(),
      remark: values.remark,
      orderId: values.belongType === '订单支出' ? values.orderId : undefined,
      month: values.belongType === '月度支出' ? values.month : undefined,
    };
    if (editing) expense.id = editing.id;
    await upsertExpense(expense);
    await pushExpenseTitleHistory(expense.title);
    message.success(editing ? '支出已更新' : '支出已创建');
    onSuccess?.();
    onClose?.();
  };

  return (
    <DrawerForm
      title={editing ? '编辑支出' : '新增支出'}
      open={open}
      onOpenChange={(v) => !v && onClose?.()}
      width="50%"
      drawerProps={{ destroyOnClose: true }}
      initialValues={initialValues}
      onFinish={onFinish}
      submitter={{
        searchConfig: { submitText: '保存', resetText: '取消' },
        resetButtonProps: { onClick: () => onClose?.() },
      }}
    >
      <div className="form-section-title">基础信息</div>
      <ProFormDatePicker
        name="date"
        label="支出日期"
        rules={[{ required: true, message: '请选择支出日期' }]}
        fieldProps={{ style: { width: '100%' }, format: 'YYYY-MM-DD' }}
      />

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">归属与金额</div>
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
      <ProFormText
        name="title"
        label="支出标题"
        placeholder="如：运费、包装、材料…"
        rules={[{ required: true, message: '请输入支出标题' }]}
        extra={
          titleHistory.length > 0 ? (
            <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                历史：
              </Typography.Text>
              {titleHistory.map((t) => (
                <Tag
                  key={t}
                  className="history-chip"
                  color="geekblue"
                  onClick={() => formRef.current?.setFieldValue('title', t)}
                >
                  {t}
                </Tag>
              ))}
            </Space>
          ) : null
        }
      />
      <ProFormDigit
        name="amount"
        label="支出金额"
        rules={[{ required: true, message: '请输入支出金额' }]}
        fieldProps={{ min: 0, precision: 2, style: { width: '100%' }, prefix: '¥' }}
      />
      <ProFormText name="source" label="支出源头" placeholder="支付对象 / 供货商" />

      <Divider style={{ margin: '20px 0 12px' }} />
      <div className="form-section-title">其他</div>
      <ProFormTextArea name="remark" label="备注" placeholder="选填" />
    </DrawerForm>
  );
}
