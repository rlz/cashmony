import { makeAutoObservable } from 'mobx'
import { utcToday } from '../helpers/dates'

let appState: AppState | null = null

export class AppState {
    startDate = utcToday()

    private constructor () {
        makeAutoObservable(this)
    }

    static instance (): AppState {
        if (appState === null) {
            appState = new AppState()
        }

        return appState
    }
}
