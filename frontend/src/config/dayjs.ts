import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';

import { APP_LANG } from './env';

dayjs.extend(relativeTime);
// Antd's `ConfigProvider locale` (see App.tsx) only localizes Antd's own UI strings — month names
// and `fromNow()` come from dayjs's own locale, which is entirely separate. English is built in.
dayjs.locale(APP_LANG);
