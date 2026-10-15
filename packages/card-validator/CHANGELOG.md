# @uiness/card-validator

## 0.1.0

### Minor Changes

- 044a9f6: Initial release: `validateCard` repeats a card form's checks on the server (the brand's lengths and Luhn digit, the expiry against today, the security code's length), with `cardBrand`, `luhn`, `expiryState` and `binOf` one by one. `createCardHandler` is a `GET ?bin=` endpoint on web `Request` and `Response` that finds the bank, type, country and network behind a card's first 6 to 8 digits, from binlist.net or any `lookup`, cached in memory and by the CDN, refusing anything longer so a full number never reaches it. `useCardInfo` from `@uiness/card-validator/react` asks it for the card being typed, once per BIN. A community list of issuers, `issuers`, one file per country, gives each bank's colors and mark: the handler matches each answer against it and sends them as `issuer`, and `findIssuer` matches without the endpoint.
