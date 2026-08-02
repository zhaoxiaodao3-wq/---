import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ThunderboltOutlined, FileTextOutlined } from '@ant-design/icons';
import { login } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = (values) => {
    setLoading(true);
    const res = login(values.username, values.password);
    setLoading(false);
    if (res.ok) {
      message.success('登录成功');
      navigate('/', { replace: true });
    } else {
      message.error(res.message);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        background: '#f5f7fa',
        overflow: 'hidden',
      }}
    >
      {/* 左侧品牌 Banner */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1d39c4 0%, #3056d3 50%, #597ef7 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* 装饰几何 */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '20%',
            width: 60,
            height: 60,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'rotate(45deg)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, color: '#fff', padding: '0 40px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 24,
            }}
          >
            <FileTextOutlined />
          </div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            销售收支记账后台
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, marginTop: 12, lineHeight: 1.6 }}>
            专为个人经营者打造的轻量级记账工具<br />
            自动核算利润与欠款，让经营数据一目了然
          </p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.95 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ThunderboltOutlined />
              </div>
              <span style={{ fontSize: 14 }}>订单、支出、应付款 一站式管理</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.95 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SafetyOutlined />
              </div>
              <span style={{ fontSize: 14 }}>数据本地存储，支持备份与恢复</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div
        style={{
          width: 460,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Card
          style={{
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
            border: 'none',
            borderRadius: 12,
          }}
          styles={{ body: { padding: 40 } }}
        >
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            欢迎回来
          </Typography.Title>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
            请使用您的账号登录
          </Typography.Text>
          <Form
            layout="vertical"
            initialValues={{ username: 'admin', password: 'admin' }}
            onFinish={onFinish}
            requiredMark={(label, info) => (
              <span>
                {label}
                {info.required && <span style={{ color: '#f5222d', marginLeft: 4 }}>*</span>}
              </span>
            )}
          >
            <Form.Item
              name="username"
              label="账号"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入账号" size="large" allowClear />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{
                  height: 44,
                  fontSize: 15,
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #1d39c4 0%, #3056d3 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(29, 57, 196, 0.3)',
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <div
            style={{
              marginTop: 24,
              padding: 12,
              background: '#f5f7fa',
              borderRadius: 6,
              fontSize: 12,
              color: '#8c8c8c',
              textAlign: 'center',
            }}
          >
            默认账号 / 密码：<strong style={{ color: '#1f1f1f' }}>admin</strong> / <strong style={{ color: '#1f1f1f' }}>admin</strong>
          </div>
        </Card>
      </div>
    </div>
  );
}