import { createContext, useContext } from 'react';

import type { AnnonceKind, AnnonceRecord } from '../types';
import type { ComposerMode } from '../components/AnnonceComposer';

export type ComposerRequest = {
  mode: ComposerMode;
  kind: AnnonceKind;
  annonce?: AnnonceRecord;
};

/** Lets any page or card (the sidebar's "Créer une annonce" button, the list page's bottom bar,
 *  an annonce card's "Modifier"/"Partager" banner) open the single shared composer instance
 *  owned by `AppShell`, in whichever mode it needs. */
const ComposerContext = createContext<{ openComposer: (request?: Partial<ComposerRequest>) => void }>({
  openComposer: () => {}
});

export const useComposer = () => useContext(ComposerContext);

export default ComposerContext;
