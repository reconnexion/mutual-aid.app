import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AutoComplete, Input } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

import { IS_MAPBOX_CONFIGURED, parseAddressFeature, searchAddress, type MapboxFeature } from '../config/mapbox';
import { APP_LANG } from '../config/env';
import type { PlaceRecord } from '../types';

type Props = {
  value?: PlaceRecord;
  onChange?: (value: PlaceRecord) => void;
};

/** Mapbox-backed address search, resolving a locality to its `as:Place` (name/latitude/longitude).
 *  `Form.Item`-compatible. */
const AddressAutocomplete = ({ value, onChange }: Props) => {
  const [keyword, setKeyword] = useState(value?.name ?? '');
  const [features, setFeatures] = useState<MapboxFeature[]>([]);
  const [failed, setFailed] = useState(false);
  const throttleRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!keyword || keyword === value?.name) return;
    clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => {
      searchAddress(keyword, APP_LANG)
        .then(found => {
          setFeatures(found);
          setFailed(false);
        })
        .catch(e => {
          console.error(e);
          setFeatures([]);
          setFailed(true);
        });
    }, 200);
    return () => clearTimeout(throttleRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const options = useMemo(() => features.map(feature => ({ value: feature.place_name, feature })), [features]);

  // Without an access token no search can ever succeed, so show the cause instead of a dead field
  if (!IS_MAPBOX_CONFIGURED) {
    return (
      <Alert
        type="error"
        showIcon
        message="Recherche d'adresse indisponible"
        description="Aucune clé d'accès Mapbox n'a été configurée pour ce site (VITE_MAPBOX_ACCESS_TOKEN). Contactez l'administrateur."
      />
    );
  }

  return (
    <>
      <AutoComplete
        value={keyword}
        options={options}
        onSearch={setKeyword}
        onSelect={(selected: string, option: any) => {
          setKeyword(selected);
          setFeatures([]);
          onChange?.(parseAddressFeature(option.feature));
        }}
        status={failed ? 'error' : undefined}
        style={{ width: '100%' }}
      >
        <Input prefix={<EnvironmentOutlined />} placeholder="Rechercher une localité" />
      </AutoComplete>
      {failed && (
        <Alert
          type="error"
          showIcon
          message="La recherche d'adresse a échoué. Vérifiez votre connexion et réessayez."
          style={{ marginTop: 8 }}
        />
      )}
    </>
  );
};

export default AddressAutocomplete;
