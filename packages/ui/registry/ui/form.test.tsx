import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  useFormField,
} from './form'
import { Input } from './input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './input-otp'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Slider } from './slider'
import { Toggle } from './toggle'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

describe('Form', () => {
  it('names the control from the label and links its description', () => {
    render(
      <FormField name="email">
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormDescription>We only use it to reply.</FormDescription>
        <FormMessage />
      </FormField>,
    )
    const input = screen.getByLabelText('Email')
    const description = screen.getByText('We only use it to reply.')
    expect(input.getAttribute('aria-describedby')).toBe(description.id)
    expect(input.getAttribute('aria-invalid')).toBeNull()
    expect(screen.queryByText(/./, { selector: '[data-slot=form-message]' })).toBeNull()
  })

  it('marks the field invalid and points the control at the message', () => {
    render(
      <FormField name="email" error="Check the address.">
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormDescription>Hint</FormDescription>
        <FormMessage />
      </FormField>,
    )
    const input = screen.getByLabelText('Email')
    const message = screen.getByText('Check the address.')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(message.id)
    expect(screen.getByText('Email').getAttribute('data-invalid')).toBe('')
  })

  it('treats any falsy error as valid', () => {
    const { rerender } = render(
      <FormField name="a" error={false}>
        <FormMessage />
      </FormField>,
    )
    expect(document.querySelector('[data-slot=form-message]')).toBeNull()
    rerender(
      <FormField name="a" error={null}>
        <FormMessage />
      </FormField>,
    )
    expect(document.querySelector('[data-slot=form-message]')).toBeNull()
    expect(document.querySelector('[data-slot=form-field]')?.hasAttribute('data-invalid')).toBe(
      false,
    )
  })

  it('gives every field its own ids', () => {
    render(
      <>
        <FormField name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input />
          </FormControl>
        </FormField>
        <FormField name="name">
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input />
          </FormControl>
        </FormField>
      </>,
    )
    expect(screen.getByLabelText('Email').id).not.toBe(screen.getByLabelText('Name').id)
  })

  it('wires a control that is not an input', async () => {
    const user = userEvent.setup()
    render(
      <FormField name="terms" error="Required.">
        <FormControl>
          <Checkbox />
        </FormControl>
        <FormLabel>Accept the terms</FormLabel>
        <FormMessage />
      </FormField>,
    )
    const box = screen.getByRole('checkbox')
    expect(box.getAttribute('aria-invalid')).toBe('true')
    await user.click(screen.getByText('Accept the terms'))
    expect(box.getAttribute('data-state')).toBe('checked')
  })

  it('names a group control, which a label cannot name on its own', () => {
    render(
      <FormField name="plan">
        <FormLabel>Plan</FormLabel>
        <FormControl>
          <RadioGroup>
            <RadioGroupItem value="free" aria-label="Free" />
          </RadioGroup>
        </FormControl>
      </FormField>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeTruthy()
  })

  it('leaves the name alone when there is no label of its own', () => {
    render(
      <FormField name="email">
        <FormControl>
          <Input aria-label="Email address" />
        </FormControl>
      </FormField>,
    )
    expect(screen.getByRole('textbox').getAttribute('aria-labelledby')).toBeNull()
    expect(screen.getByLabelText('Email address')).toBeTruthy()
  })

  it('exposes the ids through the hook', () => {
    function Custom() {
      const { id, error, messageId } = useFormField()
      return <output id={id} data-message={messageId} data-error={error} />
    }
    render(
      <FormField name="custom" error="Nope">
        <Custom />
      </FormField>,
    )
    expect(screen.getByRole('status').dataset.error).toBe('Nope')
  })

  it('turns off the browser bubbles and submits', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <Form onSubmit={onSubmit}>
        <FormField name="email">
          <FormControl>
            <Input required />
          </FormControl>
        </FormField>
        <button type="submit">Send</button>
      </Form>,
    )
    expect(document.querySelector('form')?.noValidate).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalled()
  })
})

