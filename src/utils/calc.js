// 利润与欠款计算（纯函数，输入为数据数组，便于测试与复用）

import { round2, num } from './format';
import { PAYABLE_STATUS } from '../constants/options';

// 单笔订单关联的已支付支出合计
export function orderExpenseAmount(orderId, expenses) {
  return round2(
    expenses
      .filter((e) => e.belongType === '订单支出' && e.orderId === orderId)
      .reduce((s, e) => s + num(e.amount), 0)
  );
}

// 单笔订单利润 = 销售总金额 - 该订单已支付总支出
export function orderProfit(order, expenses) {
  return round2(num(order.totalAmount) - orderExpenseAmount(order.id, expenses));
}

// 全局总支出 = 所有已支付支出（订单支出 + 月度支出）
export function globalExpenseAmount(expenses) {
  return round2(expenses.reduce((s, e) => s + num(e.amount), 0));
}

// 全局总利润 = 所有订单销售总金额 - 全局总支出
export function globalProfit(orders, expenses) {
  const sales = orders.reduce((s, o) => s + num(o.totalAmount), 0);
  return round2(sales - globalExpenseAmount(expenses));
}

// 应付款剩余未结金额
export function payableRemaining(p) {
  return round2(num(p.totalAmount) - num(p.paidAmount));
}

// 汇总一组订单列表的顶部指标
export function summarizeOrders(orders, expenses) {
  const totalQty = orders.reduce((s, o) => s + num(o.qty), 0);
  const totalSales = round2(orders.reduce((s, o) => s + num(o.totalAmount), 0));
  const totalExpense = round2(
    orders.reduce((s, o) => s + orderExpenseAmount(o.id, expenses), 0)
  );
  const totalProfit = round2(totalSales - totalExpense);
  return { totalQty, totalSales, totalExpense, totalProfit };
}

// 订单关联的应付款聚合状态（取最严重状态）
export function aggregatePayableStatusForOrder(orderId, payables) {
  const linked = payables.filter(
    (p) => p.belongType === '订单支出' && p.orderId === orderId
  );
  if (linked.length === 0) return null;
  const hasUnpaid = linked.some((p) => num(p.paidAmount) <= 0);
  const hasPartial = linked.some(
    (p) => num(p.paidAmount) > 0 && num(p.paidAmount) < num(p.totalAmount)
  );
  if (hasUnpaid) return PAYABLE_STATUS.UNPAID;
  if (hasPartial) return PAYABLE_STATUS.PARTIAL;
  return PAYABLE_STATUS.PAID;
}
