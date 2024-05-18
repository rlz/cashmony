import React, { type ReactElement } from 'react'

import { Column } from '../widgets/generic/Containers'

export function LoadingScreen(): ReactElement {
    return (
        <Column mt={3} textAlign={'center'}>
            {'Loading...'}
        </Column>
    )
}
