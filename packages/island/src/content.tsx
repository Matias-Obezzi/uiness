import type { CSSProperties, ReactNode } from 'react'
import type { AlertOptions, ConfirmOptions } from './types'

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.3,
  margin: 0,
}

const descriptionStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.4,
  margin: '4px 0 0',
  opacity: 0.7,
}

const buttonBase: CSSProperties = {
  font: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1,
  padding: '10px 16px',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  color: 'inherit',
  background: 'var(--island-muted, rgba(255, 255, 255, 0.14))',
  flex: 1,
}

function Header({
  icon,
  title,
  description,
}: Pick<AlertOptions, 'icon' | 'title' | 'description'>) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {icon != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'var(--island-muted, rgba(255, 255, 255, 0.14))',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={titleStyle}>{title}</p>
        {description != null && <p style={descriptionStyle}>{description}</p>}
      </div>
    </div>
  )
}

export interface ConfirmContentProps extends ConfirmOptions {
  onConfirm: () => void
  onCancel: () => void
}

/** Default UI used by `island.confirm()`. Exported so it can be reused in custom entries. */
export function ConfirmContent({
  title,
  description,
  icon,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmContentProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 260 }}>
      <Header icon={icon} title={title} description={description} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={buttonBase} data-island-cancel="">
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-island-confirm=""
          style={{
            ...buttonBase,
            color: '#fff',
            background: destructive
              ? 'var(--island-danger, #ff453a)'
              : 'var(--island-accent, #0a84ff)',
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}

/** Default UI used by `island.alert()` in expanded mode. */
export function AlertContent({ title, description, icon }: AlertOptions) {
  return (
    <div style={{ minWidth: 240 }}>
      <Header icon={icon} title={title} description={description} />
    </div>
  )
}

/** Small CSS-only spinner that matches the island's text color. */
export function Spinner({ size = 16 }: { size?: number }): ReactNode {
  return (
    <span
      aria-hidden
      data-island-spinner=""
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(2, size / 8)}px solid currentColor`,
        borderRightColor: 'transparent',
        animation: 'uiness-island-spin 0.8s linear infinite',
      }}
    />
  )
}
