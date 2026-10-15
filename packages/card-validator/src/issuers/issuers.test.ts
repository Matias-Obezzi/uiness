import { describe, expect, it } from 'vitest'
import { createCardHandler } from '../lookup'
import { findIssuer, type Issuer, issuers } from '.'
import { ar } from './ar'
import { br } from './br'
import { global } from './global'

// What every entry sent in a pull request has to pass.
describe('the issuer list', () => {
  it.each(issuers.map((issuer) => [issuer.id, issuer] as const))(
    '%s is well formed',
    (_, issuer) => {
      expect(issuer.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(issuer.name.trim()).toBe(issuer.name)
      expect(issuer.name).not.toBe('')
      // Colors as #rrggbb, or a gradient of them, so they work in any CSS.
      expect(issuer.background).toMatch(/^(#[0-9a-f]{6}|linear-gradient\([^;{}]+\))$/)
      expect(issuer.foreground).toMatch(/^#[0-9a-f]{6}$/)
      if (issuer.icon) expect(issuer.icon).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/)
      if (issuer.website) expect(issuer.website).toMatch(/^https:\/\/[^\s]+$/)
      for (const code of issuer.countries ?? []) expect(code).toMatch(/^[A-Z]{2}$/)
      for (const bin of issuer.bins ?? []) expect(bin).toMatch(/^\d{4,8}$/)
      // A pattern that matches anything would take every card.
      expect(issuer.match.test('')).toBe(false)
      expect(issuer.match.test('Bank')).toBe(false)
    },
  )

  it('has unique ids, and each file is sorted by id', () => {
    expect(new Set(issuers.map((i) => i.id)).size).toBe(issuers.length)
    for (const file of [ar, br, global]) {
      const ids = file.map((i) => i.id)
      expect(ids).toEqual([...ids].sort())
    }
  })
})

describe('findIssuer', () => {
  it('matches the name a lookup gives, in the countries the entry names', () => {
    expect(
      findIssuer({ bin: '450799', bank: 'BANCO DE GALICIA Y BUENOS AIRES', countryCode: 'AR' })?.id,
    ).toBe('galicia')
    expect(findIssuer({ bin: '450799', bank: 'Banco de Galicia', countryCode: 'ES' })).toBeNull()
    expect(findIssuer({ bin: '450799', bank: 'Banco Santander Rio', countryCode: 'AR' })?.id).toBe(
      'santander',
    )
    expect(findIssuer({ bin: '536023', bank: 'Riyad Bank', countryCode: 'SA' })).toBeNull()
  })

  it('takes a listed BIN first, and your own entries before the list', () => {
    const mine: Issuer = {
      id: 'mine',
      name: 'Mine',
      match: /mine/i,
      bins: ['4242'],
      background: '#000000',
      foreground: '#ffffff',
    }
    expect(findIssuer({ bin: '424242', bank: 'Santander' }, [mine, ...issuers])?.id).toBe('mine')
  })
})

describe('createCardHandler with the list', () => {
  it('adds the brand, without how it was matched', async () => {
    const handler = createCardHandler({
      lookup: async (bin) => ({ bin, bank: 'MERCADOLIBRE S.R.L.', countryCode: 'AR' }),
    })
    const body = await (await handler(new Request('https://x.test/api/card?bin=531234'))).json()
    expect(body.issuer).toEqual({
      id: 'mercado-pago',
      name: 'Mercado Pago',
      background: '#009ee3',
      foreground: '#ffffff',
      website: 'https://www.mercadopago.com.ar',
    })
  })

  it('answers a listed BIN the lookup does not know', async () => {
    const mine: Issuer = {
      id: 'mine',
      name: 'Mine',
      match: /mine/i,
      bins: ['4242'],
      background: '#000000',
      foreground: '#ffffff',
    }
    const handler = createCardHandler({ lookup: async () => null, issuers: [mine] })
    const response = await handler(new Request('https://x.test/api/card?bin=424242'))
    expect(response.status).toBe(200)
    expect((await response.json()).issuer.name).toBe('Mine')
  })
})
