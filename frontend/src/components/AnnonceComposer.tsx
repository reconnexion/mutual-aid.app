import { useEffect, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Segmented, Slider, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useCreate, useDelete, useInvalidate, useList, useUpdate } from '@refinedev/core';
import dayjs from 'dayjs';

import ImageUpload from './ImageUpload';
import LocationSelect from './LocationSelect';
import RecipientPicker from './RecipientPicker';
import useActivityCollection from '../hooks/useActivityCollection';
import useOutbox from '../hooks/useOutbox';
import { imagesOf, literalValue, resourceTypeCurie } from '../utils/ontology';
import type { AnnonceKind, AnnonceRecord, LocationRecord } from '../types';

export type ComposerMode = 'create' | 'edit' | 'share';

type Props = {
  open: boolean;
  mode: ComposerMode;
  /** For `create`: the initially selected kind (still changeable in the form). For `edit`/`share`: derived from `annonce`. */
  kind: AnnonceKind;
  annonce?: AnnonceRecord;
  /** Pre-fills "Titre" in `create` mode — e.g. text already typed into the list page's
   *  bottom bar before the dialog was opened. */
  initialTitle?: string;
  onClose: () => void;
  onSaved?: () => void;
};

const RESOURCE_TYPE_PREDICATE: Record<AnnonceKind, string> = {
  offer: 'maid:offerOfResourceType',
  request: 'maid:requestOfResourceType'
};

type FormValues = {
  title: string;
  content: string;
  resourceType: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
  locationId?: string;
  radius: number;
  expiryDays: number;
  images?: string[];
};

const asPlace = (location: LocationRecord, radius: number) => ({
  type: 'Place',
  name: location['vcard:given-name'],
  latitude: location['vcard:hasAddress']?.['vcard:hasGeo']?.['vcard:latitude'],
  longitude: location['vcard:hasAddress']?.['vcard:hasGeo']?.['vcard:longitude'],
  radius
});

/** Ad composer, matching the mockup: `create` is 2 steps (content, then who to share it with);
 *  `edit` and `share` are each a single step (either just the content, or just the recipients). */
