import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { AgentLanes } from './agent-lanes'
import { AgentSteps } from './agent-steps'
import { AutocompleteInput, nextWord } from './autocomplete-input'
import { type BranchMessage, ChatBranches } from './chat-branches'
import { Citations, SourceStack } from './citations'
import { ContextMeter } from './context-meter'
import { DiffReview } from './diff-review'
import { type Memory, MemoryList, remember } from './memory-list'
import { MessageQueue } from './message-queue'
import { carryEffort, type Model, ModelSelector } from './model-selector'
import { PromptInput } from './prompt-input'
import { RedactPrompt, redact, restore } from './redact-prompt'
import { diffWords, RewriteSelection } from './rewrite-selection'
import { TokenAlternatives } from './token-alternatives'
import { ToolApproval } from './tool-approval'
import { resample, VoiceInput } from './voice-input'

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Element.prototype.scrollIntoView ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
})

const models: Model[] = [
  { id: 'fast', name: 'Fast', efforts: ['Low', 'High'] },
  {
    id: 'deep',
    name: 'Deep',
    description: 'Thinks longer',
    efforts: ['Low', 'Medium', 'High', 'Max'],
  },
]

describe('ModelSelector', () => {
  it('keeps the effort at the same share of the way when switching models', () => {
    expect(carryEffort(models[0], 'High', models[1] as Model)).toBe('Max')
    expect(carryEffort(models[1], 'Low', models[0] as Model)).toBe('Low')
    expect(carryEffort(undefined, undefined, models[1] as Model)).toBe('Medium')
  })

  it('picks a model and an effort from its panel', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ModelSelector models={models} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Model: Fast, Low effort' }))
    await user.click(screen.getByRole('radio', { name: /Deep/ }))
    expect(onValueChange).toHaveBeenLastCalledWith({ model: 'deep', effort: 'Low' })
    await user.click(screen.getByRole('radio', { name: 'High' }))
    expect(onValueChange).toHaveBeenLastCalledWith({ model: 'deep', effort: 'High' })
  })
})

describe('PromptInput', () => {
  it('sends with Enter, offers commands after a slash, and turns into Stop while streaming', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(
      <PromptInput
        onSubmit={onSubmit}
        models={models}
        commands={[{ name: 'summarize' }, { name: 'search' }]}
      />,
    )
    const box = screen.getByRole('combobox', { name: 'Ask anything…' })
    await user.type(box, '/su')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['/summarize'])
    await user.keyboard('{Enter}')
    expect(box).toHaveProperty('value', '/summarize ')
    await user.type(box, 'this page{Enter}')
    expect(onSubmit).toHaveBeenCalledWith({
      text: '/summarize this page',
      files: [],
      model: { model: 'fast', effort: 'Low' },
      tools: [],
    })
    expect(box).toHaveProperty('value', '')

    rerender(<PromptInput onSubmit={onSubmit} onStop={onStop} streaming />)
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalled()
  })

  it('takes pasted files as chips, which can be removed', () => {
    render(<PromptInput onSubmit={() => {}} accept="image/*" />)
    const file = new File(['x'], 'shot.png', { type: 'image/png' })
    fireEvent.paste(screen.getByRole('textbox'), { clipboardData: { files: [file] } })
    expect(screen.getByText('shot.png')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }))
    expect(screen.queryByText('shot.png')).toBeNull()
  })
})

describe('VoiceInput', () => {
  it('fits a take into the bars, keeping the peaks', () => {
    expect(resample([0.1, 0.9, 0.2, 0.3], 2)).toEqual([0.9, 0.3])
    expect(resample([], 3)).toEqual([0, 0, 0])
  })

  it('says so when the microphone is refused', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error('denied')) },
    })
    render(<VoiceInput onSend={() => {}} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record a voice message' }))
    })
    expect(screen.getByRole('status').textContent).toBe('The microphone is not available.')
  })
})

