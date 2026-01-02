import { HumanTimeSpan } from './dates.js'
import { Engine } from './engine.js'
import { NotDeletedOperation } from './model.js'
import { compilePredicate, Predicate } from './predicateExpression.js'

export function countOperations(engine: Engine, predicate: Predicate, timeSpan: HumanTimeSpan | null): number {
    let count = 0

    for (const _op of listOperations(engine, predicate, timeSpan)) {
        count += 1
    }
    return count
}

export function* listOperations(engine: Engine, predicate: Predicate, timeSpan: HumanTimeSpan | null): Generator<NotDeletedOperation> {
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
