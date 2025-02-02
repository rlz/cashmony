import { Box, Button, Stack } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { JSX } from 'react'
import { useAuthState } from 'rlz-engine/dist/client/state/auth'

import { apiClearAll } from '../../../api/api'
import { utcToday } from '../../../engine/dates'
import { genTestData } from '../../../engine/testData/gen'
import { apiSync } from '../../model/apiSync'
import { useFrontState } from '../../model/FrontState'
import { useEngine } from '../../useEngine'

export const Advanced = observer(
    function Advanced(): JSX.Element {
        const frontState = useFrontState()
        const engine = useEngine()
        const authState = useAuthState()

        return (
            <Box padding={1}>
                <Stack direction={'column'} gap={1}>
                    <Button
                        variant={'contained'}
                        fullWidth
                        onClick={async () => {
                            if (authState.authParam !== null) {
                                await apiClearAll(authState.authParam)
                            }
                        }}
                    >
                        {'Clear Server Data'}
                    </Button>
                    <Button
                        variant={'contained'}
                        fullWidth
                        onClick={async () => {
                            await engine.clearData()
                        }}
                    >
                        {'Clear Local Data'}
                    </Button>
                    <Button
                        variant={'contained'}
                        fullWidth
                        onClick={async () => {
                            await apiSync(authState, frontState, engine, true)
                        }}
                    >
                        {'Full Sync'}
                    </Button>
                    <Button
                        variant={'contained'}
                        fullWidth
                        onClick={async () => {
                            const today = utcToday()
                            const td = genTestData(today.minus({ years: 5 }), today)
                            await engine.clearData()
                            td.accounts.forEach(i => engine.pushAccount(i))
                            td.categories.forEach(i => engine.pushCategory(i))
                            engine.pushOperations(td.operations)
                        }}
                    >
                        {'Generate Test Data'}
                    </Button>
                </Stack>
            </Box>
        )
    }
)
