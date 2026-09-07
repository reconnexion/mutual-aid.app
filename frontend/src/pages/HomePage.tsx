import { useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { useGetIdentity } from '@refinedev/core';
import { useNavigate } from 'react-router';

import { APP_DESCRIPTION, APP_NAME } from '../config/env';
import type { Identity } from '../types';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const { data: identity, isLoading } = useGetIdentity<Identity>();

  useEffect(() => {
    if (!isLoading && identity?.id) navigate('/annonces');
  }, [identity, isLoading, navigate]);

  if (isLoading) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
        background: 'radial-gradient(circle at 50% 14em, #4096ff 0%, #1677ff 100%)',
        color: '#fff'
      }}
    >
      <div style={{ fontSize: 72 }}>🤝</div>
      <Title style={{ color: '#fff', margin: '8px 0' }}>{APP_NAME}</Title>
      <Paragraph style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 320, fontStyle: 'italic' }}>{APP_DESCRIPTION}</Paragraph>
      <Space style={{ marginTop: 16 }}>
        <Button size="large" type="primary" ghost onClick={() => navigate('/login')} style={{ borderColor: '#fff', color: '#fff' }}>
          Se connecter
        </Button>
      </Space>
    </div>
  );
};

export default HomePage;
