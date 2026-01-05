import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box, Chip, FilledInput, FormControl, IconButton, InputAdornment, InputLabel, type SxProps, useTheme } from '@mui/material'
import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import React, { CSSProperties, type ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import { match, P } from 'ts-pattern'

import { run, times } from '../../helpers/smallTools.js'
import { Row } from '../generic/Containers.js'

export type ItemType = { value: string, label: string, fontStyle?: string }
export type ItemsType = readonly ItemType[]

interface Props {
    items: ItemsType
    selected: readonly string[]
    onSelectedChange: (selected: string[]) => void
    selectMany: boolean
    selectZero: boolean
    disabled?: readonly string[]
    sx?: SxProps
}

const aStyle: CSSProperties = { fontSize: '0' }

export function ItemsSelect(props: Props): ReactElement {
    const { height, ref } = useResizeDetector()
    const [carouselRef, carouselApi] = useEmblaCarousel({}, [WheelGesturesPlugin()])
    const theme = useTheme()

    const selected = new Set(props.selected)
    const pageHeight = (24 + 8) * 4
    const [pages, setPages] = useState(1)

    const [page, setPage] = useState(0)

    const [filter, setFilter] = useState<string | null>(null)

    const onSelect = useCallback((api: Exclude<typeof carouselApi, undefined>) => {
        setPage(api.selectedScrollSnap())
    }, [pages])

    useEffect(() => {
        setPages(height === undefined ? 1 : Math.ceil(height / pageHeight))
    }, [height])

    useEffect(() => {
        if (carouselApi !== undefined) {
            carouselApi.on('select', onSelect)

            return () => {
                carouselApi.off('select', onSelect)
            }
        }
    }, [carouselApi, onSelect])

    const onSelectedChangeContainer = useMemo(() => { return { v: props.onSelectedChange } }, [])
    onSelectedChangeContainer.v = props.onSelectedChange

    const items = useMemo(() => {
        const items = filter === null
            ? props.items
            : run(() => {
                    const re = new RegExp(filter, 'i')
                    return props.items.filter(
                        i => re.test(i.label)
                    )
                })

        return items.map((i) => {
            const fontStyle = match(i).with(P.string, _v => undefined).otherwise(v => v.fontStyle)
            if (props.disabled?.includes(i.value)) {
                if (selected.has(i.value)) {
                    const chip = <Chip key={i.value} color={'error'} size={'small'} label={i.label} sx={{ fontStyle }} />
                    return (
                        <a
                            key={i.value}
                            style={aStyle}
                            onClick={() => {
                                onSelectedChangeContainer.v(props.selected.filter(s => s !== i.value))
                            }}
                        >
                            {chip}
                        </a>
                    )
                }

                return <Chip key={i.value} size={'small'} label={i.label} sx={{ fontStyle, color: theme.palette.text.disabled }} />
            }
            if (selected.has(i.value)) {
                const chip = <Chip key={i.value} color={'primary'} size={'small'} label={i.label} sx={{ fontStyle }} />

                if (props.selectZero || (props.selectMany && selected.size > 1)) {
                    return (
                        <a
                            key={i.value}
                            style={aStyle}
                            onClick={() => {
                                onSelectedChangeContainer.v(props.selected.filter(s => s !== i.value))
                            }}
                        >
                            {chip}
                        </a>
                    )
                }
                return chip
            }

            return (
                <a
                    key={i.value}
                    style={aStyle}
                    onClick={() => {
                        if (props.selectMany) {
                            onSelectedChangeContainer.v([...selected, i.value])
                        } else {
                            onSelectedChangeContainer.v([i.value])
                        }
                    }}
                >
                    <Chip size={'small'} label={i.label} sx={{ fontStyle }} />
                </a>
            )
        })
    }, [props.items, props.selected, filter, props.selectMany])

    return (
        <Box sx={props.sx}>
            <FormControl variant={'filled'} size={'small'} fullWidth sx={{ mb: 2 }}>
                <InputLabel>{'Filter'}</InputLabel>
                <FilledInput
                    fullWidth
                    size={'small'}
                    value={filter ?? ''}
                    onChange={(ev) => {
                        setFilter(ev.target.value === '' ? null : ev.target.value)
                    }}
                    endAdornment={(
                        <InputAdornment position={'end'}>
                            <IconButton
                                disabled={filter === null}
                                onClick={() => { setFilter(null) }}
                                edge={'end'}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </IconButton>
                        </InputAdornment>
                    )}
                />
            </FormControl>
            <Box overflow={'hidden'} ref={carouselRef}>
                <Row>
                    <Box height={pageHeight} overflow={'hidden'} flex={'0 0 100%'}>
                        <Box display={'flex'} ref={ref} flexWrap={'wrap'} gap={1}>
                            { items }
                        </Box>
                    </Box>
                    {
                        times(pages ?? 0).map((p) => {
                            if (p === 0) {
                                return undefined
                            }
                            return (
                                <Box key={p} height={pageHeight} overflow={'hidden'} position={'relative'} flex={'0 0 100%'}>
                                    <Box position={'absolute'} top={-pageHeight * p}>
                                        <Box display={'flex'} flexWrap={'wrap'} gap={1}>
                                            { items }
                                        </Box>
                                    </Box>
                                </Box>
                            )
                        })
                    }
                </Row>
            </Box>
            <Row justifyContent={'center'} gap={1} mt={1} height={10}>
                {
                    pages > 1
                        ? times(pages ?? 0).map((p) => {
                                return (
                                    <a key={p} style={aStyle} onClick={() => { carouselApi?.scrollTo(p) }}>
                                        <Box
                                            width={10}
                                            height={10}
                                            bgcolor={p === page ? 'secondary.main' : 'text.primary'}
                                            borderRadius={10}
                                        />
                                    </a>
                                )
                            })
                        : null
                }
            </Row>
        </Box>
    )
}
