import { faBars, faCircleCheck, faCircleChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, Button, Divider, IconButton, Modal, Paper, SwipeableDrawer, Toolbar, Typography } from '@mui/material'
import React, { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { showIf } from '../../helpers/smallTools'
import { useWidth, widthOneOf } from '../../helpers/useWidth'
import { Row } from '../generic/Containers'
import { AppStateSettings } from './AppStateSettings'

interface Props {
    title?: string
    navigateOnBack?: string
    noSettings?: boolean
    onBack?: () => void
    onSave?: (() => void) | (() => Promise<void>) | null
}

export const MainAppBar = ({ title, navigateOnBack, onBack, onSave, noSettings }: Props): ReactElement => {
    const navigate = useNavigate()
    const [inProgress, setInProgress] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)

    const width = useWidth()

    if (onBack === undefined && navigateOnBack !== undefined) {
        onBack = () => { navigate(navigateOnBack) }
    }

    return <>
        {
            showIf(
                noSettings !== true && widthOneOf(width, ['xs', 'sm']),
                <SwipeableDrawer
                    open={settingsOpen}
                    anchor='left'
                    onOpen={() => { setSettingsOpen(true) }}
                    onClose={() => { setSettingsOpen(false) }}
                >
                    <AppStateSettings height='100vh' width='90vw' maxWidth='20rem'/>
                </SwipeableDrawer>
            )
        }
        {
            showIf(
                noSettings !== true && !widthOneOf(width, ['xs', 'sm']),
                <Modal
                    open={settingsOpen}
                    onClose={() => { setSettingsOpen(false) }}
                >
                    <Paper sx={{ width: 550, mt: 4, mx: 'auto', p: 1 }}>
                        <AppStateSettings />
                        <Divider sx={{ my: 1 }}/>
                        <Row justifyContent='flex-end'>
                            <Button onClick={() => { setSettingsOpen(false) }}>
                                Close
                            </Button>
                        </Row>
                    </Paper>
                </Modal>
            )
        }
        <AppBar position='static'>
            <Toolbar>
                {noSettings === true
                    ? null
                    : <IconButton
                        size='large'
                        edge='start'
                        color='inherit'
                        sx={{ mr: 1 }}
                        onClick={() => { setSettingsOpen(true) }}
                    >
                        <FontAwesomeIcon icon={faBars}/>
                    </IconButton>
                }
                {
                    onBack === undefined
                        ? null
                        : <IconButton
                            size='large'
                            edge='start'
                            color='inherit'
                            sx={{ mr: 1 }}
                            onClick={onBack}
                        >
                            <FontAwesomeIcon icon={faCircleChevronLeft}/>
                        </IconButton>

                }
                <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
                    {title ?? 'Cashmony'}
                </Typography>
                {
                    onSave !== undefined
                        ? <IconButton
                            disabled={onSave === null}
                            size='large'
                            edge='end'
                            color='inherit'
                            sx={{ ml: 1 }}
                            onClick={() => {
                                if (onSave === null) {
                                    throw Error('Non null onSave expected here')
                                }

                                setInProgress(true)

                                setTimeout(() => {
                                    const ret = onSave()
                                    if (ret !== undefined) {
                                        void ret.then(() => {
                                            setInProgress(false)
                                        })
                                    } else {
                                        setInProgress(false)
                                    }
                                })
                            }}
                        >
                            {
                                inProgress
                                    ? <FontAwesomeIcon icon={faSpinner} spinPulse />
                                    : <FontAwesomeIcon icon={faCircleCheck}/>
                            }
                        </IconButton>
                        : undefined
                }
            </Toolbar>
        </AppBar>
    </>
}
