import { Typography, type TypographyProps } from '@mui/material'
import React, { type PropsWithChildren, type ReactElement } from 'react'

export function DivBody1(props: PropsWithChildren<Omit<TypographyProps<'div'>, 'variant'>>): ReactElement {
    return (
        <Typography component={'div'} variant={'body1'} {...props}>
            {props.children}
        </Typography>
    )
}

export function DivBody2(props: PropsWithChildren<Omit<TypographyProps<'div'>, 'variant'>>): ReactElement {
    return (
        <Typography component={'div'} variant={'body2'} {...props}>
            {props.children}
        </Typography>
    )
}

export function SpanBody1(props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return (
        <Typography component={'span'} variant={'body1'} {...props}>
            {props.children}
        </Typography>
    )
}

export function SpanBody2(props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return (
        <Typography component={'span'} variant={'body2'} {...props}>
            {props.children}
        </Typography>
    )
}

export function PBody1(props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return (
        <Typography variant={'body1'} {...props}>
            {props.children}
        </Typography>
    )
}

export function PBody2(props: PropsWithChildren<Omit<TypographyProps, 'variant'>>): ReactElement {
    return (
        <Typography variant={'body2'} {...props}>
            {props.children}
        </Typography>
    )
}

export function Bold(props: PropsWithChildren<Omit<TypographyProps, 'fontWeight'>>): ReactElement {
    return (
        <Typography component={'span'} fontWeight={'bold'} {...props}>
            {props.children}
        </Typography>
    )
}

export function Italic(props: PropsWithChildren<Omit<TypographyProps, 'fontStyle'>>): ReactElement {
    return (
        <Typography component={'span'} fontStyle={'italic'} {...props}>
            {props.children}
        </Typography>
    )
}
