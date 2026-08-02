// Excel 导出（纯前端）与全量数据备份（后端 API）
import * as XLSX from 'xlsx';
import api from '../services/apiClient';

// columns: [{ title, dataIndex }]
// dataSource: 行对象数组（值已格式化为展示字符串）
export function exportExcel({ filename, columns, dataSource }) {
  const header = columns.map((c) => c.title);
  const rows = dataSource.map((row) => columns.map((c) => row[c.dataIndex]));
  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colWidths = header.map((h, i) => ({
    wch: Math.max(10, h.length * 2, ...rows.map((r) => String(r[i] ?? '').length * 2)),
  }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// 从后端导出全量 JSON 备份
export async function exportBackup() {
  const BASE = import.meta.env.VITE_API_BASE || '/api';
  const res = await fetch(`${BASE}/backup/export`, {
    headers: { Authorization: `Bearer ${api.getToken()}` },
  });
  if (!res.ok) throw new Error('备份导出失败');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售记账备份_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 从 JSON 备份文件恢复（后端批量导入）
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.version || !Array.isArray(data.orders)) {
          throw new Error('备份文件格式不正确');
        }
        const res = await api.post('/backup/import', data);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
