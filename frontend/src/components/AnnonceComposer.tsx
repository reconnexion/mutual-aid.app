import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Slider, Space, Switch, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EuroOutlined,
  GiftOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SendOutlined,
  ShoppingOutlined,
  SwapOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useCreate, useDelete, useGetIdentity, useInvalidate, useList, useUpdate } from '@refinedev/core';
import dayjs from 'dayjs';

import ChoiceCards, { type ChoiceOption } from './ChoiceCards';
import ImageUpload from './ImageUpload';
import LocationSelect from './LocationSelect';
import RecipientPicker from './RecipientPicker';
import useActivityCollection from '../hooks/useActivityCollection';
import useIsMobile from '../hooks/useIsMobile';
import useOutbox from '../hooks/useOutbox';
import { exchangeTypeCurie, imagesOf, literalValue, resourceTypeCurie } from '../utils/ontology';
import { exchangeTypeDef, exchangeTypesFor } from '../config/exchangeTypes';
import { geoPoint } from '../utils/geo';
import type { AnnonceKind, AnnonceRecord, ExchangeType, Identity, InvitationState, LocationRecord, ResourceType } from '../types';

export type ComposerMode = 'create' | 'edit' | 'share';

type Props = {
  open: boolean;
  mode: ComposerMode;
  /** For `edit`/`share`: derived from `annonce`. Ignored in `create` mode, where the user has to
   *  pick explicitly (nothing is preselected — see `KIND_OPTIONS`). */
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

// Neither choice has a default: preselecting "Offre" + "Matériel" made the two rows look like
// tabs rather than a decision, and ads ended up in the wrong category. The descriptions are what
// actually explain the taxonomy (offer/request × pair:AtomBasedResource/HumanBasedResource/Resource).
const KIND_OPTIONS: ChoiceOption<AnnonceKind>[] = [
  { value: 'offer', title: 'Proposer', description: "J'offre quelque chose à mon réseau", icon: <SendOutlined /> },
  { value: 'request', title: 'Demander', description: 'Je cherche quelque chose', icon: <SearchOutlined /> }
];

const RESOURCE_TYPE_OPTIONS: ChoiceOption<ResourceType>[] = [
  { value: 'pair:AtomBasedResource', title: 'Matériel', description: 'Objet, outil, véhicule…', icon: <ToolOutlined /> },
  { value: 'pair:HumanBasedResource', title: 'Compétence', description: 'Coup de main, savoir-faire…', icon: <BulbOutlined /> },
  { value: 'pair:Resource', title: 'Autre', description: 'Hébergement, covoiturage…', icon: <AppstoreOutlined /> }
];

const EXCHANGE_ICON: Record<ExchangeType, ReactNode> = {
  'maid:GiftOffer': <GiftOutlined />,
  'maid:BarterOffer': <SwapOutlined />,
  'maid:SaleOffer': <EuroOutlined />,
  'maid:LoanOffer': <ClockCircleOutlined />,
  'maid:GiftRequest': <GiftOutlined />,
  'maid:BarterRequest': <SwapOutlined />,
  'maid:PurchaseRequest': <ShoppingOutlined />,
  'maid:LoanRequest': <ClockCircleOutlined />
};

// The "Titre" placeholder comes from the chosen exchange type (see `exchangeTypes.ts`); the body's
// only depends on offer vs request.
const CONTENT_PLACEHOLDER: Record<AnnonceKind, string> = {
  offer: 'Bonjour, je propose…',
  request: 'Bonjour, je cherche…'
};

/** Pages of the dialog. `create` walks through all four; `edit` folds "Diffusion" (geolocation
 *  + expiry) into the details page — the explanatory text there is for first-timers — and skips
 *  the recipients (that's what `share` is for); `share` shows only them. The form pages stay
 *  mounted (hidden with `display: none`) so values survive going back and forth. */
type Step = 'type' | 'details' | 'distribution' | 'recipients';
const STEPS: Record<ComposerMode, Step[]> = {
  create: ['type', 'details', 'distribution', 'recipients'],
  edit: ['type', 'details'],
  share: ['recipients']
};
const STEP_FIELDS: Record<Step, (keyof FormValues)[]> = {
  type: ['kind', 'resourceType', 'exchangeType'],
  details: ['title', 'content', 'images'],
  distribution: ['geolocated', 'locationId', 'radius', 'expiryDays'],
  recipients: []
};

type FormValues = {
  kind: AnnonceKind;
  exchangeType: ExchangeType;
  title: string;
  content: string;
  resourceType: ResourceType;
  /** Off = no `location` on the ad at all (the "Localité"/"Rayon" fields are hidden). */
  geolocated: boolean;
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
/** A field label with an (i) tooltip — keeps the "Diffusion" page compact while still explaining
 *  each setting. */
const LabelWithHelp = ({ label, help }: { label: string; help: string }) => (
  <Space size={4}>
    {label}
    <Tooltip title={help}>
      <QuestionCircleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
    </Tooltip>
  </Space>
);

const AnnonceComposer = ({ open, mode, kind: initialKind, annonce, initialTitle, onClose, onSaved }: Props) => {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [form] = Form.useForm<FormValues>();
  // Undefined in `create` mode until the user picks a card; `edit`/`share` are prefilled from the
  // ad and can't change it (an offer can't become a request: it lives in a different container).
  const kind: AnnonceKind | undefined = Form.useWatch('kind', form) ?? (mode === 'create' ? undefined : initialKind);
  const resourceType: ResourceType | undefined = Form.useWatch('resourceType', form);
  const exchangeType: ExchangeType | undefined = Form.useWatch('exchangeType', form);
  const geolocated: boolean = Form.useWatch('geolocated', form) ?? true;
  const locationId: string | undefined = Form.useWatch('locationId', form);
  const radius: number | undefined = Form.useWatch('radius', form);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = STEPS[mode];
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const [invitations, setInvitations] = useState<Record<string, InvitationState>>({});
  const [savedInvitations, setSavedInvitations] = useState<Record<string, InvitationState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: identity } = useGetIdentity<Identity>();
  const { mutateAsync: createAnnonce } = useCreate();
  const { mutateAsync: updateAnnonce } = useUpdate();
  const { mutateAsync: deleteAnnonce } = useDelete();
  const outbox = useOutbox();
  const invalidate = useInvalidate();

  const creatorUri = annonce?.['dc:creator'];
  const isCreator = mode === 'create' || creatorUri === identity?.id;

  const { items: alreadyShared } = useActivityCollection<string>(mode !== 'create' ? annonce?.['apods:announces'] : undefined);
  const { items: alreadyAnnouncers } = useActivityCollection<string>(mode !== 'create' ? annonce?.['apods:announcers'] : undefined);
  const { result: locations } = useList<LocationRecord>({ resource: 'location', pagination: { mode: 'off' } });

  // Populate present invitations: anyone already in `apods:announces`/`apods:announcers` is readonly.
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, InvitationState> = {};
    [...alreadyShared, ...alreadyAnnouncers].forEach(webId => {
      const canView = alreadyShared.includes(webId);
      const canShare = alreadyAnnouncers.includes(webId);
      initial[webId] = { canView, canShare, viewReadonly: canView, shareReadonly: canShare };
    });
    setInvitations(initial);
    setSavedInvitations(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alreadyShared, alreadyAnnouncers]);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    if (annonce) {
      const expirationDate = literalValue(annonce['maid:expirationDate']);
      const radius = annonce.location?.radius ? Number(annonce.location.radius) : 15;
      form.setFieldsValue({
        kind: initialKind,
        geolocated: !!annonce.location,
        title: annonce.name,
        content: annonce.content,
        resourceType: resourceTypeCurie((annonce as any)[RESOURCE_TYPE_PREDICATE[initialKind]]),
        exchangeType: exchangeTypeCurie(annonce['pair:hasType']),
        radius,
        expiryDays: expirationDate ? Math.max(1, dayjs(expirationDate).diff(dayjs(), 'day')) : 30,
        images: imagesOf(annonce['pair:depictedBy'])
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ title: initialTitle, geolocated: true, radius: 15, expiryDays: 30 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, annonce, mode, initialTitle]);

  // Derives the "Localité" field once the saved-addresses list has loaded — separate from the
  // reset effect above so that adding a new address mid-composing (which also changes
  // `locations.data`) doesn't wipe fields the user has already filled in.
  useEffect(() => {
    if (!open || form.getFieldValue('locationId')) return;
    if (mode === 'create') {
      // Home address by default, else the first saved one — most users only have the one anyway.
      const home = locations.data.find(l => l['vcard:TYPE'] === 'home') ?? locations.data[0];
      if (home) form.setFieldValue('locationId', home.id);
    } else if (annonce?.location) {
      // `annonce.location` is an embedded snapshot copied at submit time (see `PlaceRecord`), not
      // a reference to a saved `LocationRecord` — match it back to one by name/coordinates so the
      // "Localité" dropdown reflects it. No match (e.g. the saved address was since edited or
      // deleted) just leaves it unselected; the ad's own location is unaffected either way.
      const match = locations.data.find(
        l =>
          l['vcard:given-name'] === annonce.location?.name &&
          l['vcard:hasAddress']?.['vcard:hasGeo']?.['vcard:latitude'] === annonce.location?.latitude &&
          l['vcard:hasAddress']?.['vcard:hasGeo']?.['vcard:longitude'] === annonce.location?.longitude
      );
      if (match) form.setFieldValue('locationId', match.id);
    }
  }, [open, mode, annonce, locations.data, form]);

  // Where the ad is (for the recipients page's distance filter): the address picked on the
  // "Diffusion" page, else — in `share` mode, where that page doesn't exist — the ad's own
  // embedded location. `undefined` when not geolocated, which disables the filter.
  const place = useMemo(() => {
    if (mode === 'share') {
      const point = annonce?.location && geoPoint({ 'vcard:latitude': annonce.location.latitude, 'vcard:longitude': annonce.location.longitude });
      return point && { ...point, radiusKm: annonce?.location?.radius ? Number(annonce.location.radius) : undefined };
    }
    if (!geolocated) return undefined;
    const point = geoPoint(locations.data.find(l => l.id === locationId)?.['vcard:hasAddress']?.['vcard:hasGeo']);
    return point && { ...point, radiusKm: radius };
  }, [mode, annonce, geolocated, locationId, radius, locations.data]);

  const heading = mode === 'edit' ? 'Modifier la petite annonce' : mode === 'share' ? 'Partager la petite annonce' : 'Poster une petite annonce';
  const stepCounter = steps.length > 1 ? ` (${stepIndex + 1}/${steps.length})` : '';

  // Only read after the form has been validated (submit/delete), by which point `kind` is set.
  const resourceUri = kind === 'request' ? 'request' : 'offer';

  // Validates only the current page's fields, so an error on page 2 can't block page 1's "Suivant".
  const goNext = async () => {
    await form.validateFields(STEP_FIELDS[step]);
    setStepIndex(stepIndex + 1);
  };

  // The exchange classes differ between offers and requests (`maid:GiftOffer` vs
  // `maid:GiftRequest`), and loan isn't offered for skills — drop a choice that no longer applies.
  const onValuesChange = (changed: Partial<FormValues>, values: FormValues) => {
    if (('kind' in changed || 'resourceType' in changed) && values.kind && values.exchangeType) {
      const stillValid = exchangeTypesFor(values.kind, values.resourceType).some(t => t.value === values.exchangeType);
      if (!stillValid) form.setFieldValue('exchangeType', undefined);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      let annonceId = annonce?.id;

      if (mode !== 'share') {
        // In `create` every page was validated on "Suivant"; `edit` ends on the details page, so
        // it has to be checked here (a required field left empty must not silently save).
        const values = await form.validateFields();
        const selectedLocation = locations.data.find(l => l.id === values.locationId);
        // `undefined` (not geolocated) drops any existing `location` on update, since the data
        // provider PUTs the merged resource and JSON serialization omits undefined keys.
        const location = !values.geolocated
          ? undefined
          : selectedLocation
            ? asPlace(selectedLocation, values.radius)
            : annonce?.location
              ? { ...annonce.location, radius: values.radius }
              : undefined;

        const variables: Record<string, any> = {
          name: values.title,
          content: values.content,
          location,
          'pair:depictedBy': values.images,
          [RESOURCE_TYPE_PREDICATE[values.kind ?? initialKind]]: values.resourceType,
          'pair:hasType': values.exchangeType,
          'maid:expirationDate': dayjs().add(values.expiryDays, 'day').toISOString()
        };

        if (mode === 'create') {
          const { data } = await createAnnonce({ resource: resourceUri, values: variables });
          annonceId = data?.id as string;
        } else if (mode === 'edit' && annonce) {
          await updateAnnonce({ resource: resourceUri, id: annonce.id, values: variables });
        }
      }

      if (annonceId) {
        // Matches @activitypods/react's ShareDialog: the pod-provider's `announcer` service only
        // understands these two shapes, not an `interop:delegationAllowed` flag on a plain Announce.
        // - View-only invites: the creator posts `Announce` directly; a delegate instead posts
        //   `Offer{Announce}` addressed to the creator, whose Pod does the actual Announce.
        // - Share (delegation) rights: always `Offer{Announce}` addressed directly to the new
        //   delegates — only the creator may grant this (gated by RecipientPicker's `isCreator`).
        const actorsWithNewViewRight = Object.keys(invitations).filter(
          uri => invitations[uri].canView && !savedInvitations[uri]?.canView
        );
        if (actorsWithNewViewRight.length > 0) {
          if (isCreator) {
            await outbox.post({
              type: 'Announce',
              actor: outbox.owner,
              object: annonceId,
              target: actorsWithNewViewRight,
              to: actorsWithNewViewRight
            });
          } else if (creatorUri) {
            await outbox.post({
              type: 'Offer',
              actor: outbox.owner,
              object: { type: 'Announce', actor: outbox.owner, object: annonceId, target: actorsWithNewViewRight },
              target: creatorUri,
              to: creatorUri
            });
          }
        }

        const actorsWithNewShareRight = Object.keys(invitations).filter(uri => invitations[uri].canShare && !savedInvitations[uri]?.canShare);
        if (isCreator && actorsWithNewShareRight.length > 0) {
          await outbox.post({
            type: 'Offer',
            actor: outbox.owner,
            object: { type: 'Announce', object: annonceId },
            target: actorsWithNewShareRight,
            to: actorsWithNewShareRight
          });
        }
      }

      invalidate({ resource: resourceUri, invalidates: ['list', 'detail'] });
      message.success(mode === 'create' ? 'Petite annonce publiée' : mode === 'edit' ? 'Petite annonce mise à jour' : 'Petite annonce partagée');
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
      message.success('Petite annonce supprimée');
      onSaved?.();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
    setDeleting(false);
  };

  const primaryLabel = !isLastStep ? (steps[stepIndex + 1] === 'recipients' ? 'Suivant : destinataires' : 'Suivant') : mode === 'create' ? 'Envoyer' : 'Enregistrer';
  const onPrimary = !isLastStep ? goNext : submit;

  const secondaryLabel = stepIndex > 0 ? 'Retour' : 'Annuler';
  const onSecondary = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else onClose();
  };

  // Geolocation + expiry. Its own page in `create` (with room to explain the concept), appended
  // to the details page in `edit`.
  const distribution = (
    <>
      <Form.Item
        name="geolocated"
        valuePropName="checked"
        label={
          <LabelWithHelp
            label="Annonce géolocalisée"
            help="Une petite annonce géolocalisée est rattachée à une adresse et à un rayon de diffusion : elle n'est visible que par les personnes situées dans ce périmètre. Idéal pour du matériel à venir chercher ou un coup de main sur place. Désactivez-la si votre annonce s'adresse à tout votre réseau, où qu'il se trouve."
          />
        }
      >
        <Switch checkedChildren="Oui" unCheckedChildren="Non" />
      </Form.Item>
      {geolocated && (
        <>
          <Form.Item name="locationId" label="Localité" rules={[{ required: !annonce?.location, message: 'Indiquez une localité' }]}>
            <LocationSelect />
          </Form.Item>
          <Form.Item name="radius" label={<LabelWithHelp label="Rayon de diffusion" help="Les personnes situées au-delà de ce rayon ne verront pas votre petite annonce." />}>
            <Slider min={5} max={50} step={5} marks={{ 5: '5 km', 50: '50 km' }} />
          </Form.Item>
        </>
      )}
      <Form.Item
        name="expiryDays"
        label={
          <LabelWithHelp
            label="Expire dans (jours)"
            help="Passé ce délai, votre petite annonce disparaît du fil de vos contacts. Elle reste dans « Mes petites annonces », d'où vous pouvez la prolonger."
          />
        }
        rules={[{ required: true, message: 'Indiquez une durée' }]}
      >
        <InputNumber min={1} max={365} />
      </Form.Item>
    </>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span className="app-brand" style={{ color: '#fff', fontSize: 18 }}>
          {heading}
          {stepCounter}
        </span>
      }
      closeIcon={<CloseOutlined style={{ color: '#fff' }} />}
      styles={{
        // `clip-path` instead of `overflow: hidden` — the latter (even with a matching radius on
        // the header, even with `transform` forcing a compositing layer) still leaves a white
        // anti-aliasing seam on real, hardware-accelerated Firefox. `clip-path` defines a hard
        // vector mask rather than relying on rasterized layer blending, which sidesteps that.
        content: { padding: 0, clipPath: 'inset(0 round 8px)' },
        header: {
          margin: 0,
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #1677ff 0%, #4c9aff 100%)',
          borderRadius: '8px 8px 0 0'
        },
        body: { padding: '16px 24px 0' },
        footer: { margin: 0, padding: '16px 24px' }
      }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {mode === 'edit' && (
              <Popconfirm title="Supprimer cette petite annonce ?" okText="Supprimer" cancelText="Annuler" okButtonProps={{ danger: true }} onConfirm={deleteAd}>
                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                  {!isMobile && 'Supprimer'}
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
      width={isMobile ? 'calc(100vw - 32px)' : 640}
      style={isMobile ? { top: 16 } : undefined}
      centered={!isMobile}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onValuesChange={onValuesChange} style={{ display: step === 'recipients' ? 'none' : undefined }}>
        <div style={{ display: step === 'type' ? 'block' : 'none' }}>
          <Form.Item
            name="kind"
            label="Je souhaite…"
            rules={[{ required: true, message: 'Indiquez si vous proposez ou demandez quelque chose' }]}
            extra={mode === 'edit' ? 'Ne peut plus être modifié une fois la petite annonce publiée.' : undefined}
          >
            <ChoiceCards options={KIND_OPTIONS} disabled={mode === 'edit'} />
          </Form.Item>
          <Form.Item name="resourceType" label="Il s'agit de…" rules={[{ required: true, message: "Précisez de quoi il s'agit" }]}>
            <ChoiceCards options={RESOURCE_TYPE_OPTIONS} />
          </Form.Item>
          {/* Offers and requests don't share exchange classes, so wait for "Je souhaite…". */}
          {kind && (
            <Form.Item name="exchangeType" label="Type d'échange" rules={[{ required: true, message: "Choisissez un type d'échange" }]}>
              <ChoiceCards options={exchangeTypesFor(kind, resourceType).map(t => ({ value: t.value, title: t.label, description: t.description, icon: EXCHANGE_ICON[t.value] }))} />
            </Form.Item>
          )}
        </div>
        <div style={{ display: step === 'details' ? 'block' : 'none' }}>
          <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Donnez un titre à votre petite annonce' }]}>
            <Input placeholder={exchangeTypeDef(exchangeType)?.titleExample ?? 'Ex. Outils de jardinage, cours de guitare, covoiturage…'} />
          </Form.Item>
          <Form.Item name="content" label="Votre petite annonce" rules={[{ required: true, message: 'Décrivez votre petite annonce' }]} style={{ marginBottom: 16 }}>
            <Input.TextArea rows={5} placeholder={CONTENT_PLACEHOLDER[kind ?? 'offer']} />
          </Form.Item>
          <Form.Item name="images" label="Photos (max 10)">
            <ImageUpload />
          </Form.Item>
          {mode === 'edit' && distribution}
        </div>
        {mode !== 'edit' && <div style={{ display: step === 'distribution' ? 'block' : 'none' }}>{distribution}</div>}
      </Form>
      {step === 'recipients' && identity && (
        <RecipientPicker invitations={invitations} organizerUri={creatorUri ?? identity.id} isCreator={isCreator} place={place} onChange={setInvitations} />
      )}
    </Modal>
  );
};

export default AnnonceComposer;
