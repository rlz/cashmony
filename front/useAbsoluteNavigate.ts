import { createContext, useContext } from 'react'

type NavigateType = (to: string) => void

const absoluteNavigateContext = createContext<NavigateType | null>(null)

export const AbsoluteNavigateProvider = absoluteNavigateContext.Provider

/**
 * Router useNavigate leads to rerender.
 * This useAbsoluteNavigate do not rerender
 */
export function useAbsoluteNavigate(): NavigateType {
    const e = useContext(absoluteNavigateContext)

    if (e === null) {
        throw Error('GlobalNavigate is not provided')
    }

    return e
}
