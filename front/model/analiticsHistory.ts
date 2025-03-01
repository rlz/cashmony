import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AnaliticsHistoryStore {
    history: string[]
    addHistory: (query: string) => void
}

export const useAnaliticsHistoryStore = create(
    persist(
        immer<AnaliticsHistoryStore>(
            set => ({
                history: [],
                addHistory: (query: string) => {
                    set((state) => {
                        if (query.trim() === '') {
                            return
                        }
                        const index = state.history.indexOf(query)
                        if (index !== -1) {
                            state.history.splice(index, 1)
                        }
                        state.history.unshift(query)
                        if (state.history.length > 30) {
                            state.history.pop()
                        }
                    })
                }
            })
        ),
        {
            name: 'analiticsHistory'
        }
    )
)
