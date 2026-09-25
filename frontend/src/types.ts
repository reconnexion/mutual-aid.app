/** The identity shape returned by `@activitypods/refine-providers`'s `authProvider.getIdentity()`. */
export type Identity = {
  id: string;
  name: string;
  avatar?: string;
};

/** `Offer` and `Request` are two distinct Pod containers (hence two Refine resources), but the
 *  UI treats them as one "annonce" family — this tags which one a given record came from. */
export type AnnonceKind = 'offer' | 'request';

/** Embedded `as:Place` value of `location` — not a standalone Pod resource. */
export type PlaceRecord = {
  type?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  /** Sharing radius around this point, in kilometers. */
  radius?: number;
};

/** What an ad is about: material goods, a skill/service, or anything else. Same `pair:` classes
 *  as the previous (react-admin) version of L'Entraide used, `pair:Resource` being the generic
 *  superclass of the two others — hence "Autre". */
export type ResourceType = 'pair:AtomBasedResource' | 'pair:HumanBasedResource' | 'pair:Resource';

/** How the exchange happens (`pair:hasType`, same `maid:` classes as the previous version of
 *  L'Entraide) — see `config/exchangeTypes.ts` for labels and which apply to offers vs requests. */
export type ExchangeType =
  | 'maid:GiftOffer'
  | 'maid:BarterOffer'
  | 'maid:SaleOffer'
  | 'maid:LoanOffer'
  | 'maid:GiftRequest'
  | 'maid:BarterRequest'
  | 'maid:PurchaseRequest'
  | 'maid:LoanRequest';

export type AnnonceRecord = {
  id: string;
  type?: string | string[];
  /** Short title (AS2 `as:name`, compacted to the bare `name` key) — shown in the detail page
   *  header and used in notifications. */
  name?: string;
  /** The ad's free-text body. */
  content?: string;
  location?: PlaceRecord;
  /** Only set on offers. */
  'maid:offerOfResourceType'?: ResourceType;
  /** Only set on requests. */
  'maid:requestOfResourceType'?: ResourceType;
  /** Don / troc / vente… Absent on ads posted before this was (re)introduced. Read with
   *  `exchangeTypeCurie()` from `utils/ontology` (`@type: "@id"` in the pair context). */
  'pair:hasType'?: ExchangeType | { id: string };
  /** Optional expiration date; absent means the ad never expires. */
  'maid:expirationDate'?: string;
  /** Up to 10 photos — read with `imagesOf()` from `utils/ontology`, since a single value comes
   *  back bare rather than as a 1-element array. */
  'pair:depictedBy'?: string | string[] | { id: string } | { id: string }[];
  'dc:creator': string;
  'dc:created'?: string;
  /** `as:replies` collection URI — present once at least one comment exists. */
  replies?: string;
  /** `as:likes` collection URI — present once at least one like exists. */
  likes?: string;
  [key: string]: any;
};

/** A saved, reusable address (`vcard:Location`) the user can pick from in the ad composer —
 *  distinct from the embedded `as:location` copied onto each ad at submit time. */
export type LocationRecord = {
  id: string;
  'vcard:given-name'?: string;
  'vcard:hasAddress'?: {
    'vcard:given-name'?: string;
    'vcard:hasGeo'?: { 'vcard:latitude'?: number; 'vcard:longitude'?: number };
  };
  /** Set to `'home'` on the user's home address, used as the composer's default. */
  'vcard:TYPE'?: string;
  [key: string]: any;
};

export type InvitationState = {
  canView: boolean;
  canShare: boolean;
  /** Already granted before this dialog session opened — the checkbox can't be unset here. */
  viewReadonly: boolean;
  shareReadonly: boolean;
};

export type ProfileRecord = {
  id: string;
  describes: string;
  'vcard:given-name'?: string;
  'vcard:photo'?: string;
  /** Approximate home position (the Pod provider fuzzes it by ~1 km before exposing it to
   *  contacts) — absent when the person hasn't set a home address. */
  'vcard:hasGeo'?: { 'vcard:latitude'?: number | string; 'vcard:longitude'?: number | string };
  [key: string]: any;
};

/** A `Note` embedded in an `as:replies` collection (comment on an annonce). */
export type ReplyRecord = {
  id: string;
  content?: string;
  attributedTo?: string;
  'dc:created'?: string;
  [key: string]: any;
};
