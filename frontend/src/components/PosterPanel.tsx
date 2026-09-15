import { Avatar, Button, Space, Typography } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useActorProfile from '../hooks/useActorProfile';
import useOwnActor from '../hooks/useOwnActor';
import useProfileUrl from '../hooks/useProfileUrl';
import { formatUsername } from '../utils/formatUsername';
import { HEADER_HEIGHT } from '../config/layout';
import { portejunesPayUrl } from '../config/portejunes';
import { hasTipjarValue, literalValue } from '../utils/ontology';
import { authProvider } from '../providers';
import G1Icon from './G1Icon';

const { Title, Text } = Typography;

type Props = {
  webId: string;
  /** Skips the fixed-width wrapper and its own header — used when shown inside a `Drawer` on
   *  mobile, which already provides both. */
  embedded?: boolean;
};

/** Right-hand panel showing who posted the ad being viewed — avatar, name, handle, a short bio,
 *  when they joined, and a way to reach them. Loosely modelled on La Carte des Savoirs' MemberPanel. */
const PosterPanel = ({ webId, embedded = false }: Props) => {
  const { data: profile, actorCreated, hasWallet, isLoading } = useActorProfile(webId);
  const profileUrl = useProfileUrl();
  const joinDate = literalValue(actorCreated);

  // Same gating as La Carte des Savoirs' MemberPanel: both sides need a wallet. The recipient
  // obviously needs one to be paid at all, and there's no point sending the connected user to
  // PorteJunes if they don't have one themselves either -- that would just be a dead end there.
  const isSelf = webId === authProvider.getSession()?.webId;
  const { data: ownActor } = useOwnActor();
  const ownHasWallet = hasTipjarValue(ownActor?.['foaf:tipjar']);
  const payUrl = !isSelf && hasWallet && ownHasWallet ? portejunesPayUrl(webId) : undefined;

  const content = !isLoading && (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <div style={{ minHeight: '100%', boxSizing: 'border-box', background: '#e6f4ff', padding: '40px 24px 24px', textAlign: 'center' }}>
        <Avatar
          size={140}
          src={profile?.['vcard:photo']}
          icon={<UserOutlined />}
          style={{ border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
        <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
          {profile?.['vcard:given-name'] || 'Voisin·e'}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatUsername(webId)}
        </Text>
        {profile?.['vcard:note'] && (
          <div style={{ marginTop: 4 }}>
            <Text italic type="secondary">
              {profile['vcard:note']}
            </Text>
          </div>
        )}
        {joinDate && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Membre depuis le {dayjs(joinDate).format('D MMMM YYYY')}
            </Text>
          </div>
        )}
        <Space direction="vertical" align="center" style={{ marginTop: 16 }}>
          <a href={profileUrl(webId)} target="_blank" rel="noopener noreferrer">
            <Button type="primary" icon={<MessageOutlined />}>
              Contacter
            </Button>
          </a>
          {payUrl && (
            <Button icon={<G1Icon />} href={payUrl} target="_blank" rel="noopener noreferrer">
              Envoyer des Ğ1
            </Button>
          )}
        </Space>
      </div>
    </div>
  );

  if (embedded) return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{content}</div>;

  return (
    <div style={{ width: 320, flex: '0 0 320px', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f0f0', background: '#fff' }}>
      <div
        style={{
          flex: `0 0 ${HEADER_HEIGHT}px`,
          height: HEADER_HEIGHT,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Title level={5} className="app-brand" style={{ margin: 0, fontSize: 17 }}>
          À propos de l'annonceur
        </Title>
      </div>

      {content}
    </div>
  );
};

export default PosterPanel;
