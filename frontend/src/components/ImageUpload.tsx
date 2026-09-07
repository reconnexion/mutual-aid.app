import { useEffect, useState } from 'react';
import { App, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

import useUploadImage from '../hooks/useUploadImage';

const MAX_IMAGES = 10;

type Props = {
  value?: string[];
  onChange?: (value: string[]) => void;
};

const toFileList = (urls: string[]): UploadFile[] =>
  urls.map((url, i) => ({ uid: String(i), name: `image-${i}`, status: 'done', url }));

/** A multi-image upload field (up to 10, `Form.Item`-compatible via `value`/`onChange`), uploading
 *  straight to the user's Pod. Relies on Antd's own `fileList` state (via `onChange`, not the
 *  upload promise) to stay correct when several files upload concurrently. */
const ImageUpload = ({ value = [], onChange }: Props) => {
  const { message } = App.useApp();
  const uploadImage = useUploadImage();
  const [fileList, setFileList] = useState<UploadFile[]>(() => toFileList(value));

  // Re-syncs if `value` changes from the outside (e.g. the composer's edit-mode prefill, which
  // runs in an effect after this component has already mounted with an empty initial value).
  useEffect(() => {
    const currentUrls = fileList.filter(f => f.status === 'done').map(f => f.url);
    if (JSON.stringify(currentUrls) !== JSON.stringify(value)) setFileList(toFileList(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const customRequest: UploadProps['customRequest'] = async options => {
    try {
      const url = await uploadImage(options.file as File);
      options.onSuccess?.({ url });
    } catch (e: any) {
      message.error(e.message);
      options.onError?.(e as Error);
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newList }) => {
    const withUrls = newList.map(f => (f.response?.url ? { ...f, url: f.response.url, status: 'done' as const } : f));
    setFileList(withUrls);
    onChange?.(withUrls.filter(f => f.status === 'done' && f.url).map(f => f.url as string));
  };

  return (
    <Upload
      className="image-upload-3col"
      listType="picture-card"
      fileList={fileList}
      customRequest={customRequest}
      onChange={handleChange}
      accept="image/*"
      multiple
      maxCount={MAX_IMAGES}
    >
      {fileList.length >= MAX_IMAGES ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Ajouter</div>
        </div>
      )}
    </Upload>
  );
};

export default ImageUpload;
