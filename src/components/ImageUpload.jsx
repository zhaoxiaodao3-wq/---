import React, { useState, useEffect } from 'react';
import { Upload, Button, Image, Space, message, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { saveImage, getImageURL, deleteImage } from '../services/imageService';

// 单张图片上传组件，使用 IndexedDB 存储
// value: 图片 key，onChange: (key|null) => void
export default function ImageUpload({ value, onChange }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let revoke = null;
    let active = true;
    if (value) {
      setLoading(true);
      getImageURL(value).then((u) => {
        if (active) {
          setUrl(u);
          revoke = u;
        }
        setLoading(false);
      });
    } else {
      setUrl(null);
    }
    return () => {
      active = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [value]);

  const handleUpload = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB');
      return Upload.LIST_IGNORE;
    }
    setLoading(true);
    try {
      // 删除旧图
      if (value) await deleteImage(value);
      const key = await saveImage(file);
      onChange?.(key);
      message.success('图片已上传');
    } catch (e) {
      message.error('图片上传失败');
    } finally {
      setLoading(false);
    }
    return false; // 阻止 antd 自动上传
  };

  const handleDelete = async () => {
    if (value) {
      try { await deleteImage(value); } catch (e) { /* ignore */ }
    }
    onChange?.(null);
    setUrl(null);
  };

  return (
    <div>
      {loading ? (
        <Spin />
      ) : url ? (
        <Space direction="vertical" size={8}>
          <Image src={url} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 4 }} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>
            删除图片
          </Button>
        </Space>
      ) : (
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleUpload}
        >
          <Button icon={<UploadOutlined />}>上传货品图片</Button>
        </Upload>
      )}
    </div>
  );
}
