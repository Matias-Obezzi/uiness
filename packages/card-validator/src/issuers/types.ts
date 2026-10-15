/** How a card is drawn for its issuer: what the API sends and the card component takes. */
export interface IssuerBrand {
  /** Kebab-case and unique, such as `mercado-pago`. */
  id: string
  /** The name people know, printed on the card. */
  name: string
  /** Any CSS background: a color or a gradient. */
  background: string
  /** The text color on that background. */
  foreground: string
  /**
   * The mark as SVG path data on a 24×24 grid, drawn in `foreground`. Path data only, never
   * markup, so an icon from a lookup cannot carry a script.
   */
  icon?: string
  website?: string
}

/** An entry in the list: the brand, and how a lookup's answer is matched to it. */
export interface Issuer extends IssuerBrand {
  /** Tested against the bank name a lookup gives, such as binlist's `BANCO DE GALICIA…`. */
  match: RegExp
  /** ISO 3166 alpha-2 codes the name is matched in. Leave out for a bank that is the same everywhere. */
  countries?: string[]
  /** BIN prefixes known to be theirs: matched first, and without any lookup. */
  bins?: string[]
}
