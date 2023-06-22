import { type TypographyProps, Typography } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement } from 'react'

export function SpanBody1 (props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return <Typography component='span' variant='body1' {...props}>
        {props.children}
    </Typography>
}

export function SpanBody2 (props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return <Typography component='span' variant='body2' {...props}>
        {props.children}
    </Typography>
}

export function PBody1 (props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return <Typography variant='body1' {...props}>
        {props.children}
    </Typography>
}

export function PBody2 (props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return <Typography variant='body2' {...props}>
        {props.children}
    </Typography>
}
