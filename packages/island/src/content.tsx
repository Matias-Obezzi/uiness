import { type CSSProperties, type ReactNode, useEffect, useId, useState } from 'react'
import type { AlertOptions, ChooseOptions, ConfirmOptions, PromptOptions } from './types'

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
            color: 'var(--island-accent-color, #fff)',
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

const accentButton: CSSProperties = {
  ...buttonBase,
  color: 'var(--island-accent-color, #fff)',
  background: 'var(--island-accent, #0a84ff)',
}

export interface PromptContentProps extends PromptOptions {
  onSubmit: (value: string) => void
  onCancel: () => void
}

/** Default UI used by `island.prompt()`. */
export function PromptContent({
  title,
  description,
  icon,
  label,
  placeholder,
  defaultValue = '',
  type = 'text',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onSubmit,
  onCancel,
}: PromptContentProps) {
  const id = useId()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const value = new FormData(e.currentTarget).get('value')
        onSubmit(typeof value === 'string' ? value : '')
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 260 }}
    >
      <Header icon={icon} title={title} description={description} />
      <input
        id={id}
        name="value"
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={label ?? (typeof title === 'string' ? title : undefined)}
        data-island-input=""
        style={{
          font: 'inherit',
          fontSize: 14,
          color: 'inherit',
          padding: '10px 14px',
          borderRadius: 12,
          border: '1px solid var(--island-border, rgba(255, 255, 255, 0.18))',
          background: 'var(--island-muted, rgba(255, 255, 255, 0.08))',
          outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={buttonBase} data-island-cancel="">
          {cancelText}
        </button>
        <button type="submit" style={accentButton} data-island-confirm="">
          {confirmText}
        </button>
      </div>
    </form>
  )
}

export interface ChooseContentProps<T> extends ChooseOptions<T> {
  onChoose: (value: T) => void
  onCancel: () => void
}

/** Default UI used by `island.choose()`. */
export function ChooseContent<T>({
  title,
  description,
  icon,
  choices,
  cancelText = 'Cancel',
  onChoose,
  onCancel,
}: ChooseContentProps<T>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 260 }}>
      <Header icon={icon} title={title} description={description} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {choices.map((choice, i) => (
          <button
            // Choices are a fixed list for the life of the entry.
            // biome-ignore lint/suspicious/noArrayIndexKey: values may not be strings
            key={i}
            type="button"
            onClick={() => onChoose(choice.value)}
            data-island-choice=""
            style={
              choice.destructive
                ? { ...buttonBase, color: 'var(--island-danger, #ff453a)' }
                : buttonBase
            }
          >
            {choice.label}
          </button>
        ))}
        {cancelText !== null && (
          <button
            type="button"
            onClick={onCancel}
            data-island-cancel=""
            style={{ ...buttonBase, background: 'transparent', opacity: 0.7 }}
          >
            {cancelText}
          </button>
        )}
      </div>
    </div>
  )
}

/** A ring that fills from 0 to 1, in the island's text color. */
export function ProgressRing({ value, size = 18 }: { value: number; size?: number }) {
  const stroke = Math.max(2, size / 8)
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      data-island-progress=""
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - clamped)}
        style={{ transition: 'stroke-dashoffset 200ms ease-out' }}
      />
    </svg>
  )
}

/** A check mark in the island's text color. */
export function Check({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const secondsLeft = (end: number) => Math.max(0, Math.ceil((end - Date.now()) / 1000))

/** `m:ss` left until `endsAt`, ticking on its own. */
export function Countdown({ endsAt }: { endsAt: number }) {
  const [seconds, setSeconds] = useState(() => secondsLeft(endsAt))
  useEffect(() => {
    const tick = setInterval(() => setSeconds(secondsLeft(endsAt)), 250)
    return () => clearInterval(tick)
  }, [endsAt])
  return (
    <span data-island-countdown="" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {Math.floor(seconds / 60)}:{pad(seconds % 60)}
    </span>
  )
}