describe('AgentSteps', () => {
  it('shows each step’s state, the running log and the summary when done', () => {
    const { rerender } = render(
      <AgentSteps
        startedAt={0}
        endedAt={12000}
        steps={[
          { id: 'a', label: 'Read the repo', status: 'done' },
          { id: 'b', label: 'Run the tests', status: 'running', log: ['3 passed'] },
        ]}
      />,
    )
    expect(screen.getByText('Read the repo').textContent).toContain('Done')
    expect(screen.getByText('3 passed')).toBeTruthy()
    expect(screen.getAllByText('Working… 12s')).not.toHaveLength(0)
    rerender(
      <AgentSteps
        startedAt={0}
        endedAt={75000}
        summary="All green"
        steps={[{ id: 'a', label: 'Read the repo', status: 'done' }]}
      />,
    )
    expect(screen.getAllByText('Done in 1m 15s')).not.toHaveLength(0)
    expect(screen.getByText('All green')).toBeTruthy()
  })
})

describe('ToolApproval', () => {
  it('approves a safe call with a click and folds decided calls into the trace', () => {
    const onApprove = vi.fn()
    const onDeny = vi.fn()
    render(
      <ToolApproval
        onApprove={onApprove}
        onDeny={onDeny}
        calls={[
          { id: '1', name: 'read_file', args: { path: 'a.ts' }, status: 'pending' },
          { id: '2', name: 'rm_rf', destructive: true, status: 'pending' },
          { id: '3', name: 'search', status: 'done', output: '4 results' },
        ]}
      />,
    )
    const safe = screen.getByRole('group', { name: 'Allow read_file?' })
    fireEvent.click(within(safe).getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith('1')
    const risky = screen.getByRole('group', { name: 'Allow rm_rf?' })
    // A click alone does not approve a destructive call.
    fireEvent.click(within(risky).getByRole('button', { name: /Approve/ }))
    expect(onApprove).toHaveBeenCalledTimes(1)
    fireEvent.click(within(risky).getByRole('button', { name: 'Deny' }))
    expect(onDeny).toHaveBeenCalledWith('2')
    expect(screen.getByText('search')).toBeTruthy()
    expect(screen.getByText('4 results')).toBeTruthy()
  })
})

describe('ContextMeter', () => {
  it('reads out how full it is and offers to compact once nearly full', async () => {
    const user = userEvent.setup()
    const onCompact = vi.fn()
    render(
      <ContextMeter
        limit={1000}
        onCompact={onCompact}
        sources={[
          { label: 'System', tokens: 300 },
          { label: 'Conversation', tokens: 550 },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Context window 85% full' }))
    expect(screen.getByText('Conversation')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Compact' }))
    expect(onCompact).toHaveBeenCalled()
  })
})

describe('Citations', () => {
  const sources = [
    { id: 'a', title: 'The study', url: 'https://example.org/study', snippet: 'Results' },
    { id: 'b', title: 'A survey', url: 'https://news.example.com/survey' },
  ]

  it('numbers the chips by source and previews one on focus, lighting its claim', () => {
    render(
      <Citations
        sources={sources}
        segments={[
          { text: 'Cats sleep a lot.', sources: ['b'] },
          { text: 'Dogs less.', sources: ['a', 'b'] },
        ]}
      />,
    )
    const chips = screen.getAllByRole('link')
    expect(chips.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Source 2: A survey',
      'Source 1: The study',
      'Source 2: A survey',
    ])
    fireEvent.focus(chips[1] as HTMLElement)
    expect(screen.getByRole('tooltip').textContent).toContain('The study')
    expect(screen.getByText('Dogs less.').className).toContain('bg-primary/15')
  })

  it('stacks the sources being read', () => {
    render(<SourceStack sources={sources} max={1} />)
    expect(screen.getByRole('status').textContent).toContain('+1Reading 2 sources')
  })
})

describe('DiffReview', () => {
  it('counts each file’s lines, decides per file, undoes and accepts the rest', () => {
    const onDecision = vi.fn()
    render(
      <DiffReview
        onDecision={onDecision}
        files={[
          { path: 'a.ts', before: 'one\ntwo', after: 'one\n2\nthree' },
          { path: 'b.ts', before: 'x', after: 'y' },
          { path: 'c.ts', before: '', after: 'z', streaming: true },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: /a\.ts.*2 added, 1 removed/ })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0] as HTMLElement)
    expect(onDecision).toHaveBeenLastCalledWith('a.ts', 'rejected')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onDecision).toHaveBeenLastCalledWith('a.ts', undefined)
    fireEvent.click(screen.getByRole('button', { name: 'Accept all' }))
    expect(onDecision).toHaveBeenCalledWith('b.ts', 'accepted')
    expect(onDecision).not.toHaveBeenCalledWith('c.ts', 'accepted')
  })
})

describe('AutocompleteInput', () => {
  it('suggests after a pause, keeps it as its letters are typed, and takes it word by word', async () => {
    vi.useFakeTimers()
    const getSuggestion = vi.fn(() => ' see you tomorrow')
    render(<AutocompleteInput aria-label="Message" defaultValue="" getSuggestion={getSuggestion} />)
    const box = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement
    box.focus()
    fireEvent.change(box, { target: { value: 'Great,' } })
    box.setSelectionRange(6, 6)
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(box.getAttribute('aria-describedby')).toBeTruthy()
    fireEvent.change(box, { target: { value: 'Great, s' } })
    expect(getSuggestion).toHaveBeenCalledTimes(1)
    box.setSelectionRange(8, 8)
    fireEvent.keyDown(box, { key: 'ArrowRight' })
    expect(box.value).toBe('Great, see')
    box.setSelectionRange(10, 10)
    fireEvent.keyDown(box, { key: 'Tab' })
    expect(box.value).toBe('Great, see you tomorrow')
    vi.useRealTimers()
    expect(nextWord('  one two')).toBe('  one')
  })
})

describe('TokenAlternatives', () => {
  it('underlines unsure words and hands back the one picked', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(
      <TokenAlternatives
        onPick={onPick}
        tokens={[
          { text: 'The', p: 0.99 },
          { text: ' sky', p: 0.4, alternatives: [{ text: ' sea', p: 0.35 }] },
        ]}
      />,
    )
    expect(screen.queryByRole('button', { name: /The/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'sky, 40% likely. Show alternatives' }))
    await user.click(screen.getByRole('button', { name: /sea/ }))
    expect(onPick).toHaveBeenCalledWith(1, ' sea')
  })
})

describe('ChatBranches', () => {
  it('shows the newest branch, steps between versions and edits into a new one', async () => {
    const user = userEvent.setup()
    const messages: BranchMessage[] = [
      { id: 'u1', parentId: null, role: 'user', text: 'Hi' },
      { id: 'a1', parentId: 'u1', role: 'assistant', text: 'Hello!' },
      { id: 'u2', parentId: null, role: 'user', text: 'Hey' },
      { id: 'a2', parentId: 'u2', role: 'assistant', text: 'Hey there' },
    ]
    const onEdit = vi.fn()
    render(<ChatBranches messages={messages} onEdit={onEdit} />)
    const chat = screen.getByRole('list', { name: 'Conversation' })
    expect(within(chat).getByText('Hey there')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Previous version' }))
    expect(within(chat).getByText('Hello!')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByRole('textbox', { name: 'Edit' }))
    await user.type(screen.getByRole('textbox', { name: 'Edit' }), 'Howdy')
    await user.click(screen.getByRole('button', { name: 'Save and send' }))
    expect(onEdit).toHaveBeenCalledWith('u1', 'Howdy')
    expect(screen.getAllByRole('button', { name: /^Message 1, version/ })).toHaveLength(2)
  })
})

describe('AgentLanes', () => {
  it('shows what runs at the end of the run', () => {
    render(
      <AgentLanes
        duration={5000}
        lanes={[
          {
            id: 'lead',
            name: 'Lead',
            lead: true,
            events: [{ id: 'e1', label: 'plan()', start: 0, end: 1000 }],
          },
          {
            id: 'sub',
            name: 'Researcher',
            events: [{ id: 'e2', label: 'search("x")', start: 2000 }],
          },
        ]}
      />,
    )
    expect(screen.getByText('Live')).toBeTruthy()
    expect(screen.getByText('search("x")')).toBeTruthy()
    expect(screen.queryByText('plan()')).toBeNull()
  })
})

describe('RewriteSelection', () => {
  it('diffs word by word', () => {
    expect(diffWords('a quick fox', 'a slow fox')).toEqual([
      { type: 'same', text: 'a ' },
      { type: 'removed', text: 'quick' },
      { type: 'added', text: 'slow' },
      { type: 'same', text: ' fox' },
    ])
  })

  it('rewrites the selection in place and accepts it', async () => {
    const onValueChange = vi.fn()
    render(
      <RewriteSelection
        defaultValue="Hello big world"
        onValueChange={onValueChange}
        suggestions={['Shorter']}
        rewrite={async () => 'small'}
      />,
    )
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    box.setSelectionRange(6, 9)
    fireEvent.select(box)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Shorter' }))
    })
    expect(screen.getByText('big').tagName).toBe('DEL')
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(onValueChange).toHaveBeenCalledWith('Hello small world')
  })
})

