import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, runInAction } from 'mobx'

import { AllHistoryTimeSpan, CustomTimeSpan, type HumanTimeSpan, LastPeriodTimeSpan, MonthTimeSpan, ThisMonthTimeSpan, ThisYearTimeSpan, utcToday, YearTimeSpan } from '../helpers/dates'
import { run } from '../helpers/smallTools'
import { type Filter } from './filter'
import { OperationsModel } from './operations'

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

const TIME_SPAN_INFO_LS_KEY = 'AppState.timeSpanInfo'
const THEME_LS_KEY = 'AppState.theme'
const MASTER_CURRENCY_LS_KEY = 'AppState.masterCurrency'
const TOTAL_GOAL_AMOUNT_LS_KEY = 'AppState.totalGoal'
const TOTAL_GOAL_CURRENCY_LS_KEY = 'AppState.totalGoalCurrency'
const UNCATEGORIZED_GOAL_AMOUNT_LS_KEY = 'AppState.uncategorizedGoal'
const UNCATEGORIZED_GOAL_CURRENCY_LS_KEY = 'AppState.uncategorizedGoalCurrency'
const FILTER_LS_KEY = 'AppState.filter'

type UserThemeType = 'light' | 'dark' | 'auto'

export class AppState {
    today = utcToday()
    theme: UserThemeType = (localStorage.getItem(THEME_LS_KEY) as UserThemeType | null) ?? 'auto'
    timeSpanInfo: TimeSpanInfo = JSON.parse(localStorage.getItem(TIME_SPAN_INFO_LS_KEY) ?? '{ "type": "thisMonth" }')
    masterCurrency: string = localStorage.getItem(MASTER_CURRENCY_LS_KEY) ?? 'USD'
    totalGoalAmount: number | null = run(() => {
        const val = localStorage.getItem(TOTAL_GOAL_AMOUNT_LS_KEY)
        if (val === null) {
            return null
        }
        return parseFloat(val)
    })

    totalGoalCurrency = localStorage.getItem(TOTAL_GOAL_CURRENCY_LS_KEY) ?? 'USD'

    uncategorizedGoalAmount: number | null = run(() => {
        const val = localStorage.getItem(UNCATEGORIZED_GOAL_AMOUNT_LS_KEY)
        if (val === null) {
            return null
        }
        return parseFloat(val)
    })

    uncategorizedGoalCurrency = localStorage.getItem(UNCATEGORIZED_GOAL_CURRENCY_LS_KEY) ?? 'USD'

    filter: Filter = run((): Filter => {
        const val = localStorage.getItem(FILTER_LS_KEY)
        if (val === null) {
            return {
                search: null,
                opTypeMode: 'selected',
                opType: ['adjustment', 'expense', 'income', 'transfer'],
                categoriesMode: 'all',
                categories: [],
                accountsMode: 'all',
                accounts: [],
                tagsMode: 'all',
                tags: []
            }
        }
        return JSON.parse(val) as Filter
    })

    topBarState = {
        subTitle: null as string | null,
        onClose: null as (() => void) | null,
        showGlobalCurrencySelector: false,
        showGlobalFilterEditor: false
    }

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
            localStorage.setItem(TIME_SPAN_INFO_LS_KEY, JSON.stringify(this.timeSpanInfo))
        })

        autorun(() => {
            localStorage.setItem(THEME_LS_KEY, this.theme)
        })

        autorun(() => {
            localStorage.setItem(MASTER_CURRENCY_LS_KEY, this.masterCurrency)
        })

        autorun(() => {
            if (this.totalGoalAmount === null) {
                localStorage.removeItem(TOTAL_GOAL_AMOUNT_LS_KEY)
            } else {
                localStorage.setItem(TOTAL_GOAL_AMOUNT_LS_KEY, this.totalGoalAmount.toString())
            }
        })

        autorun(() => {
            localStorage.setItem(TOTAL_GOAL_CURRENCY_LS_KEY, this.totalGoalCurrency)
        })

        autorun(() => {
            if (this.uncategorizedGoalAmount === null) {
                localStorage.removeItem(UNCATEGORIZED_GOAL_AMOUNT_LS_KEY)
            } else {
                localStorage.setItem(UNCATEGORIZED_GOAL_AMOUNT_LS_KEY, this.uncategorizedGoalAmount.toString())
            }
        })

        autorun(() => {
            localStorage.setItem(UNCATEGORIZED_GOAL_CURRENCY_LS_KEY, this.uncategorizedGoalCurrency)
        })

        autorun(() => {
            localStorage.setItem(FILTER_LS_KEY, JSON.stringify(this.filter))
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

        return timeSpan.endDate.diff(today, 'days').days + 1
    }

    static instance (): AppState {
        if (appState === null) {
            appState = new AppState()
        }

        return appState
    }

    public setSubTitle = (subtitle: string | null): void => {
        runInAction(() => {
            this.topBarState.subTitle = subtitle
        })
    }

    public setOnClose = (action: (() => void) | null): void => {
        runInAction(() => {
            if (action === null) {
                this.topBarState.onClose = null
                return
            }

            this.topBarState.onClose = () => {
                action()
                this.setOnClose(null)
            }
        })
    }
}

function makeDate (dateInfo: DateInfo): DateTime {
    return DateTime.utc(dateInfo.year, dateInfo.month, dateInfo.day)
}
