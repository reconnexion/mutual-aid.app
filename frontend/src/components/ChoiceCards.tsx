import type { ReactNode } from 'react';
import { Form, Typography, theme } from 'antd';

const { Text } = Typography;

export type ChoiceOption<T extends string> = {
  value: T;
  title: string;
  description: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  options: ChoiceOption<T>[];
  /** Injected by `Form.Item` — nothing selected until the user picks a card. */
  value?: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
};

/** A radio group rendered as a row of cards, each with a title and a one-line description — for
 *  the composer's "Je souhaite…" / "Il s'agit de…" choices, where a bare `Segmented` (with a
 *  preselected default) didn't make it obvious there was a decision to make, nor what the
 *  options meant. Wraps to as many rows as needed on narrow screens. */
const ChoiceCards = <T extends string>({ options, value, onChange, disabled }: Props<T>) => {
  const { token } = theme.useToken();
  // Mirrors the red outline an `Input` gets when its `Form.Item` fails validation.
  const { status } = Form.Item.useStatus();
  const invalid = status === 'error' && value === undefined;

  return (
    <div
      role="radiogroup"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <div
            key={option.value}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onChange?.(option.value)}
            onKeyDown={e => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onChange?.(option.value);
              }
            }}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '10px 12px',
              borderRadius: token.borderRadiusLG,
              border: `2px solid ${selected ? token.colorPrimary : invalid ? token.colorError : token.colorBorderSecondary}`,
              background: selected ? token.colorPrimaryBg : token.colorBgContainer,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled && !selected ? 0.5 : 1,
              transition: 'border-color 0.2s, background 0.2s',
              userSelect: 'none'
            }}
          >
            {option.icon && (
              <span
                style={{
                  fontSize: 20,
                  lineHeight: '22px',
                  color: selected ? token.colorPrimary : token.colorTextSecondary
                }}
              >
                {option.icon}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: 'block', color: selected ? token.colorPrimary : undefined }}>
                {option.title}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: '16px' }}>
                {option.description}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChoiceCards;
