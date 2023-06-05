import { makeAutoObservable, runInAction } from 'mobx'
import { CustomTimeSpan, type HumanTimeSpan, LastPeriodTimeSpan, MonthTimeSpan, ThisMonthTimeSpan, ThisYearTimeSpan, YearTimeSpan, utcToday } from '../helpers/dates'
import { DateTime, type DurationLikeObject } from 'luxon'

let appState: AppState | null = null

interface ThisMonthTimeSpanInfo {
    readonly type: 'thisMonth'
}

interface ThisYearTimeSpanInfo {
    readonly type: 'thisYear'
}

interface MonthTimeSpanInfo {
    readonly type: 'month'
    readonly year: number
    readonly month: number
}

interface YearTimeSpanInfo {
    readonly type: 'year'
    readonly year: number
}

interface LastPeriodTimeSpanInfo {
    readonly type: 'lastPeriod'
    readonly duration: DurationLikeObject
}

interface DateInfo {
    readonly year: number
    readonly month: number
    readonly day: number
}

interface CustomTimeSpanInfo {
    readonly type: 'custom'
    readonly from: DateInfo
    readonly to: DateInfo
}

type TimeSpanInfo = ThisMonthTimeSpanInfo | ThisYearTimeSpanInfo | MonthTimeSpanInfo | YearTimeSpanInfo | LastPeriodTimeSpanInfo | CustomTimeSpanInfo

export class AppState {
    today = utcToday()
    timeSpanInfo: TimeSpanInfo = { type: 'thisMonth' }

    private constructor () {
        makeAutoObservable(this)

        setInterval(() => {
            const today = utcToday()
            if (today > this.today) {
                runInAction(() => {
                    this.today = today
                })
            }
        }, 10000)
    }

    get timeSpan (): HumanTimeSpan {
        if (this.timeSpanInfo.type === 'thisMonth') {
            return new ThisMonthTimeSpan()
        }

        if (this.timeSpanInfo.type === 'thisYear') {
            return new ThisYearTimeSpan()
        }

        if (this.timeSpanInfo.type === 'month') {
            return new MonthTimeSpan(this.timeSpanInfo.year, this.timeSpanInfo.month)
        }

        if (this.timeSpanInfo.type === 'year') {
            return new YearTimeSpan(this.timeSpanInfo.year)
        }

        if (this.timeSpanInfo.type === 'lastPeriod') {
            return new LastPeriodTimeSpan(this.timeSpanInfo.duration)
        }

        return new CustomTimeSpan(makeDate(this.timeSpanInfo.from), makeDate(this.timeSpanInfo.to))
    }

    static instance (): AppState {
        if (appState === null) {
            appState = new AppState()
        }

        return appState
    }
}

function makeDate (dateInfo: DateInfo): DateTime {
    return DateTime.utc(dateInfo.year, dateInfo.month, dateInfo.day)
}
