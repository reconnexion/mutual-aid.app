import Markdown from 'markdown-to-jsx';
import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Props = {
  children?: string;
  /** Renders links as plain text — for when the whole block is already wrapped in a link. */
  disableLinks?: boolean;
  className?: string;
  style?: CSSProperties;
};

const ExternalLink = (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} target="_blank" rel="noopener noreferrer" />;
const PlainText = ({ children }: { children?: ReactNode }) => <span>{children}</span>;

/** An ad's text. Ads posted with the previous version of L'Entraide were written in Markdown (with
 *  its `MarkdownInput`), new ones in a plain textarea — which renders the same, line breaks
 *  included (see `.app-markdown` in `index.css`). Raw HTML isn't interpreted: it's other people's
 *  content. */
const MarkdownContent = ({ children, disableLinks, className, style }: Props) => {
  if (!children) return null;
  return (
    <div className={['app-markdown', className].filter(Boolean).join(' ')} style={style}>
      <Markdown options={{ disableParsingRawHTML: true, forceBlock: true, overrides: { a: disableLinks ? PlainText : ExternalLink } }}>
        {children}
      </Markdown>
    </div>
  );
};

export default MarkdownContent;
