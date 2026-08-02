// 自定义选项与历史复用管理（持久化到本地）

import { db } from './db';
import { PAY_METHODS, CHANNELS } from '../constants/options';

const KEY = 'options';

const DEFAULTS = {
  payMethods: [...PAY_METHODS],
  channels: [...CHANNELS],
  orderTitleHistory: [], // 最近 10 条订单标题
  expenseTitleHistory: [], // 历史支出标题
};

export function getOptions() {
  return { ...DEFAULTS, ...db.read(KEY, {}) };
}

function save(options) {
  db.write(KEY, options);
}

// 向某列表追加自定义项（去重）
export function addCustomOption(field, value) {
  const options = getOptions();
  const list = options[field] || [];
  if (value && !list.includes(value)) {
    options[field] = [...list, value];
    save(options);
  }
  return getOptions();
}

// 记录订单标题历史（保留最近 10 条，去重，新值在前）
export function pushOrderTitleHistory(title) {
  if (!title) return;
  const options = getOptions();
  const next = [title, ...options.orderTitleHistory.filter((t) => t !== title)].slice(0, 10);
  options.orderTitleHistory = next;
  save(options);
}

// 记录支出标题历史（保留最近 20 条）
export function pushExpenseTitleHistory(title) {
  if (!title) return;
  const options = getOptions();
  const next = [title, ...options.expenseTitleHistory.filter((t) => t !== title)].slice(0, 20);
  options.expenseTitleHistory = next;
  save(options);
}
