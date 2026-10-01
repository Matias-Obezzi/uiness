import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  defineTours,
  Tour,
  type TourOptions,
  TourProvider,
  type TourProviderProps,
  type TourStep,
  useTour,
} from './tour'

const search: TourStep = {
  id: 'search',
  target: '[data-tour="search"]',
  title: 'Search',
  content: 'Find anything.',
}
const create: TourStep = {
  id: 'create',
  target: '[data-tour="create"]',
  title: 'Create',
  content: 'Start a project.',
}
const profile: TourStep = { id: 'profile', target: '[data-tour="profile"]', title: 'Profile' }
const steps = [search, create, profile]

let controls: ReturnType<typeof useTour>

function Page({ start }: { start?: () => void }) {
  controls = useTour()
  return (
    <div>
      <input data-tour="search" aria-label="Search" />
      <button type="button" data-tour="create">
        New
      </button>
      <span data-tour="profile">Me</span>
      <button type="button" onClick={start}>
        Start
      </button>
    </div>
  )
}

function setup(props: Partial<TourProviderProps> = {}, options?: TourOptions) {
  const tours = defineTours({ onboarding: steps, ...props.tours })
  function Starter() {
    const tour = useTour()
    return <Page start={() => tour.start('onboarding', options)} />
  }
  return render(
    <TourProvider {...props} tours={tours}>
      <Starter />
    </TourProvider>,
  )
}

const card = () => screen.findByRole('dialog')
const progress = () => document.querySelector('[data-slot=tour-progress]')?.textContent

describe('Tour', () => {
  it('starts a tour declared by name from anywhere below the provider', async () => {
    const onStepChange = vi.fn()
    setup({ onStepChange })
    await userEvent.click(screen.getByText('Start'))

    const dialog = await card()
    expect(dialog.getAttribute('data-slot')).toBe('tour-card')
    expect(screen.getByRole('dialog', { name: 'Search' })).toBe(dialog)
    expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('Find anything.').id)
    expect(progress()).toBe('1 of 3')
    expect(controls).toMatchObject({ active: true, tour: 'onboarding', index: 0, total: 3 })
    expect(onStepChange).toHaveBeenCalledWith({
      tour: 'onboarding',
      step: search,
      index: 0,
      total: 3,
    })
    expect(document.querySelector('[data-slot=tour-overlay]')).toBeTruthy()
  })

  it('moves forward and back, and stops without firing events', async () => {
    const onSkip = vi.fn()
    const onComplete = vi.fn()
    setup({ onSkip, onComplete })
    await userEvent.click(screen.getByText('Start'))
    await card()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect((await screen.findByRole('dialog', { name: 'Create' })).textContent).toContain('2 of 3')

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    await screen.findByRole('dialog', { name: 'Search' })
    expect(controls.index).toBe(0)

    act(() => controls.stop())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.querySelector('[data-slot=tour-overlay]')).toBeNull()
    expect(controls.active).toBe(false)
    expect(onSkip).not.toHaveBeenCalled()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('fires onComplete when Done is pressed on the last step', async () => {
    const onComplete = vi.fn()
    setup({ onComplete })
    await userEvent.click(screen.getByText('Start'))
    await card()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('dialog', { name: 'Create' })
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('dialog', { name: 'Profile' })
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0]?.[0]).toMatchObject({ step: profile, index: 2, total: 3 })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('leaves out the steps whose `when` returns false', async () => {
    const isAdmin = false
    setup({
      tours: {
        onboarding: [
          search,
          { ...create, when: () => isAdmin },
          { ...profile, when: () => !isAdmin },
        ],
      },
    })
    await userEvent.click(screen.getByText('Start'))
    await card()
    expect(progress()).toBe('1 of 2')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('dialog', { name: 'Profile' })).toBeTruthy()
    expect(progress()).toBe('2 of 2')
  })

  it('skips steps whose target is not in the page', async () => {
    setup({
      tours: {
        onboarding: [
          { id: 'gone', target: '[data-tour="gone"]', title: 'Gone' },
          search,
          { id: 'gone-too', target: () => null, title: 'Gone too' },
          profile,
        ],
      },
    })
    await userEvent.click(screen.getByText('Start'))
    expect((await card()).textContent).toContain('Search')
    expect(progress()).toBe('1 of 2')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('dialog', { name: 'Profile' })).toBeTruthy()
  })

  it('centers a step with no target, or a missing one when skipMissing is off', async () => {
    setup({
      skipMissing: false,
      tours: {
        onboarding: [
          { id: 'welcome', title: 'Welcome' },
          { id: 'gone', target: '[data-tour="gone"]', title: 'Gone' },
        ],
      },
    })
    await userEvent.click(screen.getByText('Start'))
    expect((await card()).hasAttribute('data-centered')).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    const gone = await screen.findByRole('dialog', { name: 'Gone' })
    expect(gone.hasAttribute('data-centered')).toBe(true)
    expect(progress()).toBe('2 of 2')
  })

  it('skips on Escape and on the close button', async () => {
    const onSkip = vi.fn()
    setup({ onSkip })
    await userEvent.click(screen.getByText('Start'))
    await card()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByRole('dialog', { name: 'Create' })

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onSkip.mock.calls[0]?.[0]).toMatchObject({ step: create, index: 1 })

    await userEvent.click(screen.getByText('Start'))
    await card()
    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onSkip).toHaveBeenCalledTimes(2)
  })

  it('moves focus into the card, follows the arrow keys and gives focus back at the end', async () => {
    setup()
    const starter = screen.getByText('Start')
    await userEvent.click(starter)
    await card()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next' }))

    await userEvent.keyboard('{ArrowRight}')
    await screen.findByRole('dialog', { name: 'Create' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next' }))
    await userEvent.keyboard('{ArrowLeft}')
    await screen.findByRole('dialog', { name: 'Search' })

    await userEvent.keyboard('{Escape}')
    await act(() => new Promise((r) => setTimeout(r, 20)))
    expect(document.activeElement).toBe(starter)
  })

  it('starts at a given position or step id', async () => {
    setup({}, { startAt: 'profile' })
    await userEvent.click(screen.getByText('Start'))
    expect((await card()).textContent).toContain('Profile')
    expect(progress()).toBe('3 of 3')

    act(() => controls.start(steps, { startAt: 1 }))
    expect(await screen.findByRole('dialog', { name: 'Create' })).toBeTruthy()
    expect(controls.tour).toBeUndefined()
  })

  it('blocks the page, or lets clicks reach the target with allowInteraction', async () => {
    setup()
    await userEvent.click(screen.getByText('Start'))
    await card()
    expect(document.querySelector('[data-slot=tour-blocker]')).toBeTruthy()
    act(() => controls.stop())

    act(() => controls.start('onboarding', { allowInteraction: true }))
    await card()
    expect(document.querySelector('[data-slot=tour-blocker]')).toBeNull()
  })

  it('runs as a declarative component driven by open', async () => {
    const onOpenChange = vi.fn()
    const onComplete = vi.fn()
    function Controlled() {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <input data-tour="search" aria-label="Search" />
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Tour
            steps={[search]}
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next)
              setOpen(next)
            }}
            onComplete={onComplete}
          />
        </>
      )
    }
    render(<Controlled />)
    expect(screen.queryByRole('dialog')).toBeNull()
    await userEvent.click(screen.getByText('Open'))
    await card()
    expect(progress()).toBe('1 of 1')

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Page />)).toThrow('useTour must be used inside <TourProvider>.')
    vi.restoreAllMocks()
  })
})
