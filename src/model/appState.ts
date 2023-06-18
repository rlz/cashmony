import { autorun, makeAutoObservable, runInAction } from 'mobx'
import { CustomTimeSpan, type HumanTimeSpan, LastPeriodTimeSpan, MonthTimeSpan, ThisMonthTimeSpan, ThisYearTimeSpan, YearTimeSpan, utcToday, AllHistoryTimeSpan } from '../helpers/dates'
import { DateTime } from 'luxon'
import { OperationsModel } from './operations'
import { run } from '../helpers/smallTools'

const operationsModel = OperationsModel.instance()

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

interface LastMonthTimeSpanInfo {
    readonly type: 'lastMonth'
}

interface LastQuarterTimeSpanInfo {
    readonly type: 'lastQuarter'
}

interface LastYearTimeSpanInfo {
    readonly type: 'lastYear'
}

interface AllHistoryTimeSpanInfo {
    readonly type: 'allHistory'
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

type TimeSpanInfo = ThisMonthTimeSpanInfo |
ThisYearTimeSpanInfo | MonthTimeSpanInfo | YearTimeSpanInfo |
LastMonthTimeSpanInfo | LastQuarterTimeSpanInfo | LastYearTimeSpanInfo |
AllHistoryTimeSpanInfo | CustomTimeSpanInfo

const TIME_SPAN_INFO = 'AppState.timeSpanInfo'
const THEME = 'AppState.theme'
const MASTER_CURRENCY = 'AppState.masterCurrency'
const TOTAL_GOAL = 'AppState.totalGoal'
const UNCATEGORIZED_GOAL = 'AppState.uncategorizedGoal'

type UserThemeType = 'light' | 'dark' | 'auto'

export class AppState {
    today = utcToday()
    theme: UserThemeType = (localStorage.getItem(THEME) as UserThemeType | null) ?? 'auto'
    timeSpanInfo: TimeSpanInfo = JSON.parse(localStorage.getItem(TIME_SPAN_INFO) ?? '{ "type": "thisMonth" }')
    masterCurrency: string = localStorage.getItem(MASTER_CURRENCY) ?? 'USD'
    totalGoal: number | null = run(() => {
        const val = localStorage.getItem(TOTAL_GOAL)
        if (val === null) {
            return null
        }
        return parseFloat(val)
    })

    uncategorizedGoal: number | null = run(() => {
        const val = localStorage.getItem(UNCATEGORIZED_GOAL)
        if (val === null) {
            return null
        }
        return parseFloat(val)
    })

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

        autorun(() => {
            localStorage.setItem(TIME_SPAN_INFO, JSON.stringify(this.timeSpanInfo))
        })

        autorun(() => {
            localStorage.setItem(THEME, this.theme)
        })

        autorun(() => {
            localStorage.setItem(MASTER_CURRENCY, this.masterCurrency)
        })

        autorun(() => {
            if (this.totalGoal === null) {
                localStorage.removeItem(TOTAL_GOAL)
            } else {
                localStorage.setItem(TOTAL_GOAL, this.totalGoal.toString())
            }
        })

        autorun(() => {
            if (this.uncategorizedGoal === null) {
                localStorage.removeItem(UNCATEGORIZED_GOAL)
            } else {
                localStorage.setItem(UNCATEGORIZED_GOAL, this.uncategorizedGoal.toString())
            }
        })
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

        if (this.timeSpanInfo.type === 'lastMonth') {
            return new LastPeriodTimeSpan({ month: 1 })
        }

        if (this.timeSpanInfo.type === 'lastQuarter') {
            return new LastPeriodTimeSpan({ quarter: 1 })
        }

        if (this.timeSpanInfo.type === 'lastYear') {
            return new LastPeriodTimeSpan({ year: 1 })
        }

        if (this.timeSpanInfo.type === 'allHistory') {
            return new AllHistoryTimeSpan(operationsModel)
        }

        return new CustomTimeSpan(makeDate(this.timeSpanInfo.from), makeDate(this.timeSpanInfo.to))
    }

    get daysLeft (): number {
        const timeSpan = this.timeSpan
        const today = this.today
        if (timeSpan.endDate < today) return 0

        return timeSpan.endDate.diff(today, 'days').days
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
