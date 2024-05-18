import { Operation } from './model'

const OP_WEIGHTS = {
    income: 0,
    transfer: 1,
    expense: 2,
    adjustment: 3
}

export function operationComparator(o1: Operation, o2: Operation): number {
    if (o1.type === 'deleted' && o2.type === 'deleted') {
        return o1.id < o2.id ? -1 : 1
    }

    if (o1.type === 'deleted') {
        return -1
    }

    if (o2.type === 'deleted') {
        return 1
    }

    const d = o1.date.toMillis() - o2.date.toMillis()
    if (d !== 0) {
        return d
    }

    const op = OP_WEIGHTS[o1.type] - OP_WEIGHTS[o2.type]
    if (op !== 0) {
        return op
    }

    if (o1.currency !== o2.currency) {
        return o1.currency < o2.currency ? -1 : 1
    }

    const amount = Math.abs(o1.amount) - Math.abs(o2.amount)
    if (amount !== 0) {
        return amount
    }

    return o1.id < o2.id ? 1 : (o1.id === o2.id ? 0 : -1)
}
