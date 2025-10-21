export function formatCurrency(n: number, currency: string = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
}

