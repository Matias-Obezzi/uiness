import { useState } from 'react'
import { Checkbox } from '@/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'

const people = [
  'Aaron Feld',
  'Bianca Rossi',
  'Carlos Mendes',
  'Dalia Saleh',
  'Eitan Levi',
  'Farah Iqbal',
  'Gustav Berg',
  'Helena Kovač',
  'Ivo Petrov',
  'Jia Wen',
  'Kalani Akana',
  'Lorenzo Gallo',
].map((name, i) => ({
  id: `u${i + 1}`,
  name,
  email: `${name.split(' ')[0]?.toLowerCase()}@example.com`,
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
}))

export default function TableSticky() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(['u2', 'u3']))
  const all = selected.size === people.length
  const some = selected.size > 0 && !all

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <Table containerClassName="max-h-72 max-w-2xl">
      <TableHeader sticky>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              aria-label="Select all"
              checked={all ? true : some ? 'indeterminate' : false}
              onCheckedChange={() =>
                setSelected(all ? new Set() : new Set(people.map((p) => p.id)))
              }
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.id} data-state={selected.has(person.id) ? 'selected' : undefined}>
            <TableCell>
              <Checkbox
                aria-label={`Select ${person.name}`}
                checked={selected.has(person.id)}
                onCheckedChange={() => toggle(person.id)}
              />
            </TableCell>
            <TableCell className="font-medium">{person.name}</TableCell>
            <TableCell className="text-muted-foreground">{person.email}</TableCell>
            <TableCell>{person.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
