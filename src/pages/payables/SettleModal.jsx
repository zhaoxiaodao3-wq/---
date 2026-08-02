import React, { useEffect, useState } from 'react';
import { Modal, Form, Radio, InputNumber, Checkbox, Input, Alert, Typography, message, Card, Statistic, Row, Col } from 'antd';
import { addSettlement } from '../../services/payableService';
import { payableRemaining } from '../../utils/calc';
import { num, yuan } from '../../utils/format';
import { SETTLE_MODE_AMOUNT, SETTLE_MODE_ITEM } from '../../constants/options';
import { COLORS } from '../../utils/theme';

export default function SettleModal({ open, payable, onClose, onSuccess }) {
  const [mode, setMode] = useState(SETTLE_MODE_AMOUNT);
  const [amount, setAmount] = useState(0);
  const [checked, setChecked] = useState([]);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (open) {
      setMode(SETTLE_MODE_AMOUNT);
      setAmount(0);
      setChecked([]);
      setRemark('');
    }
  }, [open, payable]);

  if (!payable) return null;
  const remaining = payableRemaining(payable);
  const hasItems = payable.subItems && payable.subItems.length > 0;
  const itemSum = (payable.subItems || [])
    .filter((it) => checked.includes(it.id))
    .reduce((s, it) => s + num(it.amount), 0);
  const settleAmount = mode === SETTLE_MODE_AMOUNT ? num(amount) : round2local(itemSum);

  function round2local(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  const handleOk = async () => {
    if (remaining <= 0) {
      message.warning('该应付款已结清');
      return;
    }
    if (settleAmount <= 0) {
      message.warning('结清金额必须大于 0');
      return;
    }
    if (settleAmount > remaining + 1e-9) {
      message.warning(`结清金额不能超过剩余未结 ${yuan(remaining)}`);
      return;
    }
    await addSettlement(payable.id, {
      amount: settleAmount,
      mode,
      items: mode === SETTLE_MODE_ITEM ? payable.subItems.filter((it) => checked.includes(it.id)).map((it) => it.name) : [],
      remark,
    });
    message.success('结清成功');
    onSuccess?.();
    onClose?.();
  };

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>结清应付款</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400, marginTop: 2 }}>
            {payable.supplier}
          </div>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="确认结清"
      cancelText="取消"
      okButtonProps={{ style: { background: COLORS.primary, borderColor: COLORS.primary } }}
      width="50%"
      styles={{ body: { paddingTop: 16 } }}
    >
      <Card size="small" style={{ marginBottom: 16, background: '#fafbfc' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="应付总额" value={payable.totalAmount} valueStyle={{ fontSize: 14, color: COLORS.textPrimary }} prefix="¥" precision={2} />
          </Col>
          <Col span={8}>
            <Statistic title="已结清" value={payable.paidAmount} valueStyle={{ fontSize: 14, color: COLORS.success }} prefix="¥" precision={2} />
          </Col>
          <Col span={8}>
            <Statistic title="剩余未结" value={remaining} valueStyle={{ fontSize: 14, color: COLORS.warning, fontWeight: 600 }} prefix="¥" precision={2} />
          </Col>
        </Row>
      </Card>
      <Form layout="vertical">
        <Form.Item label="结清方式">
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
            <Radio value={SETTLE_MODE_AMOUNT}>按金额结清</Radio>
            <Radio value={SETTLE_MODE_ITEM} disabled={!hasItems}>
              按事项结清
            </Radio>
          </Radio.Group>
        </Form.Item>

        {mode === SETTLE_MODE_AMOUNT ? (
          <Form.Item label="本次结清金额">
            <InputNumber
              min={0}
              max={remaining}
              precision={2}
              prefix="¥"
              style={{ width: '100%' }}
              value={amount}
              onChange={(v) => setAmount(v || 0)}
            />
          </Form.Item>
        ) : (
          <Form.Item label="勾选已结清的子事项">
            <Checkbox.Group
              value={checked}
              onChange={setChecked}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {(payable.subItems || []).map((it) => (
                <Checkbox key={it.id} value={it.id}>
                  {it.name}（{yuan(it.amount)}）
                </Checkbox>
              ))}
            </Checkbox.Group>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              已勾选合计：{yuan(itemSum)}
            </Typography.Text>
          </Form.Item>
        )}

        <Form.Item label="结清备注">
          <Input.TextArea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} placeholder="选填" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
