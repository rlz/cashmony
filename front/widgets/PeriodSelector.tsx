import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, Divider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { DateTime } from 'luxon'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { type ReactElement, useState } from 'react'
import Calendar from 'react-calendar'

import { utcDate } from '../../engine/dates'
import { showIf } from '../helpers/smallTools'
import { screenWidthIs } from '../helpers/useWidth'
import { useAppState } from '../model/AppState'
import { FullScreenModal } from './FullScreenModal'
import { Row } from './generic/Containers'

export const PeriodSelector = observer((): ReactElement => {
    const appState = useAppState()

    const [showSelector, setShowSelector] = useState<'month' | 'year' | 'custom' | 'lastDays' | 'lastMonth' | null>(null)

    let selector: ReactElement | null = null
    if (showSelector === 'month') {
        selector = (
            <MonthSelector
                onClose={() => { setShowSelector(null) }}
                onMonthSelected={(year, month) => {
                    runInAction(() => {
                        appState.timeSpanInfo = {
                            type: 'month',
                            year,
                            month
                        }
                    })
                }}
            />
        )
    } else if (showSelector === 'year') {
        selector = (
            <YearSelector
                onClose={() => { setShowSelector(null) }}
                onYearSelected={(year) => {
                    runInAction(() => {
                        appState.timeSpanInfo = {
                            type: 'year',
                            year
                        }
                    })
                }}
            />
        )
    } else if (showSelector === 'custom') {
        selector = (
            <CustomSelector
                onClose={() => { setShowSelector(null) }}
                onPeriodSelected={(from, to) => {
                    runInAction(() => {
                        appState.timeSpanInfo = {
                            type: 'custom',
                            from: {
                                year: from.year,
                                month: from.month,
                                day: from.day
                            },
                            to: {
                                year: to.year,
                                month: to.month,
                                day: to.day
                            }
                        }
                    })
                }}
            />
        )
    }

    return (
        <Box display={'flex'} flexDirection={'column'} gap={1}>
            {selector}
            <Box>
                <Typography variant={'h6'} textAlign={'center'}>{'Period'}</Typography>
                <Typography variant={'body1'} textAlign={'center'}>
                    {appState.timeSpan.startDate.toISODate()}
                    {' '}
                    <FontAwesomeIcon icon={faArrowRightLong} />
                    {' '}
                    {appState.timeSpan.endDate.toISODate()}
                </Typography>
            </Box>
            <Box display={'flex'} gap={1} justifyContent={'space-between'} alignItems={'center'}>
                <Typography>{'Current:'}</Typography>
                <ToggleButtonGroup
                    size={'small'}
                    color={'primary'}
                    value={appState.timeSpanInfo.type}
                    exclusive
                    onChange={(_, value: 'thisMonth' | 'thisYear' | null) => {
                        if (value !== null) {
                            runInAction(() => {
                                appState.timeSpanInfo = {
                                    type: value
                                }
                            })
                        }
                    }}
                >
                    <ToggleButton value={'thisMonth'}>{'Month'}</ToggleButton>
                    <ToggleButton value={'thisYear'}>{'Year'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box display={'flex'} gap={1} justifyContent={'space-between'} alignItems={'center'}>
                <Typography>{'Selected:'}</Typography>
                <ToggleButtonGroup
                    size={'small'}
                    color={'primary'}
                    value={appState.timeSpanInfo.type}
                    exclusive
                    onChange={(_, value: 'month' | 'year' | null) => {
                        if (value !== null) {
                            setShowSelector(value)
                        } else if (appState.timeSpanInfo.type === 'month' || appState.timeSpanInfo.type === 'year') {
                            setShowSelector(appState.timeSpanInfo.type)
                        }
                    }}
                >
                    <ToggleButton value={'month'}>{'Month'}</ToggleButton>
                    <ToggleButton value={'year'}>{'Year'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box display={'flex'} gap={1} justifyContent={'space-between'} alignItems={'center'}>
                <Typography>{'Last:'}</Typography>
                <ToggleButtonGroup
                    size={'small'}
                    color={'primary'}
                    value={appState.timeSpanInfo.type}
                    exclusive
                    onChange={(_, value: 'lastMonth' | 'lastQuarter' | 'lastYear' | null) => {
                        if (value !== null) {
                            runInAction(() => {
                                appState.timeSpanInfo = {
                                    type: value
                                }
                            })
                        }
                    }}
                >
                    <ToggleButton value={'lastMonth'}>{'Month'}</ToggleButton>
                    <ToggleButton value={'lastQuarter'}>{'Quarter'}</ToggleButton>
                    <ToggleButton value={'lastYear'}>{'Year'}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <ToggleButtonGroup
                fullWidth
                size={'small'}
                color={'primary'}
                value={appState.timeSpanInfo.type}
                exclusive
                onChange={(_, value: 'custom' | 'allHistory' | null) => {
                    if (value === 'allHistory') {
                        runInAction(() => {
                            appState.timeSpanInfo = {
                                type: 'allHistory'
                            }
                        })
                    }
                    if (value === 'custom' || appState.timeSpanInfo.type === 'custom') {
                        setShowSelector('custom')
                    }
                }}
            >
                <ToggleButton value={'allHistory'}>{'All history'}</ToggleButton>
                <ToggleButton value={'custom'}>{'Custom'}</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    )
})

interface MonthSelectorProps {
    onClose: () => void
    onMonthSelected: (year: number, month: number) => void
}

function MonthSelector(props: MonthSelectorProps): ReactElement {
    const appState = useAppState()

    const today = appState.today

    return (
        <FullScreenModal title={'Select month'} onClose={props.onClose}>
            <Box p={1}>
                <Calendar
                    maxDate={today.toJSDate()}
                    maxDetail={'year'}
                    onChange={(d) => {
                        if (!(d instanceof Date)) return
                        props.onMonthSelected(d.getFullYear(), d.getMonth() + 1)
                        props.onClose()
                    }}
                />
            </Box>
        </FullScreenModal>
    )
}

interface YearSelectorProps {
    onClose: () => void
    onYearSelected: (year: number) => void
}

function YearSelector(props: YearSelectorProps): ReactElement {
    const appState = useAppState()

    const today = appState.today

    return (
        <FullScreenModal title={'Select year'} onClose={props.onClose}>
            <Box p={1}>
                <Calendar
                    maxDate={today.toJSDate()}
                    maxDetail={'decade'}
                    onChange={(d) => {
                        if (!(d instanceof Date)) return
                        props.onYearSelected(d.getFullYear())
                        props.onClose()
                    }}
                />
            </Box>
        </FullScreenModal>
    )
}

interface CustomSelectorProps {
    onClose: () => void
    onPeriodSelected: (from: DateTime, to: DateTime) => void
}

function CustomSelector(props: CustomSelectorProps): ReactElement {
    const appState = useAppState()

    const today = appState.today
    const [period, setPeriod] = useState<[DateTime, DateTime] | null>(null)
    const smallScreen = screenWidthIs('xs', 'sm')

    return (
        <FullScreenModal
            title={'Select period'}
            onClose={props.onClose}
        >
            <Box p={1} mb={1}>
                <Calendar
                    selectRange
                    maxDate={today.toJSDate()}
                    onChange={(range) => {
                        if (!(range instanceof Array)) return
                        setPeriod([utcDate(range[0] ?? DateTime.now()), utcDate(range[1] ?? DateTime.now())])
                    }}
                />
            </Box>
            { showIf(!smallScreen, <Divider />) }
            <Row p={1} justifyContent={smallScreen ? 'center' : 'end'}>
                <Button
                    color={'primary'}
                    variant={'contained'}
                    disabled={period === null}
                    onClick={() => {
                        if (period !== null) {
                            props.onPeriodSelected(...period)
                            props.onClose()
                        }
                    }}
                >
                    {'Save'}
                </Button>
            </Row>
        </FullScreenModal>
    )
}
