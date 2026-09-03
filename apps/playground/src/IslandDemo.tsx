import { Island, Spinner, type SpringPreset, useIsland } from '@uiness/island'
import { useEffect, useState } from 'react'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function Bell() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <title>bell</title>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  )
}

function Timer({ from }: { from: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])
  const s = Math.floor((now - from) / 1000)
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', color: '#ffd60a' }}>
      {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
    </span>
  )
}

function Player({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(true)
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 320, maxWidth: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #ff6b6b, #845ef7)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Midnight City</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>M83</div>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            border: 'none',
            background: 'rgba(255,255,255,0.14)',
            color: 'inherit',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {playing ? '❚❚' : '▶'}
        </button>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.14)' }}>
        <div style={{ width: '38%', height: '100%', borderRadius: 2, background: '#fff' }} />
      </div>
      <button
        type="button"
        onClick={onClose}
        style={{
          alignSelf: 'flex-end',
          background: 'none',
          border: 'none',
          color: 'inherit',
          opacity: 0.7,
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Close
      </button>
    </div>
  )
}

export function IslandDemo() {
  const island = useIsland()
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const [spring, setSpring] = useState<SpringPreset>('bouncy')
  const [hideIdle, setHideIdle] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const note = (line: string) => setLog((l) => [line, ...l].slice(0, 8))

  const startUpload = async () => {
    const handle = island.show({
      id: 'upload',
      leading: <Spinner />,
      trailing: <span style={{ fontVariantNumeric: 'tabular-nums' }}>0%</span>,
    })
    for (let p = 5; p <= 100; p += 5) {
      await wait(120)
      handle.update({
        trailing: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p}%</span>,
      })
    }
    handle.update({
      leading: <span style={{ color: '#30d158' }}>✓</span>,
      trailing: 'Uploaded',
      duration: 2000,
    })
  }

  return (
    <>
      <Island
        position={position}
        spring={spring}
        idle={hideIdle ? false : undefined}
        style={{ '--island-accent': '#0a84ff' } as React.CSSProperties}
      />
      <h1>@uiness/island playground</h1>
      <div className="controls">
        <label>
          position
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'top' | 'bottom')}
          >
            <option value="top">top</option>
            <option value="bottom">bottom</option>
          </select>
        </label>
        <label>
          spring
          <select value={spring} onChange={(e) => setSpring(e.target.value as SpringPreset)}>
            <option value="smooth">smooth</option>
            <option value="bouncy">bouncy</option>
            <option value="stiff">stiff</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={hideIdle}
            onChange={(e) => setHideIdle(e.target.checked)}
          />
          hide when idle
        </label>
      </div>

      <div className="buttons">
        <button type="button" onClick={startUpload}>
          Upload (compact, live update)
        </button>
        <button
          type="button"
          onClick={() =>
            island.show({
              id: 'call',
              leading: <span style={{ color: '#30d158' }}>●</span>,
              trailing: <Timer from={Date.now()} />,
            })
          }
        >
          Call timer (persistent)
        </button>
        <button
          type="button"
          onClick={() =>
            island.promise(
              wait(1500).then(() => 'report.pdf'),
              {
                loading: { leading: <Spinner />, trailing: 'Exporting' },
                success: (name) => ({ leading: '✓', trailing: `Saved ${name}` }),
              },
            )
          }
        >
          Promise (export)
        </button>
        <button
          type="button"
          onClick={() =>
            island.promise(
              wait(1200).then(() => Promise.reject(new Error('Offline'))),
              {
                loading: { leading: <Spinner />, trailing: 'Syncing' },
                error: (e) => ({ leading: '⚠', trailing: (e as Error).message }),
              },
            )
          }
        >
          Promise (fails)
        </button>
        <button
          type="button"
          onClick={async () => {
            const ok = await island.confirm({
              title: 'Delete 3 photos?',
              description: 'They will be removed from all your devices.',
              confirmText: 'Delete',
              destructive: true,
            })
            note(`confirm → ${ok}`)
          }}
        >
          Confirm (destructive)
        </button>
        <button
          type="button"
          onClick={() =>
            island.alert({
              title: 'AirPods Pro',
              description: 'Connected, battery 82%',
              icon: <Bell />,
            })
          }
        >
          Alert (expanded)
        </button>
        <button
          type="button"
          onClick={() =>
            island.alert({ title: 'Copied to clipboard', icon: '📋', mode: 'compact' })
          }
        >
          Alert (compact)
        </button>
        <button
          type="button"
          onClick={() => {
            const handle = island.show({
              id: 'player',
              content: <Player onClose={() => handle.dismiss()} />,
              role: 'dialog',
            })
          }}
        >
          Player (expanded, custom)
        </button>
        <button type="button" onClick={() => island.dismiss()}>
          Dismiss top
        </button>
        <button type="button" onClick={() => island.dismissAll()}>
          Dismiss all
        </button>
      </div>

      <div className="hook-demo">
        <h2>log</h2>
        <pre>{log.join('\n') || '—'}</pre>
      </div>
      <p style={{ opacity: 0.6, fontSize: 13, maxWidth: 560 }}>
        Stack semantics: start the call timer, then open the player or a confirm. When the top entry
        closes, the timer comes back. Escape and clicking outside close expanded entries. Hover
        pauses auto dismiss.
      </p>
    </>
  )
}
