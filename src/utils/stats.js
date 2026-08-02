// 统计聚合：按天/月/年维度汇总订单与支出数据

import { num, round2 } from './format';
import { orderExpenseAmount } from './calc';

// 时间维度
export const DIM_DAY = 'day';
export const DIM_MONTH = 'month';
export const DIM_YEAR = 'year';

export const DIM_OPTIONS = [
  { label: '按天', value: DIM_DAY },
  { label: '按月', value: DIM_MONTH },
  { label: '按年', value: DIM_YEAR },
];

// 把日期字符串(YYYY-MM-DD) 转为对应维度的 key
export function dateToDimKey(dateStr, dim) {
  if (!dateStr) return '';
  if (dim === DIM_DAY) return dateStr; // YYYY-MM-DD
  if (dim === DIM_MONTH) return dateStr.slice(0, 7); // YYYY-MM
  if (dim === DIM_YEAR) return dateStr.slice(0, 4); // YYYY
  return dateStr;
}

// 维度 key 转展示文字
export function dimKeyLabel(key, dim) {
  if (!key) return '';
  if (dim === DIM_DAY) return key;
  if (dim === DIM_MONTH) return `${key.slice(5)}月`;
  if (dim === DIM_YEAR) return `${key}年`;
  return key;
}

/**
 * 按维度聚合统计数据
 * @param {Array} orders - 已按筛选条件过滤后的订单
 * @param {Array} expenses - 全部支出
 * @param {Array} payables - 全部应付款
 * @param {string} dim - day/month/year
 * @returns {Object} { summary, rows }
 *   summary: { totalQty, totalSales, totalExpense, totalProfit, totalUnpaid }
 *   rows: [{ dimKey, dimLabel, qty, sales, expense, profit }]
 *
 * 规则：
 * - 订单支出：归属于订单日期对应的维度
 * - 月度支出：仅在 month/year 维度计入（按 day 维度不摊入某天）
 * - 利润 = 销售总金额 - 已支付支出（订单支出 + 当期月度支出）
 * - 未结清金额：应付款剩余合计
 */
export function aggregateStats(orders, expenses, payables, dim) {
  const buckets = new Map();

  const ensure = (key) => {
    if (!buckets.has(key)) {
      buckets.set(key, { dimKey: key, qty: 0, sales: 0, orderExpense: 0, monthExpense: 0 });
    }
    return buckets.get(key);
  };

  // 1. 订单 → 销售数量/金额 + 订单支出
  const orderExpenseMap = new Map();
  for (const o of orders) {
    const key = dateToDimKey(o.date, dim);
    const b = ensure(key);
    b.qty += num(o.qty);
    b.sales += num(o.totalAmount);
    const exp = orderExpenseAmount(o.id, expenses);
    b.orderExpense += exp;
    orderExpenseMap.set(o.id, exp);
  }

  // 2. 月度支出：仅 month/year 维度计入
  if (dim === DIM_MONTH || dim === DIM_YEAR) {
    for (const e of expenses) {
      if (e.belongType !== '月度支出') continue;
      const key = dateToDimKey(e.date, dim);
      const b = ensure(key);
      b.monthExpense += num(e.amount);
    }
  }

  // 3. 汇总行
  const rows = [];
  let totalQty = 0,
    totalSales = 0,
    totalExpense = 0;
  for (const [key, b] of buckets) {
    const exp = round2(b.orderExpense + b.monthExpense);
    const profit = round2(b.sales - exp);
    rows.push({
      dimKey: key,
      dimLabel: dimKeyLabel(key, dim),
      qty: round2(b.qty),
      sales: round2(b.sales),
      expense: exp,
      profit,
    });
    totalQty += b.qty;
    totalSales += b.sales;
    totalExpense += exp;
  }

  // 按维度 key 降序（最近的在前）
  rows.sort((a, b) => (a.dimKey < b.dimKey ? 1 : -1));

  // 4. 未结清金额（应付款剩余合计，不受维度影响，取全部筛选后应付款）
  const totalUnpaid = payables.reduce((s, p) => s + (num(p.totalAmount) - num(p.paidAmount)), 0);

  return {
    summary: {
      totalQty: round2(totalQty),
      totalSales: round2(totalSales),
      totalExpense: round2(totalExpense),
      totalProfit: round2(totalSales - totalExpense),
      totalUnpaid: round2(totalUnpaid),
    },
    rows,
  };
}
