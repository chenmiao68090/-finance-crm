$content = @'
/**
 * Common formatting utilities (locale-independent)
 * For locale-aware formatting, see i18n-helpers.ts
 */

/** Format currency (CNY default) with thousands separator */
export function formatCurrency(amount: number | string, symbol = '¥', decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${symbol}0.00`
  return symbol + num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Format number with thousands separator */
export function formatNumber(num: number | string, decimals = 0): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  return n.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Format file size to human-readable */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = (bytes / Math.pow(k, i)).toFixed(2)
  return `${size} ${units[i]}`
}

/** Mask phone number, e.g. 138****8888 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const s = String(phone)
  if (s.length < 7) return s
  return s.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

/** Mask ID card number */
export function maskIdCard(id: string): string {
  if (!id) return ''
  const s = String(id)
  if (s.length < 8) return s
  if (s.length === 18) {
    return s.replace(/^(\d{4})\d{10}(\d{4})$/, '$1**********$2')
  }
  return s.substring(0, 4) + '****' + s.substring(s.length - 4)
}

/** Mask email address */
export function maskEmail(email: string): string {
  if (!email) return ''
  const idx = email.indexOf('@')
  if (idx <= 1) return email
  const name = email.substring(0, idx)
  const domain = email.substring(idx)
  const visible = name.length > 2 ? name.substring(0, 2) : name.charAt(0)
  return visible + '***' + domain
}

/** Mask bank card number */
export function maskBankCard(card: string): string {
  if (!card) return ''
  const s = String(card)
  if (s.length < 8) return s
  return s.substring(0, 4) + ' **** **** ' + s.substring(s.length - 4)
}

/** Format percentage from decimal */
export function formatPercent(value: number | string, decimals = 1): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(n)) return '0%'
  return (n * 100).toFixed(decimals) + '%'
}

/** Truncate text with ellipsis */
export function truncate(text: string, length = 20): string {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-ui\src\utils\format.ts" -Value $content -Encoding UTF8
Write-Host "format.ts created successfully"
