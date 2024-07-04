import { DateTime, type DurationLike } from 'luxon'

import { Engine } from './engine'

export function utcToday(): DateTime<true> {
    const now = DateTime.now()
    return utcDate(now)
}

export function utcDate(date: Date | DateTime): DateTime {
    if (date instanceof Date) {
        date = DateTime.fromJSDate(date)
    }
    return DateTime.utc(date.year, date.month, date.day)
}

export abstract class HumanTimeSpan {
    private datesCache: DateTime[] | null = null

    abstract get startDate(): DateTime
    abstract get endDate(): DateTime

    private makeAllDates(): DateTime[] {
        const dates: DateTime[] = []

        const startDate = this.startDate.minus({ day: 1 })
        const endDate = this.endDate

        for (let date = startDate; date <= endDate; date = date.plus({ day: 1 })) {
            dates.push(date)
        }

        return dates
    }

    * allDates(opts?: { includeDayBefore?: boolean }): Generator<DateTime> {
        if (this.datesCache === null) {
            this.datesCache = this.makeAllDates()
        }

        for (let i = opts?.includeDayBefore === true ? 0 : 1; i < this.datesCache.length; ++i) {
            yield this.datesCache[i]
        }
    }

    get totalDays(): number {
        return this.endDate.diff(this.startDate, 'days').days + 1
    }

    /**
     * @param today "today" dateTime for testing
     * @returns days left in period (in future) including today
     */
    daysLeft(today: DateTime): number {
        if (this.endDate < today) return 0

        if (this.startDate > today) return this.totalDays

        return this.endDate.diff(today, 'days').days + 1
    }

    includesDate(date: DateTime): boolean {
        return date >= this.startDate && date <= this.endDate
    }
}

export class ThisMonthTimeSpan extends HumanTimeSpan {
    get startDate(): DateTime {
        return utcToday().set({ day: 1 })
    }

    get endDate(): DateTime {
        const today = utcToday()
        return today.set({ day: today.daysInMonth })
    }
}

export class ThisYearTimeSpan extends HumanTimeSpan {
    get startDate(): DateTime {
        return utcToday().set({ day: 1, month: 1 })
    }

    get endDate(): DateTime {
        return utcToday().set({ day: 31, month: 12 })
    }
}

export class MonthTimeSpan extends HumanTimeSpan {
    readonly year: number
    readonly month: number

    constructor(year: number, month: number) {
        super()
        this.year = year
        this.month = month
    }

    get startDate(): DateTime {
        return DateTime.utc(this.year, this.month)
    }

    get endDate(): DateTime {
        const date = DateTime.utc(this.year, this.month)
        return date.set({ day: date.daysInMonth })
    }
}

export class YearTimeSpan extends HumanTimeSpan {
    readonly year: number

    constructor(year: number) {
        super()
        this.year = year
    }

    get startDate(): DateTime {
        return DateTime.utc(this.year)
    }

    get endDate(): DateTime {
        return DateTime.utc(this.year, 12, 31)
    }
}

export class LastPeriodTimeSpan extends HumanTimeSpan {
    readonly duration: DurationLike

    constructor(duration: DurationLike) {
        super()
        this.duration = duration
    }

    get startDate(): DateTime {
        return utcToday().minus(this.duration).plus({ day: 1 })
    }

    get endDate(): DateTime {
        return utcToday()
    }
}

export class CustomTimeSpan extends HumanTimeSpan {
    private readonly _start: DateTime
    private readonly _end: DateTime

    constructor(start: DateTime, end: DateTime) {
        super()
        this._start = start
        this._end = end
    }

    get startDate(): DateTime {
        return this._start
    }

    get endDate(): DateTime {
        return this._end
    }
}

export class AllHistoryTimeSpan extends HumanTimeSpan {
    private readonly engine: Engine

    constructor(engine: Engine) {
        super()
        this.engine = engine
    }

    get startDate(): DateTime {
        const firstOp = this.engine.firstOp
        return firstOp?.date ?? utcToday()
    }

    get endDate(): DateTime {
        return utcToday()
    }
}
