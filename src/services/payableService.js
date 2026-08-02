// 应付款数据服务（后端 API）
import api from './apiClient';
import { PAYABLE_STATUS } from '../constants/options';

export async function getPayables(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return api.get(`/payables${qs.toString() ? '?' + qs.toString() : ''}`);
}

export async function getPayable(id) {
  return api.get(`/payables/${id}`);
}

export async function upsertPayable(payable) {
  if (payable.id) return api.put(`/payables/${payable.id}`, payable);
  return api.post('/payables', payable);
}

export async function deletePayable(id) {
  return api.del(`/payables/${id}`);
}

// 新增结清流水
export async function addSettlement(payableId, settle) {
  return api.post(`/payables/${payableId}/settle`, settle);
}

// 纯函数：应付款状态判定（不需要后端，本地计算即可）
export function payableStatusOf(p) {
  const paid = Number(p.paidAmount) || 0;
  const total = Number(p.totalAmount) || 0;
  if (paid <= 0) return PAYABLE_STATUS.UNPAID;
  if (paid >= total) return PAYABLE_STATUS.PAID;
  return PAYABLE_STATUS.PARTIAL;
}
