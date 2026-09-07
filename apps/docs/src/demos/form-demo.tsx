import { useState } from 'react'
import { Button } from '@/ui/button'
import { Form, FormControl, FormDescription, FormField, FormLabel, FormMessage } from '@/ui/form'
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'

interface Errors {
  email?: string
  message?: string
}

export default function FormDemo() {
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '')
    const message = String(data.get('message') ?? '')
    const next: Errors = {}
    if (!email.includes('@')) next.email = 'That does not look like an email address.'
    if (message.length < 10) next.message = 'Tell us a little more, at least ten characters.'
    setErrors(next)
    setSent(Object.keys(next).length === 0)
  }

  return (
    <Form onSubmit={onSubmit} className="w-full max-w-sm">
      <FormField name="email" error={errors.email} required>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input name="email" type="email" placeholder="ada@example.com" />
        </FormControl>
        <FormDescription>We only use it to reply.</FormDescription>
        <FormMessage />
      </FormField>

      <FormField name="message" error={errors.message} required>
        <FormLabel>Message</FormLabel>
        <FormControl>
          <Textarea name="message" rows={3} placeholder="What is on your mind?" />
        </FormControl>
        <FormMessage />
      </FormField>

      <div className="flex items-center gap-3">
        <Button type="submit">Send</Button>
        {sent && <p className="text-muted-foreground text-sm">Sent. Thanks.</p>}
      </div>
    </Form>
  )
}
