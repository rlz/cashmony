import { faBahtSign, faBrazilianRealSign, faDollarSign, faEuroSign, faIndianRupeeSign, faRubleSign, faSterlingSign, faWonSign, faYenSign, type IconDefinition } from '@fortawesome/free-solid-svg-icons'

export const CURRENCIES: Record<string, {
    symbol: string
    name: string
    symbol_native: string
    decimal_digits: number
    rounding: number
    code: string
    name_plural: string
    faIcon: IconDefinition | undefined
}> = {
    USD: {
        symbol: '$',
        name: 'US Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'USD',
        name_plural: 'US dollars',
        faIcon: faDollarSign
    },
    AUD: {
        symbol: 'AU$',
        name: 'Australian Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'AUD',
        name_plural: 'Australian dollars',
        faIcon: undefined
    },
    BRL: {
        symbol: 'R$',
        name: 'Brazilian Real',
        symbol_native: 'R$',
        decimal_digits: 2,
        rounding: 0,
        code: 'BRL',
        name_plural: 'Brazilian reals',
        faIcon: faBrazilianRealSign
    },
    CAD: {
        symbol: 'CA$',
        name: 'Canadian Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'CAD',
        name_plural: 'Canadian dollars',
        faIcon: undefined
    },
    CHF: {
        symbol: 'CHF',
        name: 'Swiss Franc',
        symbol_native: 'CHF',
        decimal_digits: 2,
        rounding: 0.05,
        code: 'CHF',
        name_plural: 'Swiss francs',
        faIcon: undefined
    },
    CNY: {
        symbol: 'CN¥',
        name: 'Chinese Yuan',
        symbol_native: 'CN¥',
        decimal_digits: 2,
        rounding: 0,
        code: 'CNY',
        name_plural: 'Chinese yuan',
        faIcon: undefined
    },
    CZK: {
        symbol: 'Kč',
        name: 'Czech Republic Koruna',
        symbol_native: 'Kč',
        decimal_digits: 2,
        rounding: 0,
        code: 'CZK',
        name_plural: 'Czech Republic korunas',
        faIcon: undefined
    },
    DKK: {
        symbol: 'Dkr',
        name: 'Danish Krone',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'DKK',
        name_plural: 'Danish kroner',
        faIcon: undefined
    },
    EUR: {
        symbol: '€',
        name: 'Euro',
        symbol_native: '€',
        decimal_digits: 2,
        rounding: 0,
        code: 'EUR',
        name_plural: 'euros',
        faIcon: faEuroSign
    },
    GBP: {
        symbol: '£',
        name: 'British Pound Sterling',
        symbol_native: '£',
        decimal_digits: 2,
        rounding: 0,
        code: 'GBP',
        name_plural: 'British pounds sterling',
        faIcon: faSterlingSign
    },
    HKD: {
        symbol: 'HK$',
        name: 'Hong Kong Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'HKD',
        name_plural: 'Hong Kong dollars',
        faIcon: undefined
    },
    HUF: {
        symbol: 'Ft',
        name: 'Hungarian Forint',
        symbol_native: 'Ft',
        decimal_digits: 0,
        rounding: 0,
        code: 'HUF',
        name_plural: 'Hungarian forints',
        faIcon: undefined
    },
    INR: {
        symbol: '₹',
        name: 'Indian Rupee',
        symbol_native: 'টকা',
        decimal_digits: 2,
        rounding: 0,
        code: 'INR',
        name_plural: 'Indian rupees',
        faIcon: faIndianRupeeSign
    },
    ISK: {
        symbol: 'Ikr',
        name: 'Icelandic Króna',
        symbol_native: 'kr',
        decimal_digits: 0,
        rounding: 0,
        code: 'ISK',
        name_plural: 'Icelandic krónur',
        faIcon: undefined
    },
    JPY: {
        symbol: '¥',
        name: 'Japanese Yen',
        symbol_native: '￥',
        decimal_digits: 0,
        rounding: 0,
        code: 'JPY',
        name_plural: 'Japanese yen',
        faIcon: faYenSign
    },
    KRW: {
        symbol: '₩',
        name: 'South Korean Won',
        symbol_native: '₩',
        decimal_digits: 0,
        rounding: 0,
        code: 'KRW',
        name_plural: 'South Korean won',
        faIcon: faWonSign
    },
    MXN: {
        symbol: 'MX$',
        name: 'Mexican Peso',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'MXN',
        name_plural: 'Mexican pesos',
        faIcon: undefined
    },
    MYR: {
        symbol: 'RM',
        name: 'Malaysian Ringgit',
        symbol_native: 'RM',
        decimal_digits: 2,
        rounding: 0,
        code: 'MYR',
        name_plural: 'Malaysian ringgits',
        faIcon: undefined
    },
    NOK: {
        symbol: 'Nkr',
        name: 'Norwegian Krone',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'NOK',
        name_plural: 'Norwegian kroner',
        faIcon: undefined
    },
    NZD: {
        symbol: 'NZ$',
        name: 'New Zealand Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'NZD',
        name_plural: 'New Zealand dollars',
        faIcon: undefined
    },
    PLN: {
        symbol: 'zł',
        name: 'Polish Zloty',
        symbol_native: 'zł',
        decimal_digits: 2,
        rounding: 0,
        code: 'PLN',
        name_plural: 'Polish zlotys',
        faIcon: undefined
    },
    RUB: {
        symbol: 'RUB',
        name: 'Russian Ruble',
        symbol_native: '₽.',
        decimal_digits: 2,
        rounding: 0,
        code: 'RUB',
        name_plural: 'Russian rubles',
        faIcon: faRubleSign
    },
    SEK: {
        symbol: 'Skr',
        name: 'Swedish Krona',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'SEK',
        name_plural: 'Swedish kronor',
        faIcon: undefined
    },
    SGD: {
        symbol: 'S$',
        name: 'Singapore Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'SGD',
        name_plural: 'Singapore dollars',
        faIcon: undefined
    },
    THB: {
        symbol: '฿',
        name: 'Thai Baht',
        symbol_native: '฿',
        decimal_digits: 2,
        rounding: 0,
        code: 'THB',
        name_plural: 'Thai baht',
        faIcon: faBahtSign
    },
    ZAR: {
        symbol: 'R',
        name: 'South African Rand',
        symbol_native: 'R',
        decimal_digits: 2,
        rounding: 0,
        code: 'ZAR',
        name_plural: 'South African rand',
        faIcon: undefined
    }
}
