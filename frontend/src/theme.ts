import type { ThemeConfig } from 'antd';

/** Antd theme tokens matching the mockup's blue identity (Antd's own default blue, made explicit
 *  here so it stays stable regardless of Antd's own default changing in a future version). */
const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8
  }
};

export default theme;
