/** PorteJunes' own Ğ1 mark (see its frontend/public/g1-logo.svg), duplicated here rather than
 *  referenced from PorteJunes' dev server -- this icon shouldn't depend on that app actually
 *  being up just to render. Sized/aligned like an antd icon (`1em`, small negative vertical
 *  offset) so it drops into a `Button`'s `icon` prop the same way an `@ant-design/icons`
 *  component would. */
const G1Icon = () => (
  <svg viewBox="0 0 64 64" width="1em" height="1em" style={{ verticalAlign: '-0.125em' }} aria-hidden="true">
    <circle cx="32" cy="32" r="31" fill="#F5C518" />
    <text
      x="32"
      y="34"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight={700}
      fontSize={38}
      fill="#ffffff"
    >
      Ğ
    </text>
  </svg>
);

export default G1Icon;
