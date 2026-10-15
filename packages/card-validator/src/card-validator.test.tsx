import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { binOf, type CardInfo, cardBrand, createCardHandler, lookupBin, validateCard } from '.'
import { useCardInfo } from './react'

afterEach(() => vi.unstubAllGlobals())

describe('validateCard', () => {
  const now = new Date(2026, 9, 15)

  it('takes a well formed card', () => {
    expect(
      validateCard({ number: '4242 4242 4242 4242', expiry: '08/30', cvc: '123' }, now),
    ).toEqual({ brand: 'visa', valid: true, errors: {} })
  })

  it('says what is wrong with each field', () => {
    const check = validateCard({ number: '378282246310005', expiry: '09/26', cvc: '123' }, now)
    expect(check).toEqual({
      brand: 'amex',
      valid: false,
      errors: { expiry: 'expired', cvc: 'invalid' },
    })
    expect(validateCard({ number: '4242424242424241' }).errors).toEqual({ number: 'invalid' })
  })

  it('takes local brands it has no rule for, by their Luhn digit', () => {
    // 6042 is Cabal's, an Argentine network with no rule here: still a card.
    expect(cardBrand('6042010000000006')).toBe('unknown')
    expect(validateCard({ number: '6042010000000006' }).valid).toBe(true)
  })

  it('gives the BIN only once there are 6 digits', () => {
    expect(binOf('4242 4')).toBeNull()
    expect(binOf('4242 4242 4242 4242')).toBe('424242')
  })
})

describe('lookupBin', () => {
  it("maps binlist's answer", async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        scheme: 'mastercard',
        type: 'debit',
        brand: 'World Debit Embossed',
        prepaid: false,
        bank: { name: 'Riyad Bank' },
        country: { name: 'Saudi Arabia', alpha2: 'SA' },
      }),
    )
    vi.stubGlobal('fetch', fetch)
    expect(await lookupBin('536023')).toEqual({
      bin: '536023',
      scheme: 'mastercard',
      type: 'debit',
      prepaid: false,
      product: 'World Debit Embossed',
      bank: 'Riyad Bank',
      country: 'Saudi Arabia',
      countryCode: 'SA',
    })
    expect(fetch).toHaveBeenCalledWith('https://lookup.binlist.net/536023', expect.anything())
  })
})

describe('createCardHandler', () => {
  const info: CardInfo = { bin: '424242', scheme: 'visa', bank: 'Test Bank' }
  const get = (handler: (r: Request) => Promise<Response>, bin: string) =>
    handler(new Request(`https://example.test/api/card?bin=${bin}`))

  it('answers from the lookup once per BIN, cached', async () => {
    const lookup = vi.fn(async () => info)
    const handler = createCardHandler({ lookup })
    const first = await get(handler, '424242')
    await get(handler, '424242')
    expect(await first.json()).toEqual(info)
    expect(first.headers.get('Cache-Control')).toMatch(/s-maxage=604800/)
    expect(lookup).toHaveBeenCalledTimes(1)
  })

  it('refuses anything but 6 to 8 digits, a full number most of all', async () => {
    const lookup = vi.fn(async () => info)
    const handler = createCardHandler({ lookup })
    expect((await get(handler, '4242424242424242')).status).toBe(400)
    expect((await get(handler, '4242')).status).toBe(400)
    expect(lookup).not.toHaveBeenCalled()
  })

  it('says 404 for an unknown BIN, and does not keep a failed lookup', async () => {
    const lookup = vi.fn<(bin: string) => Promise<CardInfo | null>>()
    lookup
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue(info)
    const handler = createCardHandler({ lookup })
    expect((await get(handler, '999999')).status).toBe(404)
    const failed = await get(handler, '424242')
    expect(failed.status).toBe(502)
    expect(failed.headers.get('Cache-Control')).toBe('no-store')
    expect((await get(handler, '424242')).status).toBe(200)
  })
})

describe('useCardInfo', () => {
  it('asks the endpoint for the first 6 digits only, and drops an answer for other digits', async () => {
    const fetch = vi.fn(async (url: string) =>
      Response.json({ bin: url.slice(-6), bank: 'Test Bank' }),
    )
    vi.stubGlobal('fetch', fetch)
    const { result, rerender } = renderHook(({ number }) => useCardInfo(number), {
      initialProps: { number: '42424' },
    })
    expect(result.current).toBeNull()
    rerender({ number: '4242424242424242' })
    await waitFor(() => expect(result.current?.bank).toBe('Test Bank'))
    expect(fetch).toHaveBeenCalledWith('/api/card?bin=424242')
    rerender({ number: '5555' })
    expect(result.current).toBeNull()
  })
})
