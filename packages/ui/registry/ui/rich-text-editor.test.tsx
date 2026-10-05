import { act, fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  htmlToMarkdown,
  RichTextEditor,
  type RichTextEditorHandle,
  safeUrl,
  sanitizeHtml,
} from './rich-text-editor'

describe('sanitizeHtml', () => {
  it('keeps the supported tags and drops the rest', () => {
    const dirty =
      '<script>alert(1)</script><p onclick="x()" class="a">Hi <b>there</b><img src=x onerror="alert(1)"></p>' +
      '<a href="javascript:alert(1)">bad</a><div>Block</div><span style="font-weight:700">heavy</span>' +
      '<h5>Small</h5><ul><li>One</li>stray</ul><iframe src="https://evil.dev"></iframe>'
    expect(sanitizeHtml(dirty)).toBe(
      '<p>Hi <strong>there</strong></p><p>bad</p><p>Block</p><p><strong>heavy</strong></p>' +
        '<h3>Small</h3><ul><li>One</li><li>stray</li></ul>',
    )
  })

  it('unwraps the Google Docs wrapper and keeps safe links', () => {
    expect(
      sanitizeHtml(
        '<b style="font-weight:normal" id="docs-internal-guid-1"><p>A <a href="https://x.dev" target="_blank">link</a></p></b>',
      ),
    ).toBe('<p>A <a href="https://x.dev">link</a></p>')
  })
})

describe('safeUrl', () => {
  it('allows web, mail and relative links only', () => {
    expect(safeUrl('https://uiness.dev')).toBe('https://uiness.dev')
    expect(safeUrl('/docs')).toBe('/docs')
    expect(safeUrl('mailto:a@b.dev')).toBe('mailto:a@b.dev')
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('java\nscript:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,hi')).toBeNull()
  })
})

describe('htmlToMarkdown', () => {
  it('serializes the supported subset', () => {
    const html =
      '<h1>Title</h1><p>Some <strong>bold</strong> and <em>italic</em> with <code>code</code>.</p>' +
      '<ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul><ol><li>First</li><li>Second</li></ol>' +
      '<blockquote>Quoted<br>twice</blockquote><p><a href="https://x.dev/a b">link</a> <s>gone</s> <u>under</u></p><hr>'
    expect(htmlToMarkdown(html)).toBe(
      [
        '# Title',
        'Some **bold** and *italic* with `code`.',
        '- One\n- Two\n  - Nested',
        '1. First\n2. Second',
        '> Quoted\\\n> twice',
        '[link](https://x.dev/a%20b) ~~gone~~ <u>under</u>',
        '---',
      ].join('\n\n'),
    )
  })

  it('escapes text that would read as Markdown', () => {
    expect(htmlToMarkdown('<p># not a heading</p><p>2*3*4 [x]</p><p>1. not a list</p>')).toBe(
      '\\# not a heading\n\n2\\*3\\*4 \\[x\\]\n\n1\\. not a list',
    )
  })

  it('moves spaces out of marks and fences code with backticks', () => {
    expect(htmlToMarkdown('<p>a<strong> bold </strong>b <code>x`y</code></p>')).toBe(
      'a **bold** b ``x`y``',
    )
  })
})

const editor = () => screen.getByRole('textbox', { name: 'Editor' })

/** Puts the caret at the end of the editor's last text, the way typing leaves it. */
function caretAtEnd(node: Node) {
  let last: Node = node
  while (last.lastChild) last = last.lastChild
  const offset = last.nodeType === Node.TEXT_NODE ? (last.nodeValue ?? '').length : 0
  document.getSelection()?.collapse(last, offset)
}

/** What typing a character does: the browser changes the DOM, then fires input. */
function type(text: string, data: string) {
  const root = editor()
  root.focus()
  root.innerHTML = text
  caretAtEnd(root)
  fireEvent.input(root, { inputType: 'insertText', data })
}

