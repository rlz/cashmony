import { type Breakpoint, type Theme, useTheme, useMediaQuery } from '@mui/material'

export function useWidth (): Breakpoint {
    const theme: Theme = useTheme()
    const keys: readonly Breakpoint[] = [...theme.breakpoints.keys].reverse()
    let key: Breakpoint | null = null
    for (const k of keys) {
        if (useMediaQuery(theme.breakpoints.up(k)) && key === null) {
            key = k
        }
    }
    return key ?? 'xs'
}

export function widthOneOf (width: Breakpoint, breakpoints: Breakpoint[]): boolean {
    return breakpoints.some(i => i === width)
}
