'use client'

import { ArrowUpRightIcon, AtSignIcon, GlobeIcon, type LucideIcon, MailIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { cn } from '@/lib/utils'

export interface TeamLink {
  /** Read by screen readers and shown as a tooltip, like "Email Ana". */
  label: string
  href: string
  /** `mail`, `web` or `social`, for the icon. Default `web`. */
  kind?: 'mail' | 'web' | 'social'
}

export interface TeamMember {
  name: string
  role: string
  /** A square photo. Without one, the initials stand in. */
  photo?: string
  bio?: string
  links?: TeamLink[]
}

export interface Team01Props extends Omit<React.ComponentProps<'section'>, 'title'> {
  /** The small line above the heading. `null` hides it. */
  eyebrow?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  members?: TeamMember[]
  /** A card after the team, like "We are hiring". `null` hides it. */
  hiring?: { title: string; description: string; action: { label: string; href: string } } | null
}

const icons: Record<NonNullable<TeamLink['kind']>, LucideIcon> = {
  mail: MailIcon,
  web: GlobeIcon,
  social: AtSignIcon,
}

const defaultMembers: TeamMember[] = [
  {
    name: 'Ana Ruiz',
    role: 'Co-founder, product',
    photo: '/img/gallery-1.png',
    bio: 'Spent ten years planning other people’s weeks before building the tool she wanted.',
    links: [
      { label: 'Email Ana', href: 'mailto:ana@example.com', kind: 'mail' },
      { label: 'Ana on social', href: '#', kind: 'social' },
    ],
  },
  {
    name: 'Tom Becker',
    role: 'Co-founder, engineering',
    photo: '/img/gallery-2.png',
    bio: 'Makes sync boring, which is the highest compliment sync can get.',
    links: [
      { label: 'Email Tom', href: 'mailto:tom@example.com', kind: 'mail' },
      { label: 'Tom’s site', href: '#', kind: 'web' },
    ],
  },
  {
    name: 'Priya Natarajan',
    role: 'Design',
    photo: '/img/gallery-3.png',
    bio: 'Removes one button from every screen she touches.',
    links: [{ label: 'Priya on social', href: '#', kind: 'social' }],
  },
  {
    name: 'Leo Martins',
    role: 'Mobile',
    photo: '/img/gallery-4.png',
    bio: 'Ships the phone app and refuses to let it feel like a smaller website.',
    links: [{ label: 'Leo’s site', href: '#', kind: 'web' }],
  },
  {
    name: 'Sara Okafor',
    role: 'Customer success',
    photo: '/img/gallery-5.png',
    bio: 'Answers the support inbox, then makes sure the question never comes again.',
    links: [{ label: 'Email Sara', href: 'mailto:sara@example.com', kind: 'mail' }],
  },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

/**
 * The people behind the product: a photo, name, role and a line about each, with their links,
 * in a grid that goes from one to four columns as the container widens. An optional hiring
 * card takes the next cell.
 */
function Team01({
  eyebrow = 'Team',
  title = 'Small team, long weeks planned',
  description = 'Five people, three time zones, one shared calendar.',
  members = defaultMembers,
  hiring = {
    title: 'We are hiring',
    description: 'Two roles open, both remote. Come plan with us.',
    action: { label: 'See open roles', href: '#' },
  },
  className,
  ...props
}: Team01Props) {
  const headingId = React.useId()
  return (
    <section
      data-slot="block-team-01"
      aria-labelledby={headingId}
      className={cn('@container relative w-full', className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 @3xl:py-24">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-eyebrow text-primary uppercase">{eyebrow}</p>}
          <h2 id={headingId} className="text-balance text-title">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-pretty text-lead text-muted-foreground">{description}</p>
          )}
        </div>

        <Reveal
          stagger={80}
          className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4"
        >
          {members.map((member) => (
            <article key={member.name} className="group flex flex-col">
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0 motion-reduce:transition-none"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex size-full items-center justify-center font-semibold text-4xl text-muted-foreground"
                  >
                    {initials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-subheading">{member.name}</h3>
              <p className="text-primary text-sm">{member.role}</p>
              {member.bio && (
                <p className="mt-2 text-pretty text-muted-foreground text-sm">{member.bio}</p>
              )}
              {member.links && member.links.length > 0 && (
                <ul className="mt-3 flex gap-1">
                  {member.links.map((link) => {
                    const Icon = icons[link.kind ?? 'web']
                    return (
                      <li key={link.href + link.label}>
                        <Button asChild variant="ghost" size="icon" className="size-8">
                          <a href={link.href} aria-label={link.label} title={link.label}>
                            <Icon />
                          </a>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          ))}
          {hiring && (
            <article className="flex flex-col justify-between rounded-xl border border-dashed p-6">
              <div>
                <h3 className="text-subheading">{hiring.title}</h3>
                <p className="mt-2 text-pretty text-muted-foreground text-sm">
                  {hiring.description}
                </p>
              </div>
              <Button asChild variant="outline" className="mt-6 self-start">
                <a href={hiring.action.href}>
                  {hiring.action.label}
                  <ArrowUpRightIcon />
                </a>
              </Button>
            </article>
          )}
        </Reveal>
      </div>
    </section>
  )
}

export { Team01 }