describe('RichTextEditor', () => {
  it('renders sanitized starting content as an accessible textbox', () => {
    render(<RichTextEditor defaultValue="<p>Hello <b>world</b><script>x</script></p>" />)
    const root = editor()
    expect(root.getAttribute('aria-multiline')).toBe('true')
    expect(root.getAttribute('contenteditable')).toBe('true')
    expect(root.innerHTML).toBe('<p>Hello <strong>world</strong></p>')
  })

  it('shows the placeholder only while empty', () => {
    render(<RichTextEditor placeholder="Write" />)
    expect(editor().hasAttribute('data-empty')).toBe(true)
    expect(editor().getAttribute('data-placeholder')).toBe('Write')
  })

  it('turns block shortcuts into blocks and reports HTML and Markdown', () => {
    const onChange = vi.fn()
    render(<RichTextEditor onChange={onChange} />)
    type('<p>#\u00a0</p>', ' ')
    expect(editor().innerHTML).toBe('<h1><br></h1>')
    type('<p>-\u00a0</p>', ' ')
    expect(editor().querySelector('ul > li')).toBeTruthy()
    type('<p>&gt;\u00a0</p>', ' ')
    expect(editor().querySelector('blockquote')).toBeTruthy()
    type('<p>1.\u00a0</p>', ' ')
    expect(editor().querySelector('ol > li')).toBeTruthy()
    type('<p>Done</p>', 'e')
    expect(onChange).toHaveBeenLastCalledWith({ html: '<p>Done</p>', markdown: 'Done' })
  })

  it('turns inline shortcuts into marks', () => {
    render(<RichTextEditor />)
    type('<p>a **bold**</p>', '*')
    expect(editor().querySelector('strong')?.textContent).toBe('bold')
    type('<p>an *em*</p>', '*')
    expect(editor().querySelector('em')?.textContent).toBe('em')
    type('<p>some `code`</p>', '`')
    expect(editor().querySelector('code')?.textContent).toBe('code')
    type('<p>~~gone~~</p>', '~')
    expect(editor().querySelector('s')?.textContent).toBe('gone')
    type('<p>snake_case_name</p>', '_')
    expect(editor().querySelector('em')).toBeNull()
  })

  it('keeps Enter inside a quote and leaves it from an empty last line', () => {
    render(<RichTextEditor />)
    type('<blockquote>q</blockquote>', 'q')
    fireEvent.keyDown(editor(), { key: 'Enter' })
    expect(editor().innerHTML).toBe('<blockquote>q<br><br></blockquote>')
    fireEvent.keyDown(editor(), { key: 'Enter' })
    expect(editor().innerHTML).toBe('<blockquote>q</blockquote><p><br></p>')
  })

  it('turns a heading back into a paragraph with Backspace at its start', () => {
    render(<RichTextEditor defaultValue="<h2>Title</h2>" />)
    const root = editor()
    root.focus()
    document.getSelection()?.collapse(root.querySelector('h2')?.firstChild as Node, 0)
    fireEvent.keyDown(root, { key: 'Backspace' })
    expect(root.innerHTML).toBe('<p>Title</p>')
  })

  it('opens the slash menu and turns the line into the block picked', () => {
    const onChange = vi.fn()
    render(<RichTextEditor onChange={onChange} />)
    type('<p>/h</p>', 'h')
    const menu = screen.getByRole('listbox', { name: 'Blocks' })
    expect(menu.querySelectorAll('[role=option]').length).toBeGreaterThan(1)
    expect(editor().getAttribute('aria-activedescendant')).toContain('h1')
    fireEvent.keyDown(editor(), { key: 'ArrowDown' })
    fireEvent.keyDown(editor(), { key: 'Enter' })
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(editor().innerHTML).toBe('<h2><br></h2>')
  })

  it('closes the slash menu on Escape', () => {
    render(<RichTextEditor />)
    type('<p>/</p>', '/')
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(editor(), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('undoes and redoes with its own history', () => {
    const ref = React.createRef<RichTextEditorHandle>()
    render(<RichTextEditor ref={ref} defaultValue="<p>Start</p>" />)
    type('<p>#\u00a0</p>', ' ')
    expect(editor().innerHTML).toBe('<h1><br></h1>')
    // Undoing a shortcut gives back the characters typed.
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true })
    expect(editor().innerHTML).toBe('<p>#&nbsp;</p>')
    fireEvent.keyDown(editor(), { key: 'z', ctrlKey: true })
    expect(editor().innerHTML).toBe('<p>Start</p>')
    fireEvent.keyDown(editor(), { key: 'y', ctrlKey: true })
    expect(editor().innerHTML).toBe('<p>#&nbsp;</p>')
    act(() => ref.current?.redo())
    expect(editor().innerHTML).toBe('<h1><br></h1>')
  })

  it('pastes HTML cleaned to the supported tags', () => {
    const onChange = vi.fn()
    render(<RichTextEditor defaultValue="<p>Hi </p>" onChange={onChange} />)
    const root = editor()
    root.focus()
    caretAtEnd(root)
    fireEvent.paste(root, {
      clipboardData: {
        getData: (type: string) =>
          type === 'text/html' ? '<p style="color:red">there <i>you</i><img src=x></p>' : '',
      },
    })
    expect(root.innerHTML).toBe('<p>Hi there <em>you</em></p>')
    expect(onChange).toHaveBeenLastCalledWith({
      html: '<p>Hi there <em>you</em></p>',
      markdown: 'Hi there *you*',
    })
  })

  it('reads and replaces content through the ref', () => {
    const ref = React.createRef<RichTextEditorHandle>()
    render(<RichTextEditor ref={ref} defaultValue="<h2>Plan</h2><ul><li>Ship</li></ul>" />)
    expect(ref.current?.getMarkdown()).toBe('## Plan\n\n- Ship')
    act(() => ref.current?.setHTML('<p>New</p>'))
    expect(ref.current?.getHTML()).toBe('<p>New</p>')
  })

  it('is not editable when read only', () => {
    render(<RichTextEditor readOnly defaultValue="<p>Fixed</p>" />)
    expect(editor().getAttribute('contenteditable')).toBe('false')
    expect(editor().getAttribute('aria-readonly')).toBe('true')
  })
})
