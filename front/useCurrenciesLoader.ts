import { createContext, useContext } from 'react'

import { CurrenciesLoader } from '../currencies/currencies.js'

const currenciesLoaderContext = createContext<CurrenciesLoader | null>(null)

export const CurrenciesLoaderProvider = currenciesLoaderContext.Provider

export function useCurrenciesLoader(): CurrenciesLoader {
    const l = useContext(currenciesLoaderContext)

    if (l === null) {
        throw Error('CurrensiesLoader is not provided')
    }

    return l
}
