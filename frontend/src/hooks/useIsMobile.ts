import { useEffect, useState } from 'react';

const QUERY = '(max-width: 768px)';

/** Below this width, `AppShell` switches from the two-pane desktop layout (sidebar + content
 *  always visible together) to a single-pane mobile one (one screen at a time). */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
