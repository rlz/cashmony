import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Button, FormControlLabel, Switch, TextField } from '@mui/material'
import { DateTime } from 'luxon'
import { ReactElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { match } from 'ts-pattern'
import { v1 as uuid } from 'uuid'

import { deepEqual } from '../../helpers/deepEqual'
import { AccountsModel } from '../../model/accounts'
import { AppState } from '../../model/appState'
import { Account, Operation } from '../../model/model'
import { OperationsModel } from '../../model/operations'
import { CurrencyInput } from '../../widgets/CurrencyInput'
import { DeleteAccount } from '../../widgets/DeleteAccount'
import { ActionButton, ActionFab } from '../../widgets/generic/ActionButton'

interface EditorProps {
    acc: Account
    setAcc: (cat: Account) => void
}

export function AccountEditor({ acc, setAcc }: EditorProps): ReactElement {
    const appState = AppState.instance()
    const accountsModel = AccountsModel.instance()
    const operationsModel = OperationsModel.instance()

    const navigate = useNavigate()
    const amount = accountsModel.getAmounts(appState.today)[acc.name] ?? 0

    const [adjustedAmount, setAdjustedAmount] = useState(amount)

    const [delOpen, setDelOpen] = useState(false)
    const [newAcc, setNewAcc] = useState(acc)

    useEffect(() => { setNewAcc(acc) }, [acc])

    const trimmedName = newAcc.name.trim()
    const nameConflict = trimmedName !== acc.name
        && accountsModel.accounts !== null
        && accountsModel.accounts.has(newAcc.name)
        && accountsModel.get(newAcc.name).deleted !== true

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
                await accountsModel.put({ ...newAcc, name: trimmedName, lastModified: DateTime.utc() })

                if (operationsModel.operations === null) {
                    throw Error('Operations not loaded')
                }

                if (trimmedName !== acc.name) {
                    const changedOps: Operation[] = []
                    for (const op of operationsModel.operations) {
                        if (
                            (op.type !== 'deleted')
                            && op.account.name === acc.name
                        ) {
                            changedOps.push({
                                ...op,
                                lastModified: DateTime.utc(),
                                account: {
                                    ...op.account,
                                    name: trimmedName
                                }
                            })
                        }
                    }
                    await operationsModel.put(changedOps)
                    await accountsModel.put({ ...acc, deleted: true, lastModified: DateTime.utc() })
                    navigate(`/accounts/${encodeURIComponent(trimmedName)}`)
                    return
                }

                setAcc(newAcc)
            }
        },
        [
            acc,
            newAcc,
            accountsModel.accounts
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
                <ActionButton
                    sx={{ mt: 1 }}
                    action={
                    amount === adjustedAmount
                        ? null
                        : async () => {
                            await operationsModel.put([{
                                id: uuid(),
                                lastModified: DateTime.utc(),
                                date: appState.today,
                                type: 'adjustment',
                                currency: acc.currency,
                                amount: adjustedAmount - amount,
                                account: {
                                    name: acc.name,
                                    amount: adjustedAmount - amount
                                },
                                tags: [],
                                comment: null
                            }])
                        // eslint-disable-next-line @stylistic/jsx-indent
                        }
                }
                    variant={'contained'}
                    fullWidth
                >
                    {'Adjust'}
                </ActionButton>
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
            <DeleteAccount name={acc.name} open={delOpen} setOpen={setDelOpen} />
        </Box>
    )
}
