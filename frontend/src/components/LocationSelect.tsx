import { useState } from 'react';
import { useList } from '@refinedev/core';
import { Button, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import AddLocationModal from './AddLocationModal';
import useIsMobile from '../hooks/useIsMobile';
import type { LocationRecord } from '../types';

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

/** Picks from the user's saved addresses (`vcard:Location`), with an inline "Ajouter une adresse"
 *  action to create a new one. `Form.Item`-compatible. Stacks vertically on mobile — the "Ajouter
 *  une adresse" button's label doesn't shrink, so side by side it overflows a narrow screen. */
const LocationSelect = ({ value, onChange }: Props) => {
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const { result, query } = useList<LocationRecord>({ resource: 'location', pagination: { mode: 'off' } });

  const select = (
    <Select
      value={value}
      onChange={onChange}
      loading={query.isLoading}
      placeholder="Choisir une adresse enregistrée"
      style={{ flex: 1, width: isMobile ? '100%' : undefined }}
      options={result.data.map(location => ({
        value: location.id,
        label: location['vcard:given-name'] + (location['vcard:TYPE'] === 'home' ? ' (domicile)' : '')
      }))}
    />
  );

  const addButton = (
    <Button icon={<PlusOutlined />} block={isMobile} onClick={() => setModalOpen(true)}>
      Ajouter une adresse
    </Button>
  );

  return (
    <>
      {isMobile ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          {select}
          {addButton}
        </Space>
      ) : (
        <Space.Compact style={{ width: '100%' }}>
          {select}
          {addButton}
        </Space.Compact>
      )}
      <AddLocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={locationId => {
          setModalOpen(false);
          onChange?.(locationId);
        }}
      />
    </>
  );
};

export default LocationSelect;
