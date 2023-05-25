import { faCircleCheck, faCircleChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import React, { useState, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
    title: string | null
    navigateOnBack?: string
    onBack?: () => void
    onSave?: (() => void) | (() => Promise<void>)
}

export function EditorAppBar ({ title, navigateOnBack, onBack, onSave }: Props): ReactElement {
    const navigate = useNavigate()
    const [inProgress, setInProgress] = useState(false)

    if (onBack === undefined && navigateOnBack !== undefined) {
        onBack = () => { navigate(navigateOnBack) }
    }

    return <AppBar position="static">
        <Toolbar>
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
            <Typography variant='h6' flex='1 0 0'>{title}</Typography>
            {
                onSave !== undefined
                    ? <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        sx={{ ml: 2 }}
                        onClick={() => {
                            setInProgress(true)
                            setTimeout(() => {
                                const ret = onSave()
                                if (ret !== undefined) {
                                    void ret.then(() => {
                                        setInProgress(false)
                                    })
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
}
