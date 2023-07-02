import React, { type ReactElement, type PropsWithChildren } from 'react'
import { Box, Button, Divider, Modal } from '@mui/material'
import { MainAppBar } from './mainScreen/MainAppBar'
import { useWidth, widthOneOf } from '../helpers/useWidth'
import { Column, Row } from './Containers'
import { showIf } from '../helpers/smallTools'

interface Props extends PropsWithChildren {
    title?: string
    onClose: () => void
    onSave?: (() => void) | null
}

export const FullScreenModal = (props: Props): ReactElement => {
    const bigScreen = !widthOneOf(useWidth(), ['xs', 'sm'])

    return <Modal open={true}>
        <Column
            maxWidth={900}
            mx='auto'
            width='100vw'
            height='100vh'
            justifyContent='center'
        >
            <MainAppBar
                noSettings
                title={props.title}
                onBack={bigScreen ? undefined : props.onClose}
                onSave={bigScreen ? undefined : props.onSave}
            />
            <Box
                flex='0 1 auto'
                bgcolor='background.default'
                maxHeight={bigScreen ? 700 : undefined}
            >
                {props.children}
            </Box>
            {
                showIf(
                    bigScreen,
                    <Box px={1} bgcolor='background.default' >
                        <Divider/>
                        <Row py={1} justifyContent='end'>
                            <Button onClick={props.onClose} color='secondary'>Close</Button>
                            {
                                props.onSave !== undefined
                                    ? <Button
                                        disabled={props.onSave === null}
                                        onClick={props.onSave ?? undefined}
                                    >Ok</Button>
                                    : null
                            }
                        </Row>
                    </Box>
                )
            }
        </Column>
    </Modal>
}