describe('MessageQueue', () => {
  it('queues while busy, lets them be reordered, and sends the next when idle', async () => {
    const user = userEvent.setup()
    const sent: string[] = []
    function Host() {
      const [busy, setBusy] = React.useState(true)
      return (
        <>
          <button type="button" onClick={() => setBusy(false)}>
            idle
          </button>
          <MessageQueue
            busy={busy}
            onSend={(text) => {
              sent.push(text)
              setBusy(true)
            }}
          />
        </>
      )
    }
    render(<Host />)
    const box = screen.getByRole('textbox', { name: 'Send a message…' })
    await user.type(box, 'first{Enter}second{Enter}')
    expect(screen.getByRole('list', { name: '2 queued messages' })).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: 'Move up' })[1] as HTMLElement)
    await user.click(screen.getByRole('button', { name: 'idle' }))
    expect(sent).toEqual(['second'])
    expect(screen.getByRole('list', { name: '1 queued message' })).toBeTruthy()
  })
})

describe('RedactPrompt', () => {
  it('masks emails, cards, keys and terms, and restores them in the reply', () => {
    const { text, redactions } = redact(
      'Ana (ana@x.io) paid with 4242 4242 4242 4242 using sk-abcdefghijklmnop1234, not 1234 5678 9012 3456.',
      ['Ana'],
    )
    expect(text).toBe(
      '[TERM_1] ([EMAIL_1]) paid with [CARD_1] using [KEY_1], not 1234 5678 9012 3456.',
    )
    expect(restore('Thanks [TERM_1], [CARD_1] is charged.', redactions)).toBe(
      'Thanks Ana, 4242 4242 4242 4242 is charged.',
    )
  })

  it('says how many values it masked', () => {
    render(<RedactPrompt defaultValue="Write to bo@x.io" />)
    expect(screen.getByRole('status').textContent).toBe('1 value masked')
  })
})

describe('MemoryList', () => {
  it('replaces a fact on the same key in place and lets one be forgotten', async () => {
    const user = userEvent.setup()
    let list: Memory[] = remember([], { key: 'city', text: 'Lives in Lima' })
    list = remember(list, { text: 'Likes tea' })
    list = remember(list, { key: 'city', text: 'Lives in Quito' })
    expect(list.map((m) => m.text)).toEqual(['Likes tea', 'Lives in Quito'])
    expect(list[1]?.replaced).toBe('Lives in Lima')
    const onMemoriesChange = vi.fn()
    render(<MemoryList memories={list} onMemoriesChange={onMemoriesChange} />)
    expect(screen.getByText('Lives in Lima').className).toContain('line-through')
    await user.click(screen.getAllByRole('button', { name: 'Forget' })[0] as HTMLElement)
    expect(onMemoriesChange).toHaveBeenCalledWith([list[1]])
  })
})
