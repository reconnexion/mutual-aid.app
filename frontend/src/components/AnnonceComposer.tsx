import { useEffect, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Segmented, Slider, Space, Switch } from 'antd';
import { useCreate, useInvalidate, useUpdate } from '@refinedev/core';
import dayjs from 'dayjs';

import AddressAutocomplete from './AddressAutocomplete';
import ImageUpload from './ImageUpload';
import RecipientPicker from './RecipientPicker';
import useActivityCollection from '../hooks/useActivityCollection';
import useOutbox from '../hooks/useOutbox';
import { literalValue, resourceTypeCurie } from '../utils/ontology';
import type { AnnonceKind, AnnonceRecord, PlaceRecord } from '../types';

export type ComposerMode = 'create' | 'edit' | 'share';

type Props = {
  open: boolean;
  mode: ComposerMode;
  /** For `create`: the initially selected kind (still changeable in the form). For `edit`/`share`: derived from `annonce`. */
  kind: AnnonceKind;
  annonce?: AnnonceRecord;
  onClose: () => void;
  onSaved?: () => void;
};

const RESOURCE_TYPE_PREDICATE: Record<AnnonceKind, string> = {
  offer: 'maid:offerOfResourceType',
  request: 'maid:requestOfResourceType'
};

type FormValues = {
  content: string;
  resourceType: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
  location?: PlaceRecord;
  radius: number;
  expiryDays: number;
  noExpiry: boolean;
  image?: string;
};

/** 2-step ad composer, matching the mockup: step 1 is the ad's content, step 2 picks who it's
 *  shared with (an `Announce` per selected contact — the Pod handles visibility from there). */
const AnnonceComposer = ({ open, mode, kind: initialKind, annonce, onClose, onSaved }: Props) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [kind, setKind] = useState<AnnonceKind>(initialKind);
  const [step, setStep] = useState<1 | 2>(mode === 'share' ? 2 : 1);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { mutateAsync: createAnnonce } = useCreate();
  const { mutateAsync: updateAnnonce } = useUpdate();
  const outbox = useOutbox();
  const invalidate = useInvalidate();

  const { items: alreadyShared } = useActivityCollection<string>(mode !== 'create' ? annonce?.['apods:announces'] : undefined);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setStep(mode === 'share' ? 2 : 1);
    setSelected([]);
    if (annonce) {
      const expirationDate = literalValue(annonce['maid:expirationDate']);
      const radius = annonce.location?.radius ? Number(annonce.location.radius) : 15;
      form.setFieldsValue({
        content: annonce.content,
        resourceType: resourceTypeCurie((annonce as any)[RESOURCE_TYPE_PREDICATE[initialKind]]),
        location: annonce.location,
        radius,
        noExpiry: !expirationDate,
        expiryDays: expirationDate ? Math.max(1, dayjs(expirationDate).diff(dayjs(), 'day')) : 30,
        image: annonce['pair:depictedBy']
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ resourceType: 'pair:AtomBasedResource', radius: 15, noExpiry: false, expiryDays: 30 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, annonce, mode]);

  const heading = mode === 'edit' ? "Modifier l'annonce" : mode === 'share' ? "Partager l'annonce" : 'Créer une annonce';
  const stepLabel =
    mode === 'share' ? 'Destinataires' : step === 1 ? "Étape 1 sur 2 · Contenu de l'annonce" : 'Étape 2 sur 2 · Destinataires';

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
        const variables: Record<string, any> = {
          content: values.content,
          location: values.location ? { ...values.location, type: 'Place', radius: values.radius } : undefined,
          'pair:depictedBy': values.image,
          [RESOURCE_TYPE_PREDICATE[kind]]: values.resourceType,
          'maid:expirationDate': values.noExpiry ? undefined : dayjs().add(values.expiryDays, 'day').toISOString()
        };

        if (mode === 'create') {
          const { data } = await createAnnonce({ resource: kind === 'offer' ? 'offer' : 'request', values: variables });
          annonceId = data?.id as string;
        } else if (mode === 'edit' && annonce) {
          await updateAnnonce({ resource: kind === 'offer' ? 'offer' : 'request', id: annonce.id, values: variables });
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

      invalidate({ resource: kind === 'offer' ? 'offer' : 'request', invalidates: ['list', 'detail'] });
      message.success(mode === 'create' ? 'Annonce publiée' : mode === 'edit' ? 'Annonce mise à jour' : 'Annonce partagée');
      onSaved?.();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
    setSubmitting(false);
  };

  const primaryLabel = mode !== 'share' && step === 1 ? 'Suivant : destinataires' : mode === 'create' ? 'Envoyer' : 'Enregistrer';
  const onPrimary = mode !== 'share' && step === 1 ? goNext : submit;

  const secondaryLabel = mode !== 'share' && step === 2 ? 'Retour' : 'Annuler';
  const onSecondary = () => {
    if (mode !== 'share' && step === 2) setStep(1);
    else onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div>
          <div>{heading}</div>
          <div style={{ fontSize: 12, fontWeight: 400, color: 'rgba(0,0,0,0.45)' }}>{stepLabel}</div>
        </div>
      }
      footer={
        <Space>
          <Button onClick={onSecondary}>{secondaryLabel}</Button>
          <Button type="primary" onClick={onPrimary} loading={submitting}>
            {primaryLabel}
          </Button>
        </Space>
      }
      width={560}
      destroyOnHidden
    >
      <div style={{ display: step === 1 ? 'block' : 'none' }}>
        <Form form={form} layout="vertical">
          {mode === 'create' && (
            <Form.Item label="Type d'annonce">
              <Segmented
                value={kind}
                onChange={value => setKind(value as AnnonceKind)}
                options={[
                  { label: 'Offre', value: 'offer' },
                  { label: 'Demande', value: 'request' }
                ]}
              />
            </Form.Item>
          )}
          <Form.Item name="resourceType" label="Catégorie">
            <Segmented
              options={[
                { label: 'Matériel', value: 'pair:AtomBasedResource' },
                { label: 'Compétence', value: 'pair:HumanBasedResource' }
              ]}
            />
          </Form.Item>
          <Form.Item name="content" label="Votre annonce" rules={[{ required: true, message: 'Décrivez votre annonce' }]}>
            <Input.TextArea rows={5} placeholder="Bonjour, je cherche…" />
          </Form.Item>
          <Form.Item name="image" label="Image (optionnel)">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="location" label="Localité" rules={[{ required: true, message: 'Indiquez une localité' }]}>
            <AddressAutocomplete />
          </Form.Item>
          <Form.Item name="radius" label="Rayon de diffusion">
            <Slider min={5} max={50} step={5} marks={{ 5: '5 km', 50: '50 km' }} />
          </Form.Item>
          <Form.Item label="Date d'expiration">
            <Space align="center">
              <Form.Item name="noExpiry" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span>Sans expiration</span>
            </Space>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.noExpiry !== cur.noExpiry}>
            {({ getFieldValue }) =>
              !getFieldValue('noExpiry') && (
                <Form.Item name="expiryDays" label="Expire dans (jours)">
                  <InputNumber min={1} max={365} />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </div>
      {step === 2 && (
        <RecipientPicker alreadyShared={alreadyShared} selected={selected} onChange={setSelected} />
      )}
    </Modal>
  );
};

export default AnnonceComposer;
