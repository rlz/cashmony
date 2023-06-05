import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, type SwipeableDrawerProps, Box } from '@mui/material'
import React, { type ReactElement } from 'react'
import { observer } from 'mobx-react-lite'
import { syncDataWithGoogle } from '../model/sync'
import { PeriodSelector } from './PeriodSelector'

export const MainAppDrawer = observer((props: SwipeableDrawerProps): ReactElement => {
    return <SwipeableDrawer
        open={props.open}
        anchor='left'
        onOpen={props.onOpen}
        onClose={props.onClose}
    >
        <Box display="flex" flexDirection="column" gap={1} height="100%" width="90vw" maxWidth="20rem">
            <Box flex="1 1 0" mt={1} px={1}>
                <PeriodSelector/>
            </Box>
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => { void syncDataWithGoogle() }}>
                        <ListItemIcon>
                            <FontAwesomeIcon icon={faCloudArrowUp} />
                        </ListItemIcon>
                        <ListItemText primary="Sync with Google" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    </SwipeableDrawer>
})
