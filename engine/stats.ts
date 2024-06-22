import { HumanTimeSpan } from './dates'
import { Engine } from './engine'
import { NotDeletedOperation } from './model'
import { compilePredicate, Predicate } from './predicateExpression'

export function countOperations(engine: Engine, predicate: Predicate, timeSpan: HumanTimeSpan | null): number {
    let count = 0

    for (const _op of listOperations(engine, predicate, timeSpan)) {
        count += 1
    }
    return count
}

export function * listOperations(engine: Engine, predicate: Predicate, timeSpan: HumanTimeSpan | null): Generator<NotDeletedOperation> {
    engine.requireInitialized()

    const filter = compilePredicate(predicate, engine)

    const startDateMillis = timeSpan?.startDate.toMillis() ?? 0
    const endDateMillis = timeSpan?.endDate.toMillis() ?? 0

    for (const op of engine.operations) {
        if (
            op.type === 'deleted'
            || (timeSpan !== null && op.date.toMillis() < startDateMillis)
            || (timeSpan !== null && op.date.toMillis() > endDateMillis)
            || !filter(op)
        ) {
            continue
        }

        yield op
    }
}
