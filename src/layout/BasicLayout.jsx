import React, { useRef } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ShoppingCartOutlined,
  WalletOutlined,
  AccountBookOutlined,
  BarChartOutlined,
  DownloadOutlined,
  UploadOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Tooltip } from 'antd';
import { logout } from '../services/authService';
import { exportBackup, importBackup } from '../utils/exportService';

const menuRoute = {
  path: '/',
  routes: [
    { path: '/orders', name: '销售订单', icon: <ShoppingCartOutlined /> },
    { path: '/expenses', name: '支出管理', icon: <WalletOutlined /> },
    { path: '/payables', name: '应付款管理', icon: <AccountBookOutlined /> },
    { path: '/statistics', name: '统计中心', icon: <BarChartOutlined /> },
  ],
};

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Modal.confirm({
      title: '恢复数据',
      content: '导入将覆盖当前所有数据，且不可撤销。建议先备份当前数据。确认继续？',
      okText: '确认覆盖恢复',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await importBackup(file);
          message.success(`恢复成功：${res.orders} 条订单、${res.expenses} 条支出、${res.payables} 条应付款`);
          setTimeout(() => window.location.reload(), 800);
        } catch (err) {
          message.error('恢复失败：' + err.message);
        }
      },
    });
    e.target.value = '';
  };

  const onAvatarMenu = ({ key }) => {
    if (key === 'logout') {
      Modal.confirm({
        title: '确认退出登录？',
        onOk: () => {
          logout();
          navigate('/login', { replace: true });
        },
      });
    } else if (key === 'backup') {
      exportBackup().then(() => message.success('已导出全量数据备份（JSON）')).catch((e) => message.error('导出失败：' + e.message));
    } else if (key === 'restore') {
      fileRef.current?.click();
    }
  };

  return (
    <ProLayout
      title="销售记账"
      logo={
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #3056d3 0%, #597ef7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          ¥
        </div>
      }
      layout="mix"
      fixSiderbar
      fixedHeader
      route={menuRoute}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => (
        <a
          onClick={() => {
            if (item.path) navigate(item.path);
          }}
        >
          {dom}
        </a>
      )}
      avatarProps={{
        render: () => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px 4px 4px',
              borderRadius: 20,
              background: '#f0f5ff',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d39c4 0%, #597ef7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <UserOutlined style={{ fontSize: 14 }} />
            </div>
            <span style={{ fontSize: 13, color: '#1f1f1f', fontWeight: 500 }}>admin</span>
          </div>
        ),
        menu: {
          items: [
            { key: 'backup', icon: <DownloadOutlined />, label: '备份数据' },
            { key: 'restore', icon: <UploadOutlined />, label: '恢复数据' },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
          ],
          onClick: onAvatarMenu,
        },
      }}
      actionsRender={() => [
        <Tooltip title="导出全量数据备份" key="backup">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => {
              exportBackup().then(() => message.success('已导出全量数据备份（JSON）')).catch((e) => message.error('导出失败：' + e.message));
            }}
            style={{ color: '#1f1f1f' }}
          >
            备份
          </Button>
        </Tooltip>,
        <Tooltip title="从 JSON 备份文件恢复数据" key="restore">
          <Button
            type="text"
            icon={<UploadOutlined />}
            onClick={() => fileRef.current?.click()}
            style={{ color: '#1f1f1f' }}
          >
            恢复
          </Button>
        </Tooltip>,
      ]}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <div className="page-container">
        <Outlet />
      </div>
    </ProLayout>
  );
}