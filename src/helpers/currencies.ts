export function getCurrencySymbol(currency: string): string {
    return Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol'
    })
        .formatToParts(1)
        .filter(p => p.type === 'currency')[0]
        .value
}

export function formatCurrency(amount: number, currency: string, compact: boolean = false): string {
    if (amount === 0 && amount.toLocaleString() === '-0') {
        amount = -amount
    }

    return amount.toLocaleString(undefined, {
        style: 'currency',
        currency,
        notation: compact ? 'compact' : 'standard',
        currencyDisplay: 'narrowSymbol'
    })
}

export function formatExchangeRate(from: number, to: number): string {
    if (from === 0 || to === 0) {
        return 'Exc. rate: _.__'
    }

    const r = (Math.max(from / to, to / from)).toFixed(2)

    return `Exc. rate: ${r}`
}
