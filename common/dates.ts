import { DateTime, Settings } from 'luxon'

Settings.throwOnInvalid = true

export function toValid(date: DateTime): DateTime<true> {
    if (!date.isValid) {
        throw Error(`Invalid date: ${date.invalidReason}, ${date.invalidExplanation}`)
    }

    return date
}
