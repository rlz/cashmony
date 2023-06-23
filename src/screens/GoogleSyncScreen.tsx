import React, { useEffect, type ReactElement, useState } from 'react'
import { Google } from '../google/google'
import { useLocation, useNavigate } from 'react-router-dom'
import { type SyncStats, syncAccounts, syncCategories, syncOperations, type SyncStatsEx } from '../model/sync'
import { FullScreenModal } from '../widgets/FullScreenModal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDownLong, faArrowUpLong, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { Box, Typography } from '@mui/material'
import { runAsync } from '../helpers/smallTools'

const google = Google.instance()

let syncInProgress = false

export function GoogleSyncScreen (): ReactElement {
    const location = useLocation()
    const navigate = useNavigate()
    const [spreadsheet, setSpreadsheet] = useState(false)
    const [accStats, setAccStats] = useState<SyncStats | null>(null)
    const [catStats, setCatStats] = useState<SyncStats | null>(null)
    const [opsStats, setOpsStats] = useState<SyncStatsEx | null>(null)

    const searchParams = new URLSearchParams(location.search)

    useEffect(() => {
        setSpreadsheet(false)
        setAccStats(null)
        setCatStats(null)
        setOpsStats(null)

        runAsync(async (): Promise<void> => {
            if (syncInProgress) return
            syncInProgress = true
            try {
                const accessToken = searchParams.get('auth')
                if (accessToken === null) {
                    throw Error('Unexpected search string: ' + location.search)
                }

                google.finishAuth(accessToken)

                await google.searchOrCreateDataSpreadsheet()
                setSpreadsheet(true)

                const [accStats, catStats] = await Promise.all([syncAccounts(), syncCategories()])

                setAccStats(accStats)
                setCatStats(catStats)

                setOpsStats(await syncOperations())
            } finally {
                syncInProgress = false
            }
        })
    }, [])

    return <FullScreenModal
        title="Sync with Google"
        onClose={() => { navigate(searchParams.get('redirect') ?? '/') }}
    >
        <Box display="flex">
            <Box>Search/create spreadsheet</Box>
            <Box flex="1 1 0" textAlign="right">
                {spreadsheet
                    ? 'ok'
                    : <FontAwesomeIcon icon={faSpinner} pulse/>
                }
            </Box>
        </Box>
        <Typography component="div" variant='body2'>
            <Stats title='Accounts' stats={accStats}/>
            <Stats title='Categories' stats={catStats}/>
            <Stats title='Operations' stats={opsStats} extended/>
        </Typography>
    </FullScreenModal>
}

interface StatsProps {
    title: string
    extended?: boolean
    stats: SyncStats | SyncStatsEx | null
}

function Stats ({ title, extended, stats }: StatsProps): ReactElement {
    const primary = (value: number): ReactElement => {
        return <Typography component="span" color={value === 0 ? undefined : 'info.main'}>
            {value}
        </Typography>
    }

    return <>
        <Typography variant='h6' mt={1}>{title}</Typography>
        <Box display="flex">
            <Box>Matched</Box>
            <Box flex="1 1 0" textAlign="right">
                {stats !== null
                    ? primary(stats.matched)
                    : <FontAwesomeIcon icon={faSpinner} pulse/>
                }
            </Box>
        </Box>
        <Box display="flex" gap={2}>
            <Box>Updated</Box>
            <Box flex="1 1 0" textAlign="right">
                {stats !== null
                    ? <>
                        <FontAwesomeIcon icon={faArrowUpLong}/>
                        {' '}{primary(stats.latestInLocal)}
                    </>
                    : null
                }
            </Box>
            <Box>
                {stats !== null
                    ? <>
                        <FontAwesomeIcon icon={faArrowDownLong}/>
                        {' '}{primary(stats.latestInGoogle)}
                    </>
                    : <FontAwesomeIcon icon={faSpinner} pulse/>
                }
            </Box>
        </Box>
        <Box display="flex" gap={2}>
            <Box>Added</Box>
            <Box flex="1 1 0" textAlign="right">
                {stats !== null
                    ? <>
                        <FontAwesomeIcon icon={faArrowUpLong}/>
                        {' '}{primary(stats.missedInGoogle)}
                    </>
                    : null
                }
            </Box>
            <Box>
                {stats !== null
                    ? <>
                        <FontAwesomeIcon icon={faArrowDownLong}/>
                        {' '}{primary(stats.missedInLocal)}
                    </>
                    : <FontAwesomeIcon icon={faSpinner} pulse/>
                }
            </Box>
        </Box>
        {
            extended === true
                ? <Box display="flex" gap={2}>
                    <Box>Deleted</Box>
                    <Box flex="1 1 0" textAlign="right">
                        {stats !== null && 'deletedInGoogle' in stats
                            ? <>
                                <FontAwesomeIcon icon={faArrowUpLong}/>
                                {' '}{primary(stats.deletedInLocal)}
                            </>
                            : null
                        }
                    </Box>
                    <Box>
                        {stats !== null && 'deletedInGoogle' in stats
                            ? <>
                                <FontAwesomeIcon icon={faArrowDownLong}/>
                                {' '}{primary(stats.deletedInGoogle)}
                            </>
                            : <FontAwesomeIcon icon={faSpinner} pulse/>
                        }
                    </Box>
                </Box>
                : null
        }
    </>
}