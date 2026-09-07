'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/ui/label'

interface FormFieldContextValue {
  /** Name of the field, used for the generated ids. */
  name: string
  /** Id of the control itself. */
  id: string
  descriptionId: string
  messageId: string
  labelId: string
  error?: string
  /** True once a FormLabel is on screen, so the control can point at it. */
  labelled: boolean
  setLabelled: (labelled: boolean) => void
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

/**
 * The ids and error of the field around it. Use it to wire a control this component
 * does not know how to clone.
 */
function useFormField() {
  const ctx = React.useContext(FormFieldContext)
  if (!ctx) throw new Error('Form parts must be rendered inside <FormField>')
  return ctx
}

/**
 * A plain `<form>`. Nothing is required from it, every field works on its own, but it
 * turns off the browser's own bubbles so the messages you write are the ones shown.
 */
function Form({ className, noValidate = true, ...props }: React.ComponentProps<'form'>) {
  return (
    <form
      data-slot="form"
      noValidate={noValidate}
      className={cn('space-y-6', className)}
      {...props}
    />
  )
}

export interface FormFieldProps extends React.ComponentProps<'div'> {
  /** Field name. Also the base for the generated ids. */
  name: string
  /**
   * The message to show. Any falsy value means the field is valid, so
   * `errors.email?.message` from a form library, a zod issue or your own string all work.
   */
  error?: string | null | false
  /** Mark the control required, for assistive tech and the label's mark. */
  required?: boolean
  disabled?: boolean
}

/**
 * One field: it hands its children the ids, the error and the ARIA wiring, so the label
 * points at the control and the control points back at its description and its message.
 */
function FormField({
  name,
  error,
  required,
  disabled,
  className,
  children,
  ...props
}: FormFieldProps) {
  const uid = React.useId()
  const [labelled, setLabelled] = React.useState(false)
  const value = React.useMemo<FormFieldContextValue>(() => {
    const id = `${uid}-${name}`
    return {
      name,
      id,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
      labelId: `${id}-label`,
      error: error || undefined,
      labelled,
      setLabelled,
    }
  }, [uid, name, error, labelled])

  return (
    <FormFieldContext.Provider value={value}>
      <div
        data-slot="form-field"
        data-invalid={error ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-required={required ? '' : undefined}
        className={cn('group/field flex flex-col gap-2', className)}
        {...props}
      >
        {children}
      </div>
    </FormFieldContext.Provider>
  )
}

/** The label. Points at the control and turns red when the field is invalid. */
function FormLabel({ className, children, ...props }: React.ComponentProps<typeof Label>) {
  const { id, error, name, labelId, setLabelled } = useFormField()
  React.useEffect(() => {
    setLabelled(true)
    return () => setLabelled(false)
  }, [setLabelled])
  return (
    <Label
      data-slot="form-label"
      data-invalid={error ? '' : undefined}
      id={labelId}
      htmlFor={id}
      className={cn(
        // The mark comes from CSS, so it never lands in the control's accessible name.
        "data-[invalid]:text-destructive group-data-[required]/field:after:ml-0.5 group-data-[required]/field:after:text-destructive group-data-[required]/field:after:content-['*']",
        className,
      )}
      {...props}
    >
      {children ?? name}
    </Label>
  )
}

/**
 * Wraps the control and hands it the id, its name, `aria-describedby` and `aria-invalid`.
 * Takes exactly one child, which can be any input, a Radix trigger or your own component,
 * as long as it forwards its props to a DOM node.
 */
function FormControl(props: React.ComponentProps<typeof Slot.Root>) {
  const { id, error, descriptionId, messageId, labelId, labelled } = useFormField()
  return (
    <Slot.Root
      data-slot="form-control"
      id={id}
      // `htmlFor` only names elements a label can name, so a group like a radio group or
      // a slider gets its name from here instead.
      aria-labelledby={labelled ? labelId : undefined}
      aria-describedby={error ? `${descriptionId} ${messageId}` : descriptionId}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  )
}

/** The hint under a control. Read out after the label. */
function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { descriptionId } = useFormField()
  return (
    <p
      data-slot="form-description"
      id={descriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

/**
 * The error. Renders nothing when the field is valid, so you can leave it in place.
 * Falls back to its children when there is no error, for a message you control.
 */
function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, messageId } = useFormField()
  const body = error ?? children
  if (!body) return null
  return (
    <p
      data-slot="form-message"
      id={messageId}
      className={cn('font-medium text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export { Form, FormControl, FormDescription, FormField, FormLabel, FormMessage, useFormField }
