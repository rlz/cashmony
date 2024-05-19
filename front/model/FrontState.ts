import { DateTime } from 'luxon'
import { autorun, makeAutoObservable, runInAction } from 'mobx'
import { createContext, useContext } from 'react'

import { ApiAuthResponseV0 } from '../../common/api_v0'
import { AllHistoryTimeSpan, CustomTimeSpan, type HumanTimeSpan, LastPeriodTimeSpan, MonthTimeSpan, ThisMonthTimeSpan, ThisYearTimeSpan, utcToday, YearTimeSpan } from '../../engine/dates'
import { Engine } from '../../engine/engine'
import { Filter } from '../../engine/model'
import { run } from '../helpers/smallTools'

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

const AUTH_LS_KEY = 'AppState.auth'
const TIME_SPAN_INFO_LS_KEY = 'AppState.timeSpanInfo'
const THEME_LS_KEY = 'AppState.theme'
const MASTER_CURRENCY_LS_KEY = 'AppState.masterCurrency'
const FILTER_LS_KEY = 'AppState.filter'

type UserThemeType = 'light' | 'dark' | 'auto'

export class FrontState {
    private readonly engine: Engine

    today = utcToday()

    auth: ApiAuthResponseV0 | null = JSON.parse(localStorage.getItem(AUTH_LS_KEY) ?? 'null') as ApiAuthResponseV0 | null
    theme: UserThemeType = (localStorage.getItem(THEME_LS_KEY) as UserThemeType | null) ?? 'auto'
    timeSpanInfo: TimeSpanInfo = JSON.parse(localStorage.getItem(TIME_SPAN_INFO_LS_KEY) ?? '{ "type": "thisMonth" }')
    masterCurrency: string = localStorage.getItem(MASTER_CURRENCY_LS_KEY) ?? 'USD'

    filter = run((): Filter => {
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

    constructor(engine: Engine) {
        this.engine = engine

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
            localStorage.setItem(AUTH_LS_KEY, JSON.stringify(this.auth))
        })

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
            localStorage.setItem(FILTER_LS_KEY, JSON.stringify(this.filter))
        })
    }

    get timeSpan(): HumanTimeSpan {
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
            return new AllHistoryTimeSpan(this.engine)
        }

        return new CustomTimeSpan(makeDate(this.timeSpanInfo.from), makeDate(this.timeSpanInfo.to))
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

function makeDate(dateInfo: DateInfo): DateTime {
    return DateTime.utc(dateInfo.year, dateInfo.month, dateInfo.day)
}

const frontStateContext = createContext<FrontState | null>(null)

export const FrontStateProvider = frontStateContext.Provider

export function useFrontState(): FrontState {
    const s = useContext(frontStateContext)

    if (s === null) {
        throw Error('AppState in not provided')
    }

    return s
}

export function useAuth(): ApiAuthResponseV0 {
    const auth = useFrontState().auth

    if (auth === null) {
        throw Error('Unauthenticated')
    }

    return auth
}
