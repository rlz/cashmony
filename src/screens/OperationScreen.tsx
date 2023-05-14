import React, { useState, type ReactElement, useEffect } from 'react'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, Chip, Typography, useTheme } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { OperationsModel } from '../model/operations'
import { useParams } from 'react-router-dom'
import { type Operation } from '../model/model'
import { EditorAppBar } from '../widgets/EditorAppBar'

export const OperationScreen = (): ReactElement => {
    const theme = useTheme()
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
        const tags = new Set(op.tags)

        return <Box width="100vw" height="100vh" display="flex" flexDirection="column">
            <EditorAppBar
                title='Expense'
                navigateOnBack='/operations'
                onSave={() => { alert('Save!!') }}
            />
            <Box
                display="flex"
                flexDirection="column"
                textOverflow="scroll"
                flex="1 0 0"
                bgcolor={theme.palette.background.default}
            >
                <Box p={1} color={theme.palette.getContrastText(theme.palette.background.default)}>
                    <Typography variant='h3' my={2} color={theme.palette.error.light}>
                        {Math.abs(op.account.amount).toLocaleString(undefined, {
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
                            <Typography component='div' noWrap flex='1 0 0' width={0}>Tags: {op.tags.join(', ')}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {OperationsModel.instance().allExpenseTags.map(t => {
                                    if (tags.has(t)) {
                                        return <a key={t} onClick={() => {
                                            setOp({
                                                ...op,
                                                tags: op.tags.filter(i => i !== t)
                                            })
                                        }}>
                                            <Chip color="info" size='small' label={t}/>
                                        </a>
                                    }
                                    return <a key={t} onClick={() => {
                                        setOp({
                                            ...op,
                                            tags: [...op.tags, t]
                                        })
                                    }}>
                                        <Chip size='small' label={t}/>
                                    </a>
                                })}
                            </Box>
                        </AccordionDetails>
                        <AccordionActions>
                            <Button>OK</Button>
                            <Button>Cancel</Button>
                        </AccordionActions>
                    </Accordion>
                </Box>
            </Box>
        </Box>
    }

    return <>Unsupported type: {op?.type}</>
}
