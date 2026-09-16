import type { AnnonceKind, ExchangeType, ResourceType } from '../types';

/** Same `pair:hasType` values the previous (react-admin) version of L'Entraide stored: the
 *  `maid:` exchange class is `<Gift|Barter|Sale|Loan>Offer` for offers and
 *  `<Gift|Barter|Purchase|Loan>Request` for requests. Loan/borrowing only makes sense for
 *  material things, so it's not offered for `pair:HumanBasedResource` (as before). */
export type ExchangeTypeDef = {
  value: ExchangeType;
  /** Suffix of the `exchange_types.<key>.{label,description,example}` translation keys —
   *  `example` being the title shown as the "Titre" placeholder once this type is picked. */
  key: string;
  notForHuman?: boolean;
};

export const EXCHANGE_TYPES: Record<AnnonceKind, ExchangeTypeDef[]> = {
  offer: [
    { value: 'maid:GiftOffer', key: 'gift_offer' },
    { value: 'maid:BarterOffer', key: 'barter_offer' },
    { value: 'maid:SaleOffer', key: 'sale_offer' },
    { value: 'maid:LoanOffer', key: 'loan_offer', notForHuman: true }
  ],
  request: [
    { value: 'maid:GiftRequest', key: 'gift_request' },
    { value: 'maid:BarterRequest', key: 'barter_request' },
    { value: 'maid:PurchaseRequest', key: 'purchase_request' },
    { value: 'maid:LoanRequest', key: 'loan_request', notForHuman: true }
  ]
};

export const exchangeTypesFor = (kind: AnnonceKind, resourceType?: ResourceType): ExchangeTypeDef[] =>
  EXCHANGE_TYPES[kind].filter(t => !(t.notForHuman && resourceType === 'pair:HumanBasedResource'));

const ALL_EXCHANGE_TYPES = [...EXCHANGE_TYPES.offer, ...EXCHANGE_TYPES.request];

export const exchangeTypeDef = (value?: ExchangeType): ExchangeTypeDef | undefined =>
  ALL_EXCHANGE_TYPES.find(t => t.value === value);

/** Translation key for an ad's tag on cards ("Don", "Troc"…) — `undefined` for ads posted before
 *  the exchange type was (re)introduced, which simply have no `pair:hasType`. */
export const exchangeTypeLabelKey = (value?: ExchangeType): string | undefined => {
  const def = exchangeTypeDef(value);
  return def && `exchange_types.${def.key}.label`;
};
