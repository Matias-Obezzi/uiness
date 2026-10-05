import { FormControl, FormDescription, FormField, FormLabel } from '@/ui/form'
import { TagInput } from '@/ui/tag-input'

export default function TagInputValidate() {
  return (
    <FormField name="invite" className="w-full max-w-sm">
      <FormLabel>Invite people</FormLabel>
      <FormControl>
        <TagInput
          name="invite"
          max={5}
          placeholder="name@example.com"
          validate={(tag) => /^\S+@\S+\.\S+$/.test(tag) || `${tag} is not an email address.`}
        />
      </FormControl>
      <FormDescription>Up to five addresses.</FormDescription>
    </FormField>
  )
}
