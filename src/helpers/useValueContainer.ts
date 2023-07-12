import { useMemo } from 'react'

class ValueContainer<T> {
    private v: T

    constructor (v: T) {
        this.v = v
    }

    get val (): T {
        return this.v
    }

    set val (v: T) {
        this.v = v
    }
}

export function useValueContainer<T> (initial: T): ValueContainer<T> {
    return useMemo(() => new ValueContainer(initial), [])
}
