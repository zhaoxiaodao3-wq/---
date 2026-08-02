import React from 'react';
import { Empty, Button, Space, Typography } from 'antd';
import { PlusOutlined, FileSearchOutlined } from '@ant-design/icons';

// 统一的空状态组件：插画 + 文案 + 主操作按钮
export default function EmptyState({
  variant = 'no-data', // no-data | no-search | custom
  title,
  description,
  actionText,
  onAction,
  icon,
  style,
}) {
  const config = {
    'no-data': {
      title: title || '暂无数据',
      description: description || '当前还没有记录，点击下方按钮开始录入吧',
      icon: <FileSearchOutlined />,
      actionText: actionText || '新建一条',
    },
    'no-search': {
      title: title || '未找到匹配结果',
      description: description || '试试调整筛选条件或清空搜索',
      icon: <FileSearchOutlined />,
      actionText: null,
    },
  }[variant] || {};

  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e6f0ff 0%, #f0f5ff 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          color: '#1d39c4',
          marginBottom: 16,
        }}
      >
        {icon || config.icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1f1f1f', marginBottom: 6 }}>
        {config.title}
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        {config.description}
      </Typography.Text>
      {config.actionText && (
        <div style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
            {config.actionText}
          </Button>
        </div>
      )}
      {!config.actionText && onAction && (
        <div style={{ marginTop: 16 }}>
          <Button onClick={onAction}>{actionText || '重置'}</Button>
        </div>
      )}
    </div>
  );
}