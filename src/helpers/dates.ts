import { DateTime } from 'luxon'

const GOOGLE_EPOCH = DateTime.utc(1899, 12, 30)

export function fromGoogleDateTime (date: number): DateTime {
    const millis = GOOGLE_EPOCH.plus({ days: date }).toMillis()
    return DateTime.fromMillis(Math.round(millis), { zone: 'utc' })
}

export function toGoogleDateTime (date: DateTime): number {
    return date.diff(GOOGLE_EPOCH, 'days').days
}
