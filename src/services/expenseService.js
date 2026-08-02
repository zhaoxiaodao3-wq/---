// 支出数据服务（localStorage）
// 注意：本系统的「支出」即已支付支出，参与利润计算。

import { db, uid } from './db';
import { todayStr } from '../utils/format';

const KEY = 'expenses';

export function getExpenses() {
  return db.read(KEY, []);
}

function save(list) {
  db.write(KEY, list);
}

export function getExpense(id) {
  return getExpenses().find((e) => e.id === id) || null;
}

export function upsertExpense(expense) {
  const list = getExpenses();
  const now = Date.now();
  if (expense.id) {
    const idx = list.findIndex((e) => e.id === expense.id);
    const updated = { ...list[idx], ...expense, updatedAt: now };
    list[idx] = updated;
    save(list);
    return updated;
  }
  const created = {
    id: uid('exp'),
    createdAt: now,
    updatedAt: now,
    date: expense.date || todayStr(),
    ...expense,
  };
  list.unshift(created);
  save(list);
  return created;
}

export function deleteExpense(id) {
  const list = getExpenses().filter((e) => e.id !== id);
  save(list);
}

// 级联删除：删除某订单关联的所有支出，返回删除条数
export function deleteExpensesByOrder(orderId) {
  const list = getExpenses();
  const next = list.filter((e) => !(e.belongType === '订单支出' && e.orderId === orderId));
  save(next);
  return list.length - next.length;
}
