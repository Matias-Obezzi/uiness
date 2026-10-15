<div align="center">

<img src="https://raw.githubusercontent.com/Matias-Obezzi/uiness/main/assets/logo.png" alt="" width="72" height="72" />

</div>

# @uiness/card-validator

An optional companion to uiness's [Credit Card](https://uiness.vercel.app/docs/components/credit-card) component: the bank or fintech behind a card from its first 6 digits, debit or credit, prepaid and country, and the form's checks again on your server. No dependencies.

[Documentation](https://uiness.vercel.app/docs/card-validator) · [Registry](https://uiness.vercel.app/docs/installation) · [GitHub](https://github.com/Matias-Obezzi/uiness)

```bash
pnpm add @uiness/card-validator
```

## What it uses

The issuer comes from the card's BIN, its first 6 to 8 digits, looked up on [binlist.net](https://binlist.net): free, no key, but it refuses browsers and allows a few lookups an hour. So the lookup runs on your server, behind a cache in memory and on your CDN. Only the BIN leaves the browser, and the endpoint refuses anything longer than 8 digits. Its data can be out of date; pass your payment provider's lookup as `lookup` for one you can rely on.

## How to implement it

An endpoint, on anything with web `Request` and `Response`:

```ts
// app/api/card/route.ts
import { createCardHandler } from '@uiness/card-validator'

export const GET = createCardHandler()
```

The hook beside the form:

```tsx
import { useCardInfo } from '@uiness/card-validator/react'

const info = useCardInfo(number) // { bin, bank, type, prepaid, country, scheme, … } or null
<CreditCardForm issuer={info?.bank} onChange={(card) => setNumber(card.number)} />
```

And the checks on the server, if it receives the card:

```ts
import { validateCard } from '@uiness/card-validator'

const { valid, brand, errors } = validateCard({ number, expiry, cvc })
```

For banks on the community list in `src/issuers`, answers carry `issuer`: the bank's name, colors and mark, which `CreditCard` takes as it is (`issuer={info?.issuer ?? info?.bank}`). The list is exported as `issuers`, with `findIssuer` to use it without the endpoint.

### Add your bank

Add an entry to your country's file in [`src/issuers`](src/issuers) and open a pull request: `id`, `name`, a `match` pattern for the name binlist gives, `countries`, `background` and `foreground` from the bank's brand guidelines, and optionally `bins` and an `icon` as SVG path data on a 24×24 grid. Tests check every entry. Names, colors and marks belong to their banks and are listed only so a card can be recognized; a bank that asks to be removed is removed. Full guide: [the docs](https://uiness.vercel.app/docs/card-validator#add-your-bank).

Another source of BIN data: `createCardHandler({ lookup: async (bin) => ({ bin, bank }) })`. Return `null` when the BIN is unknown and throw when the lookup failed.

MIT
