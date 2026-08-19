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
  'maid:offerOfResourceType'?: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
  /** Only set on requests. */
  'maid:requestOfResourceType'?: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
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

export type ProfileRecord = {
  id: string;
  describes: string;
  'vcard:given-name'?: string;
  'vcard:photo'?: string;
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
