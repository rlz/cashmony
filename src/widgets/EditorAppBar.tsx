import { faCircleCheck, faCircleChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material'
import React, { type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
    title: string
    navigateOnBack: string
    onSave?: () => void
}

export function EditorAppBar ({ title, navigateOnBack, onSave }: Props): ReactElement {
    const navigate = useNavigate()

    return <AppBar position="static">
        <Toolbar>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => { navigate(navigateOnBack) }}
            >
                <FontAwesomeIcon icon={faCircleChevronLeft}/>
            </IconButton>
            <Typography variant='h6' flex='1 0 0'>{title}</Typography>
            {
                onSave !== undefined
                    ? <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        sx={{ ml: 2 }}
                        onClick={() => { navigate(navigateOnBack) }}
                    >
                        <FontAwesomeIcon icon={faCircleCheck}/>
                    </IconButton>
                    : undefined
            }
        </Toolbar>
    </AppBar>
}
