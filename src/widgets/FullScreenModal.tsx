import { Box, Modal } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement } from 'react'

import { screenWidthIs } from '../helpers/useWidth'
import { Column, Row } from './generic/Containers'
import { CashmonyAppBar } from './mainScreen/MainAppBar'

interface Props extends PropsWithChildren {
    title: string
    width?: Parameters<typeof Column>[0]['width']
    onClose: () => void
}

export const FullScreenModal = (props: Props): ReactElement => {
    const smallScreen = screenWidthIs('xs', 'sm')

    return <Modal
        open={true}
        onClose={props.onClose}
    >
        <Box>
            <Row
                justifyContent={'center'}
                mt={smallScreen ? undefined : 10}
            >
                <Column
                    width={smallScreen ? '100vw' : props.width}
                    height={smallScreen ? '100vh' : undefined}
                    maxWidth={smallScreen ? '100vw' : '850px'}
                    maxHeight={smallScreen ? '100vh' : 'calc(100vh - 160px)'}
                    position={'relative'}
                >
                    <CashmonyAppBar
                        modal
                        title={props.title}
                        subTitle={null}
                        onClose={props.onClose}
                    />
                    <Box
                        flex={smallScreen ? '1 1 auto' : '0 1 auto'}
                        bgcolor={'background.default'}
                        overflow={'auto'}
                    >
                        {props.children}
                    </Box>
                </Column>
            </Row>
        </Box>
    </Modal>
}
