// 金额格式化与通用工具

// 保留两位小数，千分位
export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// 货币前缀格式化（¥1,234.00）
export function yuan(value) {
  return `¥${formatMoney(value)}`;
}

// 四舍五入到 2 位小数，避免浮点误差
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// 安全数字
export function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// 今天的 YYYY-MM-DD
export function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// 当前 YYYY-MM
export function currentMonthStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}
