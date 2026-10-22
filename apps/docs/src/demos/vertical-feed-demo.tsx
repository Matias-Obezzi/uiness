import { BookmarkIcon, HeartIcon, MessageCircleIcon, Share2Icon } from 'lucide-react'
import { useState } from 'react'
import {
  VerticalFeed,
  VerticalFeedAction,
  VerticalFeedActions,
} from '@/components/ui/vertical-feed'

const posts = [
  {
    id: 1,
    user: 'ines',
    caption: 'Golden hour on the ridge',
    likes: 1204,
    media: '/img/gallery-1.png',
  },
  {
    id: 2,
    user: 'kofi',
    caption: 'Type that moves',
    likes: 8730,
    media: '/video/text-video-background.webm',
  },
  {
    id: 3,
    user: 'hana',
    caption: 'Still water, still mind',
    likes: 342,
    media: '/img/gallery-2.png',
  },
  { id: 4, user: 'leo', caption: 'Night walk', likes: 15600, media: '/img/gallery-4.png' },
]

const compact = new Intl.NumberFormat('en', { notation: 'compact' })

export default function VerticalFeedDemo() {
  const [liked, setLiked] = useState<number[]>([])
  return (
    // A phone sized frame here; on a page of its own the feed fills the screen.
    <VerticalFeed className="h-[min(640px,80dvh)] w-full max-w-90 rounded-2xl bg-black text-white">
      {posts.map((post) => {
        const isLiked = liked.includes(post.id)
        return (
          <div key={post.id} className="size-full">
            {post.media.endsWith('.webm') ? (
              <video src={post.media} muted loop playsInline className="size-full object-cover">
                <track
                  kind="captions"
                  src="/video/text-video-background.vtt"
                  srcLang="en"
                  label="English"
                />
              </video>
            ) : (
              <img src={post.media} alt="" className="size-full object-cover" />
            )}
            <VerticalFeedActions>
              <VerticalFeedAction
                label="Like"
                pressed={isLiked}
                count={compact.format(post.likes + (isLiked ? 1 : 0))}
                onClick={() =>
                  setLiked((list) =>
                    isLiked ? list.filter((id) => id !== post.id) : [...list, post.id],
                  )
                }
              >
                <HeartIcon className={isLiked ? 'fill-rose-500 text-rose-500' : undefined} />
              </VerticalFeedAction>
              <VerticalFeedAction label="Comments" count="48">
                <MessageCircleIcon />
              </VerticalFeedAction>
              <VerticalFeedAction label="Save">
                <BookmarkIcon />
              </VerticalFeedAction>
              <VerticalFeedAction label="Share">
                <Share2Icon />
              </VerticalFeedAction>
            </VerticalFeedActions>
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-4 pt-12 pr-20">
              <p className="font-semibold">@{post.user}</p>
              <p className="text-sm text-white/85">{post.caption}</p>
            </div>
          </div>
        )
      })}
    </VerticalFeed>
  )
}
