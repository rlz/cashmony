import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, SwipeableDrawer, type SwipeableDrawerProps, TextField } from '@mui/material'
import React, { type ReactElement } from 'react'
import { type Operation, OperationsModel } from '../model/operations'
import { runInAction } from 'mobx'
import { DateTime } from 'luxon'
import { observer } from 'mobx-react-lite'
import { Google } from '../google/google'
import { loadOperations } from '../google/loadOperations'
import deepEqual from 'fast-deep-equal'

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
    const googleOps = await loadOperations(google)
    const localOps = operations.operations

    const googleOpsMap = new Map<string, Operation>()
    googleOps.forEach(o => googleOpsMap.set(o.id, o))

    const localOpsMap = new Map<string, Operation>()
    localOps.forEach(o => localOpsMap.set(o.id, o))

    let matched = 0
    const latestInGoogle: Operation[] = []
    let latestInLocal = 0
    let missedInGoogle = 0
    const missedInLocal: Operation[] = []
    const deletedInGoogle: Operation[] = []
    let deletedInLocal = 0

    for (const googleOp of googleOps) {
        const localOp = localOpsMap.get(googleOp.id)

        if (localOp === undefined) {
            missedInLocal.push(googleOp)
            continue
        }

        localOpsMap.delete(googleOp.id)

        if (deepEqual(googleOp, localOp)) {
            matched += 1
        } else if (googleOp.type === 'deleted') {
            deletedInGoogle.push(googleOp)
        } else if (localOp.type === 'deleted') {
            deletedInLocal += 1
        } else if (localOp.lastModified.toMillis() >= googleOp.lastModified.toMillis()) {
            latestInLocal += 1
        } else {
            latestInGoogle.push(googleOp)
        }
    }

    missedInGoogle = localOpsMap.size

    console.log('Sync Result', {
        matched,
        latestInGoogle: latestInGoogle.length,
        latestInLocal,
        missedInGoogle,
        missedInLocal: missedInLocal.length,
        deletedInGoogle: deletedInGoogle.length,
        deletedInLocal
    })
}