const AnnonceComposer = ({ open, mode, kind: initialKind, annonce, initialTitle, onClose, onSaved }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [kind, setKind] = useState<AnnonceKind>(initialKind);
  const [step, setStep] = useState<1 | 2>(mode === 'share' ? 2 : 1);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { mutateAsync: createAnnonce } = useCreate();
  const { mutateAsync: updateAnnonce } = useUpdate();
  const { mutateAsync: deleteAnnonce } = useDelete();
  const outbox = useOutbox();
  const invalidate = useInvalidate();

  const { items: alreadyShared } = useActivityCollection<string>(mode !== 'create' ? annonce?.['apods:announces'] : undefined);
  const { result: locations } = useList<LocationRecord>({ resource: 'location', pagination: { mode: 'off' } });

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setStep(mode === 'share' ? 2 : 1);
    setSelected([]);
    if (annonce) {
      const expirationDate = literalValue(annonce['maid:expirationDate']);
      const radius = annonce.location?.radius ? Number(annonce.location.radius) : 15;
      form.setFieldsValue({
        title: annonce.name,
        content: annonce.content,
        resourceType: resourceTypeCurie((annonce as any)[RESOURCE_TYPE_PREDICATE[initialKind]]),
        radius,
        expiryDays: expirationDate ? Math.max(1, dayjs(expirationDate).diff(dayjs(), 'day')) : 30,
        images: imagesOf(annonce['pair:depictedBy'])
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ title: initialTitle, resourceType: 'pair:AtomBasedResource', radius: 15, expiryDays: 30 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, annonce, mode, initialTitle]);

  // Defaults the "Localité" field to the home address once the saved-addresses list has loaded —
  // separate from the reset effect above so that adding a new address mid-composing (which also
  // changes `locations.data`) doesn't wipe fields the user has already filled in.
  useEffect(() => {
    if (!open || mode !== 'create' || form.getFieldValue('locationId')) return;
    const home = locations.data.find(l => l['vcard:TYPE'] === 'home');
    if (home) form.setFieldValue('locationId', home.id);
  }, [open, mode, locations.data, form]);

  const isMultiStep = mode === 'create';
  const heading = mode === 'edit' ? "Modifier l'annonce" : mode === 'share' ? "Partager l'annonce" : 'Créer une annonce';
  const stepLabel = mode === 'share' ? 'Destinataires' : isMultiStep ? (step === 1 ? "Étape 1 sur 2 · Contenu de l'annonce" : 'Étape 2 sur 2 · Destinataires') : undefined;

  const resourceUri = kind === 'offer' ? 'offer' : 'request';

  const goNext = async () => {
    if (step === 1) {
      await form.validateFields();
      setStep(2);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      let annonceId = annonce?.id;

      if (mode !== 'share') {
        const values = form.getFieldsValue();
        const selectedLocation = locations.data.find(l => l.id === values.locationId);
        const location = selectedLocation ? asPlace(selectedLocation, values.radius) : annonce?.location ? { ...annonce.location, radius: values.radius } : undefined;

        const variables: Record<string, any> = {
          name: values.title,
          content: values.content,
          location,
          'pair:depictedBy': values.images,
          [RESOURCE_TYPE_PREDICATE[kind]]: values.resourceType,
          'maid:expirationDate': dayjs().add(values.expiryDays, 'day').toISOString()
        };

        if (mode === 'create') {
          const { data } = await createAnnonce({ resource: resourceUri, values: variables });
          annonceId = data?.id as string;
        } else if (mode === 'edit' && annonce) {
          await updateAnnonce({ resource: resourceUri, id: annonce.id, values: variables });
        }
      }

      if (annonceId && selected.length > 0) {
        await outbox.post({
          type: 'Announce',
          actor: outbox.owner,
          object: annonceId,
          target: selected,
          to: selected
        });
      }

      invalidate({ resource: resourceUri, invalidates: ['list', 'detail'] });
      message.success(mode === 'create' ? 'Annonce publiée' : mode === 'edit' ? 'Annonce mise à jour' : 'Annonce partagée');
      onSaved?.();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
    setSubmitting(false);
  };

  const deleteAd = async () => {
    if (!annonce) return;
    setDeleting(true);
    try {
      await deleteAnnonce({ resource: resourceUri, id: annonce.id });
      invalidate({ resource: resourceUri, invalidates: ['list'] });
      message.success('Annonce supprimée');
      onSaved?.();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
    setDeleting(false);
  };

  const primaryLabel = isMultiStep && step === 1 ? 'Suivant : destinataires' : mode === 'create' ? 'Envoyer' : 'Enregistrer';
  const onPrimary = isMultiStep && step === 1 ? goNext : submit;

  const secondaryLabel = isMultiStep && step === 2 ? 'Retour' : 'Annuler';
  const onSecondary = () => {
    if (isMultiStep && step === 2) setStep(1);
    else onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <div>{heading}</div>
          {stepLabel && <div style={{ fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)' }}>{stepLabel}</div>}
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {mode === 'edit' && (
              <Popconfirm title="Supprimer cette annonce ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={deleteAd}>
                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                  Supprimer
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onSecondary}>{secondaryLabel}</Button>
            <Button type="primary" onClick={onPrimary} loading={submitting}>
              {primaryLabel}
            </Button>
          </Space>
        </div>
      }
      width={560}
      destroyOnHidden
    >
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <Form form={form} layout="vertical">
          <Space size={8} style={{ marginBottom: 24 }} wrap>
            {mode === 'create' && (
              <Segmented
                value={kind}
                onChange={value => setKind(value as AnnonceKind)}
                options={[
                  { label: 'Offre', value: 'offer' },
                  { label: 'Demande', value: 'request' }
                ]}
              />
            )}
            {mode === 'create' && (
              <Form.Item name="resourceType" noStyle>
                <Segmented
                  options={[
                    { label: 'Matériel', value: 'pair:AtomBasedResource' },
                    { label: 'Compétence', value: 'pair:HumanBasedResource' }
                  ]}
                />
              </Form.Item>
            )}
          </Space>
          <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Donnez un titre à votre annonce' }]}>
            <Input placeholder="Ex. Je donne des outils de jardinage" />
          </Form.Item>
          <Form.Item name="content" label="Votre annonce" rules={[{ required: true, message: 'Décrivez votre annonce' }]}>
            <Input.TextArea rows={7} placeholder="Bonjour, je cherche…" />
          </Form.Item>
          <Form.Item name="images" label="Photos (optionnel, jusqu'à 10)">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="locationId" label="Localité" rules={[{ required: !annonce?.location, message: 'Indiquez une localité' }]}>
            <LocationSelect />
          </Form.Item>
          <Form.Item name="radius" label="Rayon de diffusion">
            <Slider min={5} max={50} step={5} marks={{ 5: '5 km', 50: '50 km' }} />
          </Form.Item>
          <Form.Item name="expiryDays" label="Expire dans (jours)" rules={[{ required: true }]}>
            <InputNumber min={1} max={365} />
          </Form.Item>
        </Form>
      </div>
      {step === 2 && <RecipientPicker alreadyShared={alreadyShared} selected={selected} onChange={setSelected} />}
    </Modal>
  );
};

export default AnnonceComposer;
