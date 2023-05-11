import { DateTime } from 'luxon'

const GOOGLE_EPOCH = DateTime.utc(1899, 12, 30)

export function fromGoogleDateTime (date: number): DateTime {
    return GOOGLE_EPOCH.plus({ days: date })
}
