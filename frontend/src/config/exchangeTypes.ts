import type { AnnonceKind, ExchangeType, ResourceType } from '../types';

/** Same `pair:hasType` values the previous (react-admin) version of L'Entraide stored: the
 *  `maid:` exchange class is `<Gift|Barter|Sale|Loan>Offer` for offers and
 *  `<Gift|Barter|Purchase|Loan>Request` for requests. Loan/borrowing only makes sense for
 *  material things, so it's not offered for `pair:HumanBasedResource` (as before). */
export type ExchangeTypeDef = {
  value: ExchangeType;
  label: string;
  description: string;
  /** Example title shown as the "Titre" placeholder once this exchange type is picked. */
  titleExample: string;
  notForHuman?: boolean;
};

export const EXCHANGE_TYPES: Record<AnnonceKind, ExchangeTypeDef[]> = {
  offer: [
    {
      value: 'maid:GiftOffer',
      label: 'Don',
      description: 'Gratuitement, sans contrepartie',
      titleExample: 'Ex. Je donne des outils de jardinage'
    },
    {
      value: 'maid:BarterOffer',
      label: 'Troc',
      description: 'Contre un autre bien ou service',
      titleExample: "Ex. J'échange des légumes contre des œufs"
    },
    {
      value: 'maid:SaleOffer',
      label: 'Vente',
      description: "Contre de l'argent (euros ou Ğ1)",
      titleExample: "Ex. Je vends un vélo d'enfant"
    },
    {
      value: 'maid:LoanOffer',
      label: 'Prêt',
      description: 'Pour une durée limitée',
      titleExample: 'Ex. Je prête ma remorque',
      notForHuman: true
    }
  ],
  request: [
    {
      value: 'maid:GiftRequest',
      label: 'Don',
      description: 'Je cherche à récupérer gratuitement',
      titleExample: 'Ex. Je cherche un canapé à récupérer'
    },
    {
      value: 'maid:BarterRequest',
      label: 'Troc',
      description: "J'offre un autre bien ou service en échange",
      titleExample: "Ex. Je cherche des cours d'anglais contre des cours de guitare"
    },
    {
      value: 'maid:PurchaseRequest',
      label: 'Achat',
      description: 'Je paie (euros ou Ğ1)',
      titleExample: "Ex. J'achète une perceuse d'occasion"
    },
    {
      value: 'maid:LoanRequest',
      label: 'Emprunt',
      description: 'Pour une durée limitée',
      titleExample: "Ex. J'emprunte une échelle pour le week-end",
      notForHuman: true
    }
  ]
};

export const exchangeTypesFor = (kind: AnnonceKind, resourceType?: ResourceType): ExchangeTypeDef[] =>
  EXCHANGE_TYPES[kind].filter(t => !(t.notForHuman && resourceType === 'pair:HumanBasedResource'));

const ALL_EXCHANGE_TYPES = [...EXCHANGE_TYPES.offer, ...EXCHANGE_TYPES.request];

export const exchangeTypeDef = (value?: ExchangeType): ExchangeTypeDef | undefined =>
  ALL_EXCHANGE_TYPES.find(t => t.value === value);

/** Label for an ad's tag on cards ("Don", "Troc"…) — `undefined` for ads posted before the
 *  exchange type was (re)introduced, which simply have no `pair:hasType`. */
export const exchangeTypeLabel = (value?: ExchangeType): string | undefined => exchangeTypeDef(value)?.label;
