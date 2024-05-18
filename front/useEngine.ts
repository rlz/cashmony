import { createContext, useContext } from 'react'

import { Engine } from '../engine/engine'

const engineContext = createContext<Engine | null>(null)

export const EngineProvider = engineContext.Provider

export function useEngine(): Engine {
    const e = useContext(engineContext)

    if (e === null) {
        throw Error('Engine is not provided')
    }

    return e
}
