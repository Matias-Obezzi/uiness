import { describe, expect, it } from 'vitest'
import { popupShift } from './overlays'

describe('popupShift', () => {
  it('leaves a popup that fits where it is', () => {
    expect(popupShift(200, 160, 400)).toBe(0)
  })

  it('slides a popup near a side back inside, 8px from it', () => {
    // Centered on 30, a 160px popup would start at -50.
    expect(popupShift(30, 160, 400)).toBe(58)
    // Centered on 380 it would end at 460.
    expect(popupShift(380, 160, 400)).toBe(-68)
  })

  it('does nothing before the popup or the map has a size', () => {
    expect(popupShift(10, 0, 400)).toBe(0)
    expect(popupShift(10, 160, 0)).toBe(0)
  })
})
