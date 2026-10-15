// The issuer behind a card's first digits at /api/card?bin=123456, for the card validator demo:
// the package's handler as any app would use it. The docs build builds the package first.
import { createCardHandler } from '@uiness/card-validator'

export const GET = createCardHandler()
