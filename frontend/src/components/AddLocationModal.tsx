import { useCreate, useGetIdentity, useTranslate } from '@refinedev/core';
import { Checkbox, Form, Input, Modal } from 'antd';

import AddressAutocomplete from './AddressAutocomplete';
import type { Identity, PlaceRecord } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (locationId: string) => void;
};

type FormValues = {
  'vcard:given-name': string;
  address: PlaceRecord;
  home: boolean;
};

/** Adds a new saved address (`vcard:Location`) the user can then pick from in the ad composer. */
const AddLocationModal = ({ open, onClose, onCreated }: Props) => {
  const translate = useTranslate();
  const { data: identity } = useGetIdentity<Identity>();
  const { mutateAsync: create, mutation } = useCreate();
  const [form] = Form.useForm<FormValues>();

  const onFinish = async (values: FormValues) => {
    const { data } = await create({
      resource: 'location',
      values: {
        'vcard:given-name': values['vcard:given-name'],
        'vcard:TYPE': values.home ? 'home' : undefined,
        'vcard:hasAddress': {
          type: 'vcard:Address',
          'vcard:given-name': values.address.name,
          'vcard:hasGeo': {
            'vcard:latitude': values.address.latitude,
            'vcard:longitude': values.address.longitude
          }
        }
      }
    });
    form.resetFields();
    onCreated(data.id as string);
  };

  return (
    <Modal
      title={translate('location.add')}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ 'vcard:given-name': translate('location.default_name', { name: identity?.name || '' }) }}>
        <Form.Item name="vcard:given-name" label={translate('location.name')} rules={[{ required: true }]}>
          <Input placeholder={translate('location.name_placeholder')} />
        </Form.Item>
        <Form.Item name="address" label={translate('location.locality')} rules={[{ required: true, message: translate('location.locality_required') }]}>
          <AddressAutocomplete />
        </Form.Item>
        <Form.Item name="home" valuePropName="checked">
          <Checkbox>{translate('location.home')}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddLocationModal;
