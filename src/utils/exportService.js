// Excel 导出与全量数据备份

import * as XLSX from 'xlsx';
import { db } from '../services/db';
import { getOptions } from '../services/optionService';
import { getOrders } from '../services/orderService';
import { getExpenses } from '../services/expenseService';
import { getPayables } from '../services/payableService';

// columns: [{ title, dataIndex }]
// dataSource: 行对象数组（值已格式化为展示字符串）
export function exportExcel({ filename, columns, dataSource }) {
  const header = columns.map((c) => c.title);
  const rows = dataSource.map((row) => columns.map((c) => row[c.dataIndex]));
  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // 自动列宽
  const colWidths = header.map((h, i) => ({
    wch: Math.max(10, h.length * 2, ...rows.map((r) => String(r[i] ?? '').length * 2)),
  }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// 一键导出全量数据为 JSON 备份（防丢）
export function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    options: getOptions(),
    orders: getOrders(),
    expenses: getExpenses(),
    payables: getPayables(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `销售记账备份_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 当前数据库所有 key（供调试/清空）
export function allKeys() {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(db.PREFIX))
    .map((k) => k.slice(db.PREFIX.length));
}

// 从 JSON 备份文件恢复数据（覆盖现有）
export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.version || !Array.isArray(data.orders)) {
          throw new Error('备份文件格式不正确');
        }
        if (data.options) db.write('options', data.options);
        db.write('orders', data.orders || []);
        db.write('expenses', data.expenses || []);
        db.write('payables', data.payables || []);
        resolve({ ok: true, orders: data.orders.length, expenses: data.expenses?.length || 0, payables: data.payables?.length || 0 });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
