import React, { type ReactElement } from 'react'
import { AppState } from '../model/appState'
import { observer } from 'mobx-react-lite'
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons'
import { runInAction } from 'mobx'

const appState = AppState.instance()

export const PeriodSelector = observer((): ReactElement => {
    return <Box display="flex" flexDirection="column" gap={1}>
        <Box>
            <Typography variant='h6' textAlign="center">Period</Typography>
            <Typography variant='body1' textAlign="center">
                {appState.timeSpan.startDate.toISODate()}
                {' '}<FontAwesomeIcon icon={faArrowRightLong}/>{' '}
                {appState.timeSpan.endDate.toISODate()}
            </Typography>
        </Box>
        <Box display="flex" gap={1} justifyContent='space-between' alignItems="center">
            <Typography>Current:</Typography>
            <ToggleButtonGroup
                size='small'
                color="primary"
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
                aria-label="Platform"
            >
                <ToggleButton value="thisMonth">Month</ToggleButton>
                <ToggleButton value="thisYear">Year</ToggleButton>
            </ToggleButtonGroup>
        </Box>
    </Box>
})
