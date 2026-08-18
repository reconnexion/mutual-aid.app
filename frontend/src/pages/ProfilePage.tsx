import { useState } from 'react';
import { App, Avatar, Button, Card, Form, Input, Result, Space, Spin, Typography } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { Link, useParams } from 'react-router';

import useActorProfile from '../hooks/useActorProfile';
import useOwnProfile from '../hooks/useOwnProfile';
import useOutbox from '../hooks/useOutbox';
import type { Identity } from '../types';

const { Title } = Typography;

/** A voisin's profile: avatar/name plus a contact form. This is the only way to reach someone
 *  directly in this app (no DMs) — sending a message here also doubles as a contact request
 *  (`Offer{Add{profile}}`), the mechanism that later makes them selectable when sharing an ad. */
const ProfilePage = () => {
  const { webId } = useParams<{ webId: string }>();
  const decodedWebId = webId ? decodeURIComponent(webId) : undefined;
  const { message } = App.useApp();
  const { data: identity } = useGetIdentity<Identity>();
  const { data: profile, isLoading } = useActorProfile(decodedWebId);
  const { data: ownProfile } = useOwnProfile();
  const outbox = useOutbox();
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);

  if (isLoading) return <Spin style={{ margin: 48 }} />;

  const isSelf = decodedWebId === identity?.id;

  const send = async (values: { content: string }) => {
    if (!decodedWebId || !ownProfile?.id) return;
    setSending(true);
    try {
      await outbox.post({
        type: 'Offer',
        actor: outbox.owner,
        object: { type: 'Add', actor: decodedWebId, object: ownProfile.id },
        content: values.content,
        target: decodedWebId,
        to: decodedWebId
      });
      message.success('Message envoyé');
      form.resetFields();
    } catch (e: any) {
      message.error(e.message);
    }
    setSending(false);
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px 16px' }}>
      <Card style={{ maxWidth: 500, margin: '0 auto' }}>
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
          <Avatar size={80} src={profile?.['vcard:photo']} icon={<UserOutlined />} />
          <Title level={4} style={{ margin: 0 }}>
            {profile?.['vcard:given-name'] || 'Ce voisin'}
          </Title>
        </Space>
        {isSelf ? (
          <Result status="info" title="C'est votre profil" subTitle="Retrouvez vos annonces sur la page d'accueil." extra={<Link to="/annonces">Retour aux annonces</Link>} />
        ) : (
          <Form form={form} layout="vertical" onFinish={send}>
            <Form.Item name="content" label="Envoyer un message" rules={[{ required: true, message: 'Écrivez un message' }]}>
              <Input.TextArea rows={4} placeholder="Bonjour, je vous contacte au sujet de…" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending}>
                Envoyer
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
