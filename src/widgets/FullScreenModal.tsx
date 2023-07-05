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

const RefColumn = React.forwardRef(function RefColumn (props: Parameters<typeof Column>[0], _) {
    return <Column {...props}/>
})

export const FullScreenModal = (props: Props): ReactElement => {
    const bigScreen = !widthOneOf(useWidth(), ['xs', 'sm'])

    return <Modal open={true}>
        <RefColumn
            maxWidth={900}
            mx='auto'
            width='100vw'
            height='100vh'
            mt={bigScreen ? '5vh' : undefined}
            maxHeight={bigScreen ? '90vh' : undefined}
        >
            <MainAppBar
                noSettings
                title={props.title}
                onBack={bigScreen ? undefined : props.onClose}
                onSave={bigScreen ? undefined : props.onSave}
            />
            <Box
                flex={bigScreen ? '0 1 auto' : '1 1 auto'}
                bgcolor='background.default'
                overflow='scroll'
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
        </RefColumn>
    </Modal>
}
