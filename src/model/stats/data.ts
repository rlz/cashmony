import { DateTime } from 'luxon'

import { HumanTimeSpan } from '../../helpers/dates'

export interface Point {
    date: DateTime
    value: number
}

export interface TotalAndChangeStats {
    timeSpan: HumanTimeSpan
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
