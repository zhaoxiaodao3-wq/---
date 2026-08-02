import React from 'react';
import { AutoComplete } from 'antd';

// 支持下拉选择 + 自由输入新增的受控组件。
// 用于「收款方式」「联系渠道」等需自定义选项的字段。
// onAdd(newValue) 在输入了列表中不存在的值时触发，供父级持久化。
export default function AddableSelect({
  value,
  onChange,
  options = [],
  onAdd,
  placeholder,
  disabled,
}) {
  const data = options.map((o) => ({ value: o, label: o }));
  return (
    <AutoComplete
      value={value || undefined}
      options={data}
      placeholder={placeholder}
      disabled={disabled}
      style={{ width: '100%' }}
      filterOption={(input, option) =>
        String(option.value).toLowerCase().includes(input.toLowerCase())
      }
      onChange={(v) => {
        if (v && !options.includes(v)) onAdd?.(v);
        onChange?.(v);
      }}
    />
  );
}
