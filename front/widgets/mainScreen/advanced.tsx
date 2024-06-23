import { Box, Button, Stack } from '@mui/material'

import { apiClearAll } from '../../../api/api'
import { apiSync } from '../../model/apiSync'
import { useAuth, useFrontState } from '../../model/FrontState'
import { useEngine } from '../../useEngine'

export function Advanced(): JSX.Element {
    const frontState = useFrontState()
    const engine = useEngine()
    const auth = useAuth()

    return (
        <Box padding={1}>
            <Stack direction={'column'} gap={1}>
                <Button
                    variant={'contained'}
                    fullWidth
                    onClick={async () => {
                        await apiClearAll(auth)
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
                        await apiSync(frontState, engine, true)
                    }}
                >
                    {'Full Sync'}
                </Button>
            </Stack>
        </Box>
    )
}