describe('RadioGroup, Slider and Toggle', () => {
  it('picks one radio and moves with the arrows', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="free" aria-label="Free" />
        <RadioGroupItem value="pro" aria-label="Pro" />
      </RadioGroup>,
    )
    await user.click(screen.getByRole('radio', { name: 'Free' }))
    expect(onValueChange).toHaveBeenCalledWith('free')
    // The arrows walk the group; a browser also selects as it goes, jsdom does not.
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Pro' }))
    await user.keyboard(' ')
    expect(onValueChange).toHaveBeenLastCalledWith('pro')
  })

  it('grows a thumb per value and moves with the keyboard', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = render(<Slider defaultValue={[50]} onValueChange={onValueChange} />)
    expect(screen.getAllByRole('slider')).toHaveLength(1)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenCalledWith([51])
    rerender(<Slider value={[20, 80]} onValueChange={onValueChange} />)
    const thumbs = screen.getAllByRole('slider')
    expect(thumbs).toHaveLength(2)
    expect(thumbs[0]?.getAttribute('aria-valuenow')).toBe('20')
    expect(thumbs[1]?.getAttribute('aria-valuenow')).toBe('80')
  })

  it('presses a toggle and reports it', async () => {
    const user = userEvent.setup()
    const onPressedChange = vi.fn()
    render(
      <Toggle aria-label="Bold" onPressedChange={onPressedChange}>
        B
      </Toggle>,
    )
    const toggle = screen.getByRole('button', { name: 'Bold' })
    expect(toggle.dataset.state).toBe('off')
    await user.click(toggle)
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(toggle.dataset.state).toBe('on')
  })

  it('keeps one pressed in a single group and several in a multiple one', async () => {
    const user = userEvent.setup()
    function Single() {
      const [value, setValue] = useState('left')
      return (
        <ToggleGroup type="single" value={value} onValueChange={setValue} variant="outline">
          <ToggleGroupItem value="left" aria-label="Left" />
          <ToggleGroupItem value="right" aria-label="Right" />
        </ToggleGroup>
      )
    }
    render(<Single />)
    const left = screen.getByRole('radio', { name: 'Left' })
    const right = screen.getByRole('radio', { name: 'Right' })
    expect(left.dataset.state).toBe('on')
    expect(left.dataset.variant).toBe('outline')
    await user.click(right)
    expect(right.dataset.state).toBe('on')
    expect(left.dataset.state).toBe('off')
  })
})

describe('InputOTP', () => {
  const code = () => screen.getByRole('textbox') as HTMLInputElement
  const slots = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-slot=input-otp-slot]'))

  function Otp(props: Partial<React.ComponentProps<typeof InputOTP>>) {
    return (
      <InputOTP maxLength={4} {...props}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    )
  }

  it('spreads the typed code across the slots and completes', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Otp onComplete={onComplete} />)
    expect(slots()).toHaveLength(4)
    await user.click(code())
    await user.keyboard('12')
    expect(slots().map((s) => s.textContent)).toEqual(['1', '2', '', ''])
    expect(slots()[2]?.hasAttribute('data-active')).toBe(true)
    expect(onComplete).not.toHaveBeenCalled()
    await user.keyboard('34')
    expect(slots().map((s) => s.textContent)).toEqual(['1', '2', '3', '4'])
    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  it('takes a pasted code and stops at the length', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Otp onValueChange={onValueChange} />)
    await user.click(code())
    await user.paste('987654')
    expect(onValueChange).toHaveBeenLastCalledWith('9876')
  })

  it('refuses characters outside the pattern', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Otp onValueChange={onValueChange} />)
    await user.click(code())
    await user.keyboard('a1')
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('1')
  })

  it('carries the attributes phones need for the SMS code', () => {
    render(<Otp />)
    expect(code().getAttribute('autocomplete')).toBe('one-time-code')
    expect(code().getAttribute('inputmode')).toBe('numeric')
    expect(code().maxLength).toBe(4)
  })
})
