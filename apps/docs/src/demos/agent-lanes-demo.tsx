import { useEffect, useState } from 'react'
import { type AgentLane, AgentLanes } from '@/components/ui/agent-lanes'

const END = 12_000

const lanes: AgentLane[] = [
  {
    id: 'lead',
    name: 'Lead',
    lead: true,
    events: [
      { id: 'l1', label: 'plan("compare 3 vendors")', start: 0, end: 1200 },
      { id: 'l2', label: 'delegate(researchers)', start: 1200, end: 1800 },
      { id: 'l3', label: 'merge(findings)', start: 9800, end: 11600 },
    ],
  },
  {
    id: 'r1',
    name: 'Pricing',
    events: [
      { id: 'p1', label: 'search("vendor pricing")', start: 1800, end: 3600 },
      { id: 'p2', label: 'read("pricing.html")', start: 3600, end: 6200 },
      { id: 'p3', label: 'table(prices)', start: 6200, end: 7400 },
    ],
  },
  {
    id: 'r2',
    name: 'Reviews',
    events: [
      { id: 'v1', label: 'search("vendor reviews")', start: 1900, end: 4100 },
      { id: 'v2', label: 'fetch("g2.com")', start: 4100, end: 5000, failed: true },
      { id: 'v3', label: 'fetch("reddit.com")', start: 5000, end: 8800 },
    ],
  },
  {
    id: 'r3',
    name: 'Security',
    events: [
      { id: 's1', label: 'read("trust-center")', start: 2100, end: 6900 },
      { id: 's2', label: 'check(SOC 2)', start: 6900, end: 9600 },
    ],
  },
]

export default function AgentLanesDemo() {
  // The run plays out in front of you, then can be scrubbed.
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (now >= END) return
    const timer = setTimeout(() => setNow(Math.min(END, now + 200)), 200)
    return () => clearTimeout(timer)
  }, [now])
  const live = lanes.map((lane) => ({
    ...lane,
    events: lane.events
      .filter((e) => e.start <= now)
      .map((e) => ({ ...e, end: e.end !== undefined && e.end <= now ? e.end : undefined })),
  }))
  return <AgentLanes className="w-full max-w-xl" lanes={live} duration={now} />
}
