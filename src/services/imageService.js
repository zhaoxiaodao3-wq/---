// 图片存储服务（后端 API，替代 IndexedDB）
import api from './apiClient';

const BASE = import.meta.env.VITE_API_BASE || '/api';

export async function saveImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const data = await api.upload('/images', formData);
  return data.key;
}

// 直接返回图片 URL（不是 blob URL），前端 <Image> 可直接使用
export function getImageURL(key) {
  if (!key) return null;
  return `${BASE}/images/${key}`;
}

export async function deleteImage(key) {
  if (!key) return;
  await api.del(`/images/${key}`);
}
