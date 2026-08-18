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
  /** The ad's free-text body. */
  content?: string;
  location?: PlaceRecord;
  /** Only set on offers. */
  'maid:offerOfResourceType'?: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
  /** Only set on requests. */
  'maid:requestOfResourceType'?: 'pair:AtomBasedResource' | 'pair:HumanBasedResource';
  /** Optional expiration date; absent means the ad never expires. */
  'maid:expirationDate'?: string;
  /** Optional single illustration image. */
  'pair:depictedBy'?: string;
  'dc:creator': string;
  'dc:created'?: string;
  /** `as:replies` collection URI — present once at least one comment exists. */
  replies?: string;
  /** `as:likes` collection URI — present once at least one like exists. */
  likes?: string;
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
  published?: string;
  [key: string]: any;
};
