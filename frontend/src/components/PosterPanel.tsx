import { Avatar, Button, Typography } from 'antd';
import { MessageOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useActorProfile from '../hooks/useActorProfile';
import useProfileUrl from '../hooks/useProfileUrl';
import { HEADER_HEIGHT } from '../config/layout';
import { literalValue } from '../utils/ontology';

const { Title, Text } = Typography;

type Props = {
  webId: string;
};

/** Right-hand panel showing who posted the ad being viewed — avatar, name, a short bio, when
 *  they joined, and a way to reach them. Loosely modelled on La Carte des Savoirs' MemberPanel. */
const PosterPanel = ({ webId }: Props) => {
  const { data: profile, actorCreated, isLoading } = useActorProfile(webId);
  const profileUrl = useProfileUrl();
  const joinDate = literalValue(actorCreated);

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
        <Title level={5} style={{ margin: 0 }}>
          À propos de l'annonceur
        </Title>
      </div>

      {!isLoading && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <div style={{ background: '#e6f4ff', padding: '40px 24px 24px', textAlign: 'center' }}>
            <Avatar
              size={100}
              src={profile?.['vcard:photo']}
              icon={<UserOutlined />}
              style={{ border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
              {profile?.['vcard:given-name'] || 'Voisin·e'}
            </Title>
            {profile?.['vcard:note'] && (
              <Text italic type="secondary">
                {profile['vcard:note']}
              </Text>
            )}
            {joinDate && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Membre depuis le {dayjs(joinDate).format('D MMMM YYYY')}
                </Text>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <a href={profileUrl(webId)} target="_blank" rel="noopener noreferrer">
                <Button type="primary" icon={<MessageOutlined />}>
                  Contacter
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosterPanel;
