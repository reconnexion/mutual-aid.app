import { useEffect, useMemo, useRef, useState } from 'react';
import { AutoComplete, Input } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

import { parseAddressFeature, searchAddress, type MapboxFeature } from '../config/mapbox';
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
  const throttleRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!keyword || keyword === value?.name) return;
    clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => {
      searchAddress(keyword, APP_LANG).then(setFeatures);
    }, 200);
    return () => clearTimeout(throttleRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const options = useMemo(() => features.map(feature => ({ value: feature.place_name, feature })), [features]);

  return (
    <AutoComplete
      value={keyword}
      options={options}
      onSearch={setKeyword}
      onSelect={(selected: string, option: any) => {
        setKeyword(selected);
        setFeatures([]);
        onChange?.(parseAddressFeature(option.feature));
      }}
      style={{ width: '100%' }}
    >
      <Input prefix={<EnvironmentOutlined />} placeholder="Rechercher une localité" />
    </AutoComplete>
  );
};

export default AddressAutocomplete;
