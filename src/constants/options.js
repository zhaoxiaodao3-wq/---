// 预设选项与业务常量

import dayjs from 'dayjs';

export const ORDER_TYPES = ['个人订单', '老板订单'];

export const PAY_METHODS = ['现金', '微信', '支付宝', '银行卡转账'];

// 日期范围快捷选项（用于 RangePicker presets）
export const DATE_RANGE_PRESETS = [
  { label: '今天', value: [dayjs(), dayjs()] },
  { label: '昨天', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { label: '本周', value: [dayjs().startOf('week'), dayjs().endOf('week')] },
  { label: '上周', value: [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')] },
  { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  { label: '本季度', value: [dayjs().startOf('quarter'), dayjs().endOf('quarter')] },
  { label: '今年', value: [dayjs().startOf('year'), dayjs().endOf('year')] },
];

export const CHANNELS = ['微信', '抖音', '电话', '线下'];

export const BELONG_TYPES = ['订单支出', '月度支出'];

// 结清方式
export const SETTLE_MODE_AMOUNT = '金额';
export const SETTLE_MODE_ITEM = '事项';

// 应付款结清状态
export const PAYABLE_STATUS = {
  UNPAID: '未结清',
  PARTIAL: '部分结清',
  PAID: '全部结清',
};

// status 使用深色系实色，antd 自动配白字，三种状态对比清晰、易读
export const PAYABLE_STATUS_ENUM = {
  [PAYABLE_STATUS.UNPAID]: { text: '未结清', status: '#cf1322' },
  [PAYABLE_STATUS.PARTIAL]: { text: '部分结清', status: '#d46b08' },
  [PAYABLE_STATUS.PAID]: { text: '全部结清', status: '#389e0d' },
};

// 订单类型枚举（ProTable valueEnum 用）
export const ORDER_TYPE_ENUM = {
  个人订单: { text: '个人订单' },
  老板订单: { text: '老板订单' },
};

// 归属类型枚举
export const BELONG_TYPE_ENUM = {
  订单支出: { text: '订单支出' },
  月度支出: { text: '月度支出' },
};
