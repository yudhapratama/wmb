export const SALES_PAYMENT_METHODS = [
  { key: 'Cash', label: 'Tunai' },
  { key: 'Debit', label: 'Debit' },
  { key: 'QR', label: 'QRIS' }
]

export function normalizeSalesPaymentMethod(value) {
  const raw = (value ?? '').toString().trim().toLowerCase()

  if (!raw) return 'Cash'

  if (raw === 'cash' || raw === 'tunai') return 'Cash'

  if (
    raw === 'debit' ||
    raw === 'card' ||
    raw.includes('debit') ||
    raw.includes('kartu') ||
    raw.includes('credit')
  ) {
    return 'Debit'
  }

  if (
    raw === 'qr' ||
    raw === 'qris' ||
    raw.includes('qr') ||
    raw.includes('transfer') ||
    raw.includes('ovo') ||
    raw.includes('gopay') ||
    raw.includes('dana') ||
    raw.includes('bank')
  ) {
    return 'QR'
  }

  return 'Cash'
}
