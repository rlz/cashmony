import { Predicate } from '../predicateExpression.js'
import { parse } from './parser.gen.js'

export function parseFilterQuery(filter: string): Predicate {
    try {
        return parse(filter, { grammarSource: 'filter' })
    } catch (error) {
        if (error instanceof Error) {
            throw new ParseError(error, filter)
        }
        throw Error
    }
}

export class ParseError extends Error {
    readonly message: string

    constructor(error: Error, filter: string) {
        super('Parsing error', { cause: error })
        if ('format' in error && typeof error.format === 'function') {
            this.message = String(error.format([{
                source: 'filter',
                text: filter
            }]))
        } else {
            this.message = error.message
        }
    }
}
