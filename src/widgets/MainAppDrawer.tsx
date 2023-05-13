import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, type SwipeableDrawerProps, TextField } from '@mui/material'
import React, { type ReactElement } from 'react'
import { OperationsModel, fromOldGoogle } from '../model/operations'
import { runInAction } from 'mobx'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { Google } from '../google/google'
import { loadTransactions } from '../google/loadTransactions'

export const MainAppDrawer = observer((props: SwipeableDrawerProps): ReactElement => {
    return <SwipeableDrawer
        open={props.open}
        anchor='left'
        onOpen={props.onOpen}
        onClose={props.onClose}
    >
        <List sx={{ width: '100vw', maxWidth: '20rem' }}>
            <ListItem disablePadding>
                <ListItemButton onClick={() => { void loadDataFromGoogle() }}>
                    <ListItemIcon>
                        <FontAwesomeIcon icon={faCloudArrowUp} />
                    </ListItemIcon>
                    <ListItemText primary="Sync" />
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
                        const now = DateTime.now()
                        om.startDate = DateTime.utc(now.year, now.month, now.day)
                    } else {
                        om.startDate = DateTime.fromFormat(v.target.value, 'yyyy-LL-dd', { zone: 'utc' })
                    }
                })
            }}
        />
    </SwipeableDrawer>
})

const google = Google.instance()
const operations = OperationsModel.instance()

async function loadDataFromGoogle (): Promise<void> {
    await google.authenticate()
    await google.searchOrCreateDataSpreadsheet()
    await loadTransactions(google)
    await operations.put(fromOldGoogle(google.transactions))
}
