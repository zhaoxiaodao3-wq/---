// 选项与历史复用管理（后端 API）
import api from './apiClient';

export async function getOptions() {
  return api.get('/options');
}

export async function addCustomOption(field, value) {
  return api.post('/options/custom', { field, value });
}

export async function pushOrderTitleHistory(title) {
  return api.post('/options/order-title-history', { title });
}

export async function pushExpenseTitleHistory(title) {
  return api.post('/options/expense-title-history', { title });
}
