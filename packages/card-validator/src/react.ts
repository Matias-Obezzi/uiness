import { useEffect, useState } from 'react'
import type { CardInfo } from './lookup'
import { binOf } from './validate'

const asked = new Map<string, Promise<CardInfo | null>>()

/** One request per BIN for the whole page; a failed one is forgotten, to retry later. */
function ask(endpoint: string, bin: string) {
  const key = `${endpoint}?bin=${bin}`
  let answer = asked.get(key)
  if (!answer) {
    answer = fetch(key).then((response) => {
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`${endpoint} answered ${response.status}`)
      return response.json() as Promise<CardInfo>
    })
    answer.catch(() => asked.delete(key))
    asked.set(key, answer)
  }
  return answer
}

export interface UseCardInfoOptions {
  /** Your endpoint made with `createCardHandler`. Default `/api/card`. */
  endpoint?: string
}

/**
 * The issuer and details of the card being typed, from your endpoint, once it has 6 digits.
 * Only those 6 are sent. `null` while there are fewer, while it loads, or when nothing is
 * known: a card drawn without it is still complete.
 */
export function useCardInfo(number: string, { endpoint = '/api/card' }: UseCardInfoOptions = {}) {
  const bin = binOf(number)
  const [found, setFound] = useState<{ key: string; info: CardInfo | null } | null>(null)
  const key = bin && `${endpoint}?bin=${bin}`

  useEffect(() => {
    if (!bin) return
    let live = true
    ask(endpoint, bin).then(
      (info) => live && setFound({ key: `${endpoint}?bin=${bin}`, info }),
      () => {},
    )
    return () => {
      live = false
    }
  }, [endpoint, bin])

  // An answer for other digits is not this card's.
  return found && found.key === key ? found.info : null
}
