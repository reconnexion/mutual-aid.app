import { useState } from 'react';
import { useList } from '@refinedev/core';
import { Button, Select, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import AddLocationModal from './AddLocationModal';
import type { LocationRecord } from '../types';

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

/** Picks from the user's saved addresses (`vcard:Location`), with an inline "Ajouter une adresse"
 *  action to create a new one. `Form.Item`-compatible. */
const LocationSelect = ({ value, onChange }: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { result, query } = useList<LocationRecord>({ resource: 'location', pagination: { mode: 'off' } });

  return (
    <>
      <Space.Compact style={{ width: '100%' }}>
        <Select
          value={value}
          onChange={onChange}
          loading={query.isLoading}
          placeholder="Choisir une adresse enregistrée"
          style={{ flex: 1 }}
          options={result.data.map(location => ({
            value: location.id,
            label: location['vcard:given-name'] + (location['vcard:TYPE'] === 'home' ? ' (domicile)' : '')
          }))}
        />
        <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Ajouter une adresse
        </Button>
      </Space.Compact>
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
