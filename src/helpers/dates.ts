import { DateTime, type DurationLike } from 'luxon'

const GOOGLE_EPOCH = DateTime.utc(1899, 12, 30)

export function fromGoogleDateTime (date: number): DateTime {
    const millis = GOOGLE_EPOCH.plus({ days: date }).toMillis()
    return DateTime.fromMillis(Math.round(millis), { zone: 'utc' })
}

export function toGoogleDateTime (date: DateTime): number {
    return date.diff(GOOGLE_EPOCH, 'days').days
}

export function utcToday (): DateTime {
    const now = DateTime.now()
    return DateTime.utc(now.year, now.month, now.day)
}

export abstract class HumanTimeSpan {
    abstract get startDate (): DateTime
    abstract get endDate (): DateTime

    * allDates (opts?: { includeDayBefore?: boolean }): Generator<DateTime> {
        const startDate = opts?.includeDayBefore === true
            ? this.startDate.minus({ day: 1 })
            : this.startDate

        const endDate = this.endDate

        for (let date = startDate; date <= endDate; date = date.plus({ day: 1 })) {
            yield date
        }
    }

    get totalDays (): number {
        return this.endDate.diff(this.startDate, 'days').days + 1
    }
}

export class ThisMonthTimeSpan extends HumanTimeSpan {
    get startDate (): DateTime {
        return utcToday().set({ day: 1 })
    }

    get endDate (): DateTime {
        const today = utcToday()
        return today.set({ day: today.daysInMonth })
    }
}

export class ThisYearTimeSpan extends HumanTimeSpan {
    get startDate (): DateTime {
        return utcToday().set({ day: 1, month: 1 })
    }

    get endDate (): DateTime {
        return utcToday().set({ day: 31, month: 12 })
    }
}

export class MonthTimeSpan extends HumanTimeSpan {
    readonly year: number
    readonly month: number

    constructor (year: number, month: number) {
        super()
        this.year = year
        this.month = month
    }

    get startDate (): DateTime {
        return DateTime.utc(this.year, this.month)
    }

    get endDate (): DateTime {
        const date = DateTime.utc(this.year, this.month)
        return date.set({ day: date.daysInMonth })
    }
}

export class YearTimeSpan extends HumanTimeSpan {
    readonly year: number

    constructor (year: number) {
        super()
        this.year = year
    }

    get startDate (): DateTime {
        return DateTime.utc(this.year)
    }

    get endDate (): DateTime {
        return DateTime.utc(this.year, 12, 31)
    }
}

export class LastPeriodTimeSpan extends HumanTimeSpan {
    readonly duration: DurationLike

    constructor (duration: DurationLike) {
        super()
        this.duration = duration
    }

    get startDate (): DateTime {
        return utcToday().minus(this.duration)
    }

    get endDate (): DateTime {
        return utcToday()
    }
}

export class CustomTimeSpan extends HumanTimeSpan {
    private readonly _start: DateTime
    private readonly _end: DateTime

    constructor (start: DateTime, end: DateTime) {
        super()
        this._start = start
        this._end = end
    }

    get startDate (): DateTime {
        return this._start
    }

    get endDate (): DateTime {
        return this._end
    }
}
