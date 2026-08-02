// 销售订单数据服务（后端 API）
import api from './apiClient';

export async function getOrders(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return api.get(`/orders${qs.toString() ? '?' + qs.toString() : ''}`);
}

export async function getOrder(id) {
  return api.get(`/orders/${id}`);
}

export async function upsertOrder(order) {
  if (order.id) return api.put(`/orders/${order.id}`, order);
  return api.post('/orders', order);
}

// 级联删除由后端处理
export async function deleteOrder(id) {
  return api.del(`/orders/${id}`);
}

export async function orderOptions() {
  const list = await getOrders();
  return list.map((o) => ({
    id: o.id,
    label: `${o.date} ${o.title}${o.customerName ? `（${o.customerName}）` : ''}`,
  }));
}
