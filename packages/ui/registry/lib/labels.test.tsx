import { render, renderHook, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { Paginator } from '@/components/ui/pagination'
import { type LabelsPack, LabelsProvider, useLabels, useLocale } from '@/lib/labels'
import { es } from '@/lib/labels-es'

interface DemoLabels {
  close: string
  next: string
  count: (n: number) => string
}

const defaults: DemoLabels = {
  close: 'Close',
  next: 'Next',
  count: (n) => `${n} items`,
}

const withProvider =
  (labels?: LabelsPack, locale?: string) =>
  ({ children }: { children: React.ReactNode }) => (
    <LabelsProvider labels={labels} locale={locale}>
      {children}
    </LabelsProvider>
  )

describe('useLabels', () => {
  it('returns the defaults themselves without a provider', () => {
    const { result } = renderHook(() => useLabels('demo', defaults))
    expect(result.current).toBe(defaults)
  })

  it('takes what the provider has for the component over the defaults', () => {
    const { result } = renderHook(() => useLabels('demo', defaults), {
      wrapper: withProvider({ demo: { close: 'Cerrar' }, other: { close: 'Nope' } }),
    })
    expect(result.current.close).toBe('Cerrar')
    expect(result.current.next).toBe('Next')
  })

  it('lets the prop win over the provider', () => {
    const { result } = renderHook(() => useLabels('demo', defaults, { close: 'Shut' }), {
      wrapper: withProvider({ demo: { close: 'Cerrar', next: 'Siguiente' } }),
    })
    expect(result.current.close).toBe('Shut')
    expect(result.current.next).toBe('Siguiente')
  })

  it('ignores undefined values', () => {
    const { result } = renderHook(() => useLabels('demo', defaults, { close: undefined }), {
      wrapper: withProvider({ demo: { next: undefined } }),
    })
    expect(result.current.close).toBe('Close')
    expect(result.current.next).toBe('Next')
  })

  it('merges nested providers component by component', () => {
    const Outer = withProvider({ demo: { close: 'Cerrar', next: 'Siguiente' }, x: { a: 1 } })
    const Inner = withProvider({ demo: { next: 'Próximo' } })
    const { result } = renderHook(() => [useLabels('demo', defaults), useLabels('x', {})], {
      wrapper: ({ children }) => (
        <Outer>
          <Inner>{children}</Inner>
        </Outer>
      ),
    })
    const [demo, x] = result.current
    expect(demo).toMatchObject({ close: 'Cerrar', next: 'Próximo' })
    expect(x).toEqual({ a: 1 })
  })

  it('takes functions for labels with numbers in them', () => {
    const { result } = renderHook(() => useLabels('demo', defaults), {
      wrapper: withProvider({ demo: { count: (n: number) => `${n} elementos` } }),
    })
    expect(result.current.count(3)).toBe('3 elementos')
  })
})

describe('useLocale', () => {
  it('is the prop, then the provider, then undefined', () => {
    expect(renderHook(() => useLocale()).result.current).toBeUndefined()
    expect(
      renderHook(() => useLocale(), { wrapper: withProvider({}, 'es-AR') }).result.current,
    ).toBe('es-AR')
    expect(
      renderHook(() => useLocale('fr'), { wrapper: withProvider({}, 'es-AR') }).result.current,
    ).toBe('fr')
  })

  it('is inherited by nested providers without one', () => {
    const Outer = withProvider({}, 'es')
    const Inner = withProvider({ demo: { close: 'x' } })
    const { result } = renderHook(() => useLocale(), {
      wrapper: ({ children }) => (
        <Outer>
          <Inner>{children}</Inner>
        </Outer>
      ),
    })
    expect(result.current).toBe('es')
  })
})

describe('LabelsProvider with a component', () => {
  it('translates a component with the Spanish pack', () => {
    render(
      <LabelsProvider labels={es}>
        <Paginator page={2} total={100} compact={false} />
      </LabelsProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ir a la página siguiente' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeTruthy()
  })

  it('lets the labels prop win over the pack', () => {
    render(
      <LabelsProvider labels={es}>
        <Paginator page={2} total={100} compact={false} labels={{ nextPage: 'Adelante' }} />
      </LabelsProvider>,
    )
    expect(screen.getByRole('button', { name: 'Adelante' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ir a la página anterior' })).toBeTruthy()
  })
})
