import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../dates'

export interface Point {
    date: DateTime<true>
    value: number
}

export interface TotalAndChangeStats {
    currency: string
    timeSpan: HumanTimeSpan
    today: DateTime
    todayChange: number
    total: number
    dayChange: Point[]
    sWeekChange: Point[]
    mWeekChange: Point[]
    monthChange: Point[]
    dayTotal: Point[]
    sWeekTotal: Point[]
    mWeekTotal: Point[]
    monthTotal: Point[]
}
