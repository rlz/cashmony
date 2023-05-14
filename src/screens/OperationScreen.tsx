import React, { useState, type ReactElement, useEffect } from 'react'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, Typography } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { OperationsModel } from '../model/operations'
import { useParams } from 'react-router-dom'
import { type Operation } from '../model/model'

export const OperationScreen = (): ReactElement => {
    const [op, setOp] = useState<Operation | null>(null)
    const pathParams = useParams()

    useEffect(() => {
        const getData = async (): Promise<void> => {
            const op = await OperationsModel.instance().getOperation(pathParams.opId as string)
            setOp(op)
        }

        void getData()
    }, [])

    if (op?.type === 'expense') {
        return <Box p={1}>
            <Typography variant='h3'>
                {op?.account.amount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: op.currency,
                    currencyDisplay: 'narrowSymbol'
                })}
            </Typography>
            <Accordion>
                <AccordionSummary
                    expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography>Accordion 1</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
                    </Typography>
                </AccordionDetails>
                <AccordionActions>
                    <Button>OK</Button>
                    <Button>Cancel</Button>
                </AccordionActions>
            </Accordion>
        </Box>
    }

    return <>Unsupported type!</>
}
