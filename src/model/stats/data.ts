import { DateTime } from 'luxon'

export interface Point {
    date: DateTime
    value: number
}

export interface TotalAndChangeStats {
    last: number
    dayChange: Point[]
    sWeekChange: Point[]
    mWeekChange: Point[]
    monthChange: Point[]
    dayTotal: Point[]
    sWeekTotal: Point[]
    mWeekTotal: Point[]
    monthTotal: Point[]
}
