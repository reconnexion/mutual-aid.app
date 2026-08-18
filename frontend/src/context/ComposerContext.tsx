import { createContext, useContext } from 'react';

/** Lets any page (the sidebar's "Créer une annonce" button, or the list page's bottom bar) open
 *  the single shared ad composer instance owned by `AppShell`. */
const ComposerContext = createContext<{ openComposer: () => void }>({ openComposer: () => {} });

export const useComposer = () => useContext(ComposerContext);

export default ComposerContext;
