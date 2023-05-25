import React, { useState, type ReactElement } from 'react'
import { FullScreenModal } from './FullScreenModal'
import { Box, Button, Chip, IconButton } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { getCurrencySymbol } from '../helpers/currencies'
import { CurrencySelector } from './CurrencySelector'
import { CurrencyInput } from './CurrencyInput'
import makeUrl from '../google/makeUrl'
import { AccountsModel } from '../model/accounts'

interface Props {
    onClose: () => void
}

const accountsModel = AccountsModel.instance()

export const CreateExpense = (props: Props): ReactElement => {
    const navigate = useNavigate()
    const [curSelOpen, setCurSelOpen] = useState(false)
    const [currency, setCurrency] = useState('RUB')
    const [amount, setAmount] = useState(0)
    const [account, setAccount] = useState<string | null>(null)

    return <FullScreenModal title="New expense" gap={2} onClose={props.onClose}>
        <Box display="flex" gap={1} mt={2}>
            <IconButton
                color='primary'
                sx={{ width: 48 }}
                onClick={() => { setCurSelOpen(true) }}
            >
                {getCurrencySymbol(currency)}
            </IconButton>
            <CurrencyInput
                label='Amount'
                negative={true}
                amount={amount}
                currency={currency}
                onAmountChange={amount => { setAmount(amount) }}
            />
        </Box>
        <Box display="flex" flexWrap="wrap" gap={1} maxHeight="128px" overflow="scroll">
            { Object.values(accountsModel.accounts).map(a => {
                if (a.name === account) {
                    return <a key={a.name} >
                        <Chip color="primary" size='small' label={a.name}/>
                    </a>
                }
                return <a
                    key={a.name}
                    onClick={() => {
                        setAccount(a.name)
                    }}
                >
                    <Chip size='small' label={a.name}/>
                </a>
            })}
        </Box>
        <Button
            fullWidth
            color='primary'
            variant='contained'
            disabled={amount === 0 || account === null}
            onClick={() => {
                if (account === null) return

                navigate(makeUrl('/new-expense', {
                    amount: amount.toFixed(2),
                    currency,
                    account,
                    accountAmount: amount.toFixed(2)
                }))
            }}
        >Create</Button>
        {
            curSelOpen
                ? <CurrencySelector
                    currency={currency}
                    onClose={() => { setCurSelOpen(false) }}
                    onCurrencySelected={currency => { setCurrency(currency) }}
                />
                : null
        }
    </FullScreenModal>
}
