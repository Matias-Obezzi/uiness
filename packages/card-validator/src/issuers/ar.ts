import type { Issuer } from './types'

// Argentina. Keep them sorted by id.
export const ar: Issuer[] = [
  {
    id: 'galicia',
    name: 'Galicia',
    match: /galicia/i,
    countries: ['AR'],
    background: '#fa6400',
    foreground: '#ffffff',
    website: 'https://www.galicia.ar',
  },
  {
    id: 'lemon',
    name: 'Lemon',
    match: /\blemon\b/i,
    countries: ['AR'],
    background: '#00f068',
    foreground: '#000000',
    website: 'https://www.lemon.me',
  },
  {
    id: 'mercado-pago',
    name: 'Mercado Pago',
    match: /mercado ?(pago|libre)/i,
    countries: ['AR', 'BR', 'MX', 'CL', 'CO', 'PE', 'UY'],
    background: '#009ee3',
    foreground: '#ffffff',
    website: 'https://www.mercadopago.com.ar',
  },
]
