import type { CSSProperties, HTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { useMap } from './map'
import type { LngLat } from './projection'

/** Placed at a coordinate, anchored by `transform`, hidden while the projection is unknown. */
function useAnchor(lngLat: LngLat, transform: string): CSSProperties {
  const [x, y] = useMap().project(lngLat)
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${x}px, ${y}px) ${transform}`,
    visibility: Number.isNaN(x) ? 'hidden' : undefined,
  }
}

const pin = (
  <svg width="27" height="41" viewBox="0 0 27 41" aria-hidden="true" style={{ display: 'block' }}>
    <path
      d="M13.5 1C6.6 1 1 6.6 1 13.5 1 23 13.5 40 13.5 40S26 23 26 13.5C26 6.6 20.4 1 13.5 1Z"
      fill="#e5484d"
      stroke="#fff"
      strokeWidth="2"
    />
    <circle cx="13.5" cy="13.5" r="4.5" fill="#fff" />
  </svg>
)

export interface MarkerProps {
  lngLat: LngLat
  /** The pin. Default a red drop. Its bottom center sits on the coordinate. */
  children?: ReactNode
  /** Makes the marker a button. */
  onClick?: MouseEventHandler<HTMLButtonElement>
  /** Accessible name of the button. */
  label?: string
  className?: string
  style?: CSSProperties
}

/** A pin at a coordinate. With `onClick` it is a button, else it lets the map be dragged through it. */
export function Marker({ lngLat, children = pin, onClick, label, className, style }: MarkerProps) {
  const anchor = { ...useAnchor(lngLat, 'translate(-50%, -100%)'), ...style }
  if (!onClick) {
    return (
      <div className={className} style={anchor}>
        {children}
      </div>
    )
  }
  return (
    <button
      type="button"
      data-map-overlay=""
      aria-label={label}
      onClick={onClick}
      className={className}
      style={{
        padding: 0,
        border: 0,
        background: 'none',
        cursor: 'pointer',
        pointerEvents: 'auto',
        ...anchor,
      }}
    >
      {children}
    </button>
  )
}

const card: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  background: '#fff',
  color: '#111',
  font: '14px/1.4 system-ui, sans-serif',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
}

export interface PopupProps extends HTMLAttributes<HTMLDivElement> {
  lngLat: LngLat
  /** Pixels between the coordinate and the popup's bottom edge. Default 44, above the default pin. */
  offset?: number
  /** Called on Escape, and by the close button it adds. */
  onClose?: () => void
  /** Accessible name of the close button. Default `'Close'`. */
  closeLabel?: string
}

/**
 * A box above a coordinate. Render it while it should be open. A `className` replaces its
 * default white card, so the look can come from your styles.
 */
export function Popup({
  lngLat,
  offset = 44,
  onClose,
  closeLabel = 'Close',
  className,
  style,
  children,
  onKeyDown,
  ...props
}: PopupProps) {
  const anchor = useAnchor(lngLat, `translate(-50%, calc(-100% - ${offset}px))`)
  return (
    <div
      role="dialog"
      data-map-overlay=""
      className={className}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.key === 'Escape' && onClose) {
          e.stopPropagation()
          onClose()
        }
      }}
      {...props}
      style={{
        ...(className ? null : card),
        ...anchor,
        pointerEvents: 'auto',
        userSelect: 'text',
        ...style,
      }}
    >
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          data-map-popup-close=""
          style={
            className
              ? undefined
              : {
                  float: 'right',
                  margin: '-4px -6px 0 8px',
                  padding: 0,
                  border: 0,
                  background: 'none',
                  font: 'inherit',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: 'inherit',
                }
          }
        >
          ×
        </button>
      )}
      {children}
    </div>
  )
}

export interface ZoomControlProps {
  /** Default `'Zoom in'`. */
  zoomInLabel?: string
  /** Default `'Zoom out'`. */
  zoomOutLabel?: string
  className?: string
  style?: CSSProperties
}

const zoomButton: CSSProperties = {
  display: 'block',
  width: 32,
  height: 32,
  border: 0,
  background: '#fff',
  color: '#111',
  font: '20px/1 system-ui, sans-serif',
  cursor: 'pointer',
}

/** Plus and minus buttons in the top right corner. A `className` replaces their default look. */
export function ZoomControl({
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  className,
  style,
}: ZoomControlProps) {
  const map = useMap()
  const look = className ? undefined : zoomButton
  return (
    <div
      data-map-overlay=""
      className={className}
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        pointerEvents: 'auto',
        ...(className
          ? null
          : { borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0, 0, 0, 0.3)' }),
        ...style,
      }}
    >
      <button
        type="button"
        aria-label={zoomInLabel}
        style={look}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) + 1 })}
      >
        +
      </button>
      <button
        type="button"
        aria-label={zoomOutLabel}
        style={look && { ...look, borderTop: '1px solid #ddd' }}
        onClick={() => map.setView({ zoom: Math.round(map.zoom) - 1 })}
      >
        −
      </button>
    </div>
  )
}
