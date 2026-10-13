import { createContext, useContext } from 'react';

/** On mobile, `AppShell` shows either the categories sidebar or the current page's content, never
 *  both — pages call `showContent()` on mount (reached via a category tap or a direct link), and
 *  the list page's back button calls `showSidebar()` to return to the categories screen. No-ops
 *  on desktop, where both panes are always visible. */
const MobileNavContext = createContext<{ showContent: () => void; showSidebar: () => void }>({
  showContent: () => {},
  showSidebar: () => {}
});

export const useMobileNav = () => useContext(MobileNavContext);

export default MobileNavContext;
