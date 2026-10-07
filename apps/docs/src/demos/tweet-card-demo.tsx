import { TweetCard } from '@/components/ui/tweet-card'

export default function TweetCardDemo() {
  return (
    <div className="flex w-full items-center justify-center p-4">
      <TweetCard
        author={{
          name: 'Guillermo Rauch',
          handle: 'rauchg',
          avatar: '/img/gallery-1-tiny.png',
          verified: true,
        }}
        text="The fastest way to build modern web interfaces with pure animations and zero runtime weight: check @uiness at https://uiness.vercel.app #webdev"
        createdAt="2026-10-07T08:30:00Z"
        metrics={{
          replies: 142,
          reposts: 890,
          likes: 4200,
          views: 95000,
        }}
        media={[
          {
            type: 'image',
            src: '/img/gallery-3.png',
            alt: 'Abstract gradient art',
          },
        ]}
      />
    </div>
  )
}
