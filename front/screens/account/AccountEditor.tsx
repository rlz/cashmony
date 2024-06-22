import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, FormControlLabel, Switch, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { match } from 'ts-pattern'
import { uuidv7 } from 'uuidv7'

import { CustomTimeSpan } from '../../../engine/dates'
import { Account } from '../../../engine/model'
import { PE } from '../../../engine/predicateExpression'
import { AccountStatsReducer } from '../../../engine/stats/AccountStatsReducer'
import { calcStats2 } from '../../../engine/stats/newStatsProcessor'
import { deepEqual } from '../../helpers/deepEqual'
import { useFrontState } from '../../model/FrontState'
import { useEngine } from '../../useEngine'
import { CurrencyInput } from '../../widgets/CurrencyInput'
import { ActionFab } from '../../widgets/generic/ActionButton'
import { DeleteAccount } from './DeleteAccount'

interface EditorProps {
    acc: Account
    setAcc: (cat: Account) => void
}

export function AccountEditor({ acc, setAcc }: EditorProps): ReactElement {
    const appState = useFrontState()
    const engine = useEngine()

    const [amount, setAmount] = useState(0)

    const [adjustedAmount, setAdjustedAmount] = useState(amount)

    const [delOpen, setDelOpen] = useState(false)
    const [newAcc, setNewAcc] = useState(acc)

    useEffect(() => { setNewAcc(acc) }, [acc])
    useEffect(() => {
        void (
            async () => {
                const stats = new AccountStatsReducer(acc.id, appState.timeSpan, appState.today)
                const lastOpDate = engine.lastOp?.date ?? appState.timeSpan.endDate
                await calcStats2(
                    engine,
                    PE.account(acc.id),
                    new CustomTimeSpan(
                        engine.firstOp?.date ?? appState.timeSpan.startDate,
                        lastOpDate
                    ),
                    appState.today,
                    [stats]
                )
                setAmount(stats.stats.total)
            }
        )()
    }, [acc.name, engine.operations])

    const trimmedName = newAcc.name.trim()
    const nameConflict = trimmedName !== acc.name
        && engine.hasAccountWithName(newAcc.name)

    const onSave = useMemo(
        () => {
            if (
                deepEqual(acc, newAcc)
                || trimmedName === ''
                || nameConflict
            ) {
                return null
            }

            return async () => {
                engine.pushAccount({ ...newAcc, name: trimmedName, lastModified: DateTime.utc() })

                setAcc(newAcc)
            }
        },
        [
            acc,
            newAcc,
            engine.accounts
        ]
    )

    return (
        <Box mt={1}>
            <TextField
                error={trimmedName === '' || nameConflict}
                helperText={match(null)
                    .when(() => trimmedName === '', () => 'Black name')
                    .when(() => nameConflict, () => 'Already exists')
                    .otherwise(() => 'Ok')}
                label={'Name'}
                size={'small'}
                fullWidth
                variant={'filled'}
                value={newAcc.name}
                onChange={(ev) => { setNewAcc({ ...newAcc, name: ev.target.value }) }}
            />
            <FormControlLabel
                control={(
                    <Switch
                        checked={newAcc.hidden}
                        onChange={(_, checked) => {
                            setNewAcc({
                                ...newAcc,
                                hidden: checked
                            })
                        }}
                    />
                )}
                label={'Hidden'}
            />
            <Box my={4}>
                <CurrencyInput
                    label={'Adjust amount'}
                    currency={newAcc.currency}
                    amount={adjustedAmount}
                    onAmountChange={(amount) => { setAdjustedAmount(amount) }}
                />
                <Button
                    sx={{ mt: 1 }}
                    disabled={amount === adjustedAmount}
                    onClick={
                        amount === adjustedAmount
                            ? undefined
                            : () => {
                                    engine.pushOperation({
                                        id: uuidv7(),
                                        lastModified: DateTime.utc(),
                                        date: appState.today,
                                        type: 'adjustment',
                                        currency: acc.currency,
                                        amount: adjustedAmount - amount,
                                        account: {
                                            id: acc.id,
                                            amount: adjustedAmount - amount
                                        },
                                        tags: [],
                                        comment: null
                                    })
                                }
                    }
                    variant={'contained'}
                    fullWidth
                >
                    {'Adjust'}
                </Button>
            </Box>
            <ActionFab action={onSave}>
                <FontAwesomeIcon icon={faCheck} />
            </ActionFab>
            <Button
                variant={'contained'}
                color={'error'}
                onClick={() => { setDelOpen(true) }}
                fullWidth
            >
                {'Delete'}
            </Button>
            <DeleteAccount id={acc.id} open={delOpen} setOpen={setDelOpen} />
        </Box>
    )
}
