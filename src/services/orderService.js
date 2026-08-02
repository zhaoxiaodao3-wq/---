// 销售订单数据服务（localStorage）

import { db, uid } from './db';
import { deleteExpensesByOrder, getExpenses } from './expenseService';
import { deletePayablesByOrder } from './payableService';
import { deleteImage } from './imageService';
import { todayStr } from '../utils/format';

const KEY = 'orders';

export function getOrders() {
  return db.read(KEY, []);
}

function save(list) {
  db.write(KEY, list);
}

export function getOrder(id) {
  return getOrders().find((o) => o.id === id) || null;
}

// 新建或更新订单；返回保存后的完整对象
export function upsertOrder(order) {
  const list = getOrders();
  const now = Date.now();
  if (order.id) {
    const idx = list.findIndex((o) => o.id === order.id);
    const updated = { ...list[idx], ...order, updatedAt: now };
    list[idx] = updated;
    save(list);
    return updated;
  }
  const created = {
    id: uid('ord'),
    createdAt: now,
    updatedAt: now,
    date: order.date || todayStr(),
    isManualTotal: false,
    ...order,
  };
  list.unshift(created);
  save(list);
  return created;
}

// 删除订单，并级联删除其关联的支出、应付款与图片
export async function deleteOrder(id) {
  const list = getOrders();
  const order = list.find((o) => o.id === id);
  const next = list.filter((o) => o.id !== id);
  save(next);
  const expCount = deleteExpensesByOrder(id);
  const payCount = deletePayablesByOrder(id);
  // 删除关联图片（不阻塞主流程）
  if (order?.imageKey) {
    try {
      await deleteImage(order.imageKey);
    } catch (e) {
      /* 图片删除失败不影响订单删除 */
    }
  }
  return { order: 1, expenses: expCount, payables: payCount };
}

export function orderOptions() {
  // 供应付款/支出关联选择使用
  return getOrders().map((o) => ({
    id: o.id,
    label: `${o.date} ${o.title}${o.customerName ? `（${o.customerName}）` : ''}`,
  }));
}

// 供计算层使用：避免重复读取
export { getExpenses };
