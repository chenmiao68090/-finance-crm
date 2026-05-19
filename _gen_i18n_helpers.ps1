$content = @'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { i18n } from '@/locales'

dayjs.extend(relativeTime)

/** Get current locale */
export function getLocale(): string {
  return (i18n.global.locale as any).value || 'zh-CN'
}

/** Check if current locale is Chinese */
function isZh(): boolean {
  return getLocale().startsWith('zh')
}

/**
 * Format date with locale awareness
 * @param date - Date string or Date object
 * @param format - Custom format pattern (default: locale-based)
 */
export function formatDate(date: string | Date | number, format?: string): string {
  if (!date) return ''
  const locale = isZh() ? 'zh-cn' : 'en'
  const d = dayjs(date).locale(locale)
  if (format) return d.format(format)
  return d.format(isZh() ? 'YYYY年MM月DD日 HH:mm' : 'MMM D, YYYY HH:mm')
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(date: string | Date | number, format?: string): string {
  if (!date) return ''
  const locale = isZh() ? 'zh-cn' : 'en'
  const d = dayjs(date).locale(locale)
  if (format) return d.format(format)
  return d.format(isZh() ? 'YYYY年MM月DD日' : 'MMM D, YYYY')
}

/**
 * Format currency with locale awareness
 * @param amount - Numeric amount
 * @param currency - Currency code (default: CNY for zh, USD for en)
 */
export function formatCurrency(amount: number | string, currency?: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return ''
  const cur = currency || (isZh() ? 'CNY' : 'USD')
  const locale = isZh() ? 'zh-CN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

/**
 * Format number with locale awareness (thousands separator)
 * @param num - Number to format
 * @param options - Intl.NumberFormat options
 */
export function formatNumber(num: number | string, options?: Intl.NumberFormatOptions): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return ''
  const locale = isZh() ? 'zh-CN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(n)
}

/**
 * Format percentage
 * @param value - Decimal value (0.85 = 85%)
 */
export function formatPercent(value: number | string, decimals = 1): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(n)) return ''
  const locale = isZh() ? 'zh-CN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n)
}

/**
 * Format relative time (e.g., "3 days ago" / "3 天前")
 * @param date - Date string or Date object
 */
export function formatRelativeTime(date: string | Date | number): string {
  if (!date) return ''
  const locale = isZh() ? 'zh-cn' : 'en'
  return dayjs(date).locale(locale).fromNow()
}

/**
 * Format file size to human-readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = (bytes / Math.pow(k, i)).toFixed(2)
  return `${size} ${units[i]}`
}
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-ui\src\utils\i18n-helpers.ts" -Value $content -Encoding UTF8
Write-Host "i18n-helpers.ts created successfully"
