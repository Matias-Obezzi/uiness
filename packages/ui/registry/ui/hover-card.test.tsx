import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HoverCard, HoverCardContent, HoverCardTrigger, ProfileHoverCard } from './hover-card'

describe('HoverCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // Passing the pointer over a link on the way somewhere else must not pop a card up.
  it('opens after the open delay and closes after the close delay', () => {
    render(
      <HoverCard openDelay={300} closeDelay={100}>
        <HoverCardTrigger href="/ana">@ana</HoverCardTrigger>
        <HoverCardContent>Designer</HoverCardContent>
      </HoverCard>,
    )
    const trigger = screen.getByRole('link', { name: '@ana' })
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(200))
    expect(screen.queryByText('Designer')).toBeNull()
    act(() => vi.advanceTimersByTime(150))
    expect(screen.getByText('Designer')).toBeTruthy()

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByText('Designer')).toBeNull()
  })

  it('opens on keyboard focus', () => {
    render(
      <HoverCard>
        <HoverCardTrigger href="/ana">@ana</HoverCardTrigger>
        <HoverCardContent>Designer</HoverCardContent>
      </HoverCard>,
    )
    fireEvent.focus(screen.getByRole('link'))
    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByText('Designer')).toBeTruthy()
  })

  it('fills the profile preset', () => {
    render(
      <ProfileHoverCard
        defaultOpen
        name="Ana Lima"
        handle="@ana"
        description="Designs type."
        stats={[{ label: 'Followers', value: '12k' }]}
      >
        <a href="/ana">Ana</a>
      </ProfileHoverCard>,
    )
    expect(screen.getByText('Ana Lima')).toBeTruthy()
    expect(screen.getByText('AL')).toBeTruthy()
    expect(screen.getByText('Followers').tagName).toBe('DT')
    expect(screen.getByText('12k').tagName).toBe('DD')
  })
})
