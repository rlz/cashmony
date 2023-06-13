import React, { type ReactElement, useState } from 'react'
import { MainAppDrawer } from './MainAppDrawer'
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faCircleCheck, faCircleChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

interface Props {
    title?: string
    navigateOnBack?: string
    noDrawer?: boolean
    onBack?: () => void
    onSave?: (() => void) | (() => Promise<void>) | null
}

export const MainAppBar = ({ title, navigateOnBack, onBack, onSave, noDrawer }: Props): ReactElement => {
    const navigate = useNavigate()
    const [inProgress, setInProgress] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)

    if (onBack === undefined && navigateOnBack !== undefined) {
        onBack = () => { navigate(navigateOnBack) }
    }

    return <>
        {
            noDrawer === true
                ? null
                : <MainAppDrawer
                    open={drawerOpen}
                    onOpen={() => { setDrawerOpen(true) }}
                    onClose={() => { setDrawerOpen(false) }}
                />
        }
        <AppBar position="static">
            <Toolbar>
                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={() => { setDrawerOpen(true) }}
                >
                    <FontAwesomeIcon icon={faBars}/>
                </IconButton>
                {
                    onBack === undefined
                        ? null
                        : <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={onBack}
                        >
                            <FontAwesomeIcon icon={faCircleChevronLeft}/>
                        </IconButton>

                }
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {title ?? 'Cashmony'}
                </Typography>
                {
                    onSave !== undefined
                        ? <IconButton
                            disabled={onSave === null}
                            size="large"
                            edge="end"
                            color="inherit"
                            aria-label="menu"
                            sx={{ ml: 2 }}
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
