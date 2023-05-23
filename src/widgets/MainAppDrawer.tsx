import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, type SwipeableDrawerProps, TextField } from '@mui/material'
import React, { type ReactElement } from 'react'
import { OperationsModel, syncDataWithGoogle } from '../model/operations'
import { runInAction } from 'mobx'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { utcToday } from '../helpers/dates'

export const MainAppDrawer = observer((props: SwipeableDrawerProps): ReactElement => {
    return <SwipeableDrawer
        open={props.open}
        anchor='left'
        onOpen={props.onOpen}
        onClose={props.onClose}
    >
        <List sx={{ width: '100vw', maxWidth: '20rem' }}>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void syncDataWithGoogle() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </ListItemIcon>
                    <ListItemText primary="Sync" />
                </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void runAction() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </ListItemIcon>
                    <ListItemText primary="Run action" />
                </ListItemButton>
            </ListItem>
        </List>
        <TextField
            type='date'
            label="Date"
            sx={{ m: 1 }}
            value={OperationsModel.instance().startDate.toFormat('yyyy-LL-dd')}
            onChange={(v) => {
                runInAction(() => {
                    const om = OperationsModel.instance()
                    if (v.target.value === '') {
                        om.startDate = utcToday()
                    } else {
                        om.startDate = DateTime.fromFormat(v.target.value, 'yyyy-LL-dd', { zone: 'utc' })
                    }
                })
            }}
        />
    </SwipeableDrawer>
})

async function runAction (): Promise<void> {
}
