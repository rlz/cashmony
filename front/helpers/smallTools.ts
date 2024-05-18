import { type ReactElement } from 'react'

export function nonNull<T>(val: T, error: string): Exclude<T, null | undefined> {
    if (val === null || val === undefined) {
        throw Error(error)
    }

    return val as Exclude<T, null | undefined>
}

export function runAsync(action: () => Promise<void>): void {
    setTimeout(() => {
        void action()
    })
}

export function showIf(condition: boolean | null | undefined, element: ReactElement): ReactElement | undefined {
    if (condition === true) {
        return element
    }
}

export function showIfLazy(condition: boolean | null | undefined, elementFactory: () => ReactElement): ReactElement | undefined {
    if (condition === true) {
        return elementFactory()
    }
}

export function run<T>(action: () => T): T {
    return action()
}

export function times(count: number): number[] {
    const result = []
    for (let i = 0; i < count; ++i) {
        result.push(i)
    }
    return result
}
