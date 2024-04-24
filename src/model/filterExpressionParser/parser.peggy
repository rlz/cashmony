{{

import { PE, EXPENSE_PREDICATE, INCOME_PREDICATE } from "../predicateExpression"

}}

query
    = _* @expression _*

expression
    = orExpression

orExpression
    = e:andExpression|1.., _ "or" _| {
        if (e.length === 1) {
            return e[0]
        }

        return PE.or(...e)
    }

andExpression
    = t:term|1.., _ "and" _| {
        if (t.length === 1) {
            return t[0]
        }

        return PE.and(...t)
    }

term
    = "(" _? expr:expression _? ")" {
      return expr
    }
    / "not" _ t:term {
        return PE.not(t)
    }
    / f:singleFilter {
        return f
    }

singleFilter
    = "tag:" tag:(identifier / string) {
        return PE.tag(tag)
    }
    / "any-tag:" tags:((identifier / string)|1.., _? "," _?|) {
        return PE.or(...tags.map(t => PE.tag(t)))
    }
    / "all-tags:" tags: ((identifier / string)|1.., _? "," _?|) {
        return PE.and(...tags.map(t => PE.tag(t)))
    }
    / "uncat" {
        return PE.uncat()
    }
    / "cat:" name:(identifier / string) {
        return PE.cat(name)
    }
    / "acc:" name:(identifier / string) {
        return PE.account(name)
    }
    / "amount" _? op:("=" / "!=" / "<=" / ">=" / "<" / ">") _? n:number {
        return PE.amount(op, n)
    }
    / "expense" {
        return EXPENSE_PREDICATE
    }
    / "return" {
        return PE.and(EXPENSE_PREDICATE, PE.type('income'))
    }
    / "income" {
        return INCOME_PREDICATE
    }
    / "transfer" {
        return PE.type('transfer')
    }
    / "comment:" s:(identifier / string) {
        return PE.comment(s)
    }

identifier
    = $[a-zA-Zа-яА-Я0-9_]+

string
    = '"' chars:$([^"]*) '"' {
        return chars
    }
    / "'" chars:$([^']*) "'" {
        return chars
    }

number
    = minus:"-"? digits:$([0-9]+ ("." [0-9]+)?) {
        if (minus !== null) {
            return -parseFloat(digits)
        }

        return parseFloat(digits)
    }

_
    = ' '+