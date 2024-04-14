import { type DateTime } from 'luxon'

export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true

    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
        if (a.constructor !== b.constructor) return false

        if (Array.isArray(a)) {
            if (!Array.isArray(b)) return false

            const length = a.length
            if (length !== b.length) return false

            for (let i = 0; i < length; ++i) {
                if (!deepEqual(a[i], b[i])) return false
            }

            return true
        }

        if ((a instanceof Map) && (b instanceof Map)) {
            if (a.size !== b.size) return false
            for (const i of a.entries()) {
                if (!b.has(i[0])) return false
            }
            for (const i of a.entries()) {
                if (!deepEqual(i[1], b.get(i[0]))) return false
            }
            return true
        }

        if ((a instanceof Set) && (b instanceof Set)) {
            if (a.size !== b.size) return false
            for (const i of a.entries()) {
                if (!b.has(i[0])) return false
            }
            return true
        }

        const keys = new Set<string>(Object.keys(a))
        for (const key of Object.keys(b)) {
            keys.add(key)
        }

        if (keys.has('isLuxonDateTime')) {
            return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (a as any).isLuxonDateTime === true
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                && (b as any).isLuxonDateTime === true
                && (a as DateTime).toMillis() === (b as DateTime).toMillis()
            )
        }

        for (const key of keys) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!deepEqual((a as any)[key], (b as any)[key])) return false
        }

        return true
    }

    // true if both NaN, false otherwise

    return a !== a && b !== b
};
