// 应付款数据服务（localStorage）
// 应付款 = 赊账未支付，仅做负债统计，不参与当期利润。
// 结清流水永久保留，不可删除。

import { db, uid } from './db';
import { todayStr } from '../utils/format';
import { round2 } from '../utils/format';
import { PAYABLE_STATUS } from '../constants/options';

const KEY = 'payables';

export function getPayables() {
  return db.read(KEY, []);
}

function save(list) {
  db.write(KEY, list);
}

export function getPayable(id) {
  return getPayables().find((p) => p.id === id) || null;
}

export function upsertPayable(payable) {
  const list = getPayables();
  const now = Date.now();
  if (payable.id) {
    const idx = list.findIndex((p) => p.id === payable.id);
    const updated = { ...list[idx], ...payable, updatedAt: now };
    list[idx] = updated;
    save(list);
    return updated;
  }
  const created = {
    id: uid('pay'),
    createdAt: now,
    updatedAt: now,
    date: payable.date || todayStr(),
    paidAmount: 0,
    settlements: [],
    subItems: payable.subItems || [],
    ...payable,
  };
  list.unshift(created);
  save(list);
  return created;
}

export function deletePayable(id) {
  const list = getPayables().filter((p) => p.id !== id);
  save(list);
}

// 级联删除：删除某订单关联的所有应付款
export function deletePayablesByOrder(orderId) {
  const list = getPayables();
  const next = list.filter((p) => !(p.belongType === '订单支出' && p.orderId === orderId));
  save(next);
  return list.length - next.length;
}

// 新增一条结清流水，自动更新已结清金额与状态
export function addSettlement(payableId, settle) {
  const list = getPayables();
  const idx = list.findIndex((p) => p.id === payableId);
  if (idx < 0) return null;
  const p = list[idx];
  const amount = round2(Math.min(Math.max(0, Number(settle.amount) || 0), p.totalAmount - p.paidAmount));
  const record = {
    id: uid('set'),
    time: settle.time || new Date().toISOString(),
    amount,
    mode: settle.mode,
    items: settle.items || [],
    remark: settle.remark || '',
  };
  const updated = {
    ...p,
    paidAmount: round2(p.paidAmount + amount),
    settlements: [...(p.settlements || []), record],
    updatedAt: Date.now(),
  };
  list[idx] = updated;
  save(list);
  return updated;
}

export function payableStatusOf(p) {
  const paid = Number(p.paidAmount) || 0;
  const total = Number(p.totalAmount) || 0;
  if (paid <= 0) return PAYABLE_STATUS.UNPAID;
  if (paid >= total) return PAYABLE_STATUS.PAID;
  return PAYABLE_STATUS.PARTIAL;
}
