import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPdfCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  const formatted = formatCurrency(amount, currency, locale)
  // The built-in PDF Helvetica font does not support the '₹' glyph and renders it as '1' or '?'
  return formatted.replace('₹', 'Rs. ')
}

export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(dateString: string, locale = 'en-US'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function generateShareToken(): string {
  const array = new Uint8Array(24)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const PROJECT_TYPES = [
  'Residential', 'Commercial', 'Industrial', 'Infrastructure',
  'Renovation', 'Landscaping', 'Institutional', 'Mixed-Use'
]

export const SIZE_UNITS = ['Square Meters', 'Square Feet', 'Hectares', 'Acres']
export const DURATION_UNITS = ['Days', 'Weeks', 'Months', 'Years']
export const COST_CATEGORIES = ['materials', 'labor', 'equipment', 'additional'] as const
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'YER', 'KWD', 'QAR', 'INR']

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, SAR: 3.75, AED: 3.67,
  EGP: 48.5, YER: 250, KWD: 0.31, QAR: 3.64, INR: 83.5
}

export function convertCurrency(amount: number, from: string, to: string): number {
  const fromRate = CURRENCY_RATES[from] || 1
  const toRate = CURRENCY_RATES[to] || 1
  return (amount / fromRate) * toRate
}
