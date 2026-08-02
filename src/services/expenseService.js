// 支出数据服务（后端 API）
import api from './apiClient';

export async function getExpenses(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return api.get(`/expenses${qs.toString() ? '?' + qs.toString() : ''}`);
}

export async function getExpense(id) {
  return api.get(`/expenses/${id}`);
}

export async function upsertExpense(expense) {
  if (expense.id) return api.put(`/expenses/${expense.id}`, expense);
  return api.post('/expenses', expense);
}

export async function deleteExpense(id) {
  return api.del(`/expenses/${id}`);
}
