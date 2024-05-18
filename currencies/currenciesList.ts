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
    },

    // new
    AED: {
        symbol: 'AED',
        name: 'United Arab Emirates Dirham',
        symbol_native: 'د.إ.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'AED',
        name_plural: 'UAE dirhams',
        faIcon: undefined
    },

    AFN: {
        symbol: 'Af',
        name: 'Afghan Afghani',
        symbol_native: '؋',
        decimal_digits: 0,
        rounding: 0,
        code: 'AFN',
        name_plural: 'Afghan Afghanis',
        faIcon: undefined
    },

    ALL: {
        symbol: 'ALL',
        name: 'Albanian Lek',
        symbol_native: 'Lek',
        decimal_digits: 0,
        rounding: 0,
        code: 'ALL',
        name_plural: 'Albanian lekë',
        faIcon: undefined
    },

    // AMD: {
    //     symbol: 'AMD',
    //     name: 'Armenian Dram',
    //     symbol_native: 'դր.',
    //     decimal_digits: 0,
    //     rounding: 0,
    //     code: 'AMD',
    //     name_plural: 'Armenian drams',
    //     faIcon: undefined
    // },

    ARS: {
        symbol: 'AR$',
        name: 'Argentine Peso',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'ARS',
        name_plural: 'Argentine pesos',
        faIcon: undefined
    },

    // AZN: {
    //     symbol: 'man.',
    //     name: 'Azerbaijani Manat',
    //     symbol_native: 'ман.',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'AZN',
    //     name_plural: 'Azerbaijani manats',
    //     faIcon: undefined
    // },

    // BAM: {
    //     symbol: 'KM',
    //     name: 'Bosnia-Herzegovina Convertible Mark',
    //     symbol_native: 'KM',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'BAM',
    //     name_plural: 'Bosnia-Herzegovina convertible marks',
    //     faIcon: undefined
    // },

    BDT: {
        symbol: 'Tk',
        name: 'Bangladeshi Taka',
        symbol_native: '৳',
        decimal_digits: 2,
        rounding: 0,
        code: 'BDT',
        name_plural: 'Bangladeshi takas',
        faIcon: undefined
    },

    BGN: {
        symbol: 'BGN',
        name: 'Bulgarian Lev',
        symbol_native: 'лв.',
        decimal_digits: 2,
        rounding: 0,
        code: 'BGN',
        name_plural: 'Bulgarian leva',
        faIcon: undefined
    },

    BHD: {
        symbol: 'BD',
        name: 'Bahraini Dinar',
        symbol_native: 'د.ب.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'BHD',
        name_plural: 'Bahraini dinars',
        faIcon: undefined
    },

    BIF: {
        symbol: 'FBu',
        name: 'Burundian Franc',
        symbol_native: 'FBu',
        decimal_digits: 0,
        rounding: 0,
        code: 'BIF',
        name_plural: 'Burundian francs',
        faIcon: undefined
    },

    BND: {
        symbol: 'BN$',
        name: 'Brunei Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'BND',
        name_plural: 'Brunei dollars',
        faIcon: undefined
    },

    BOB: {
        symbol: 'Bs',
        name: 'Bolivian Boliviano',
        symbol_native: 'Bs',
        decimal_digits: 2,
        rounding: 0,
        code: 'BOB',
        name_plural: 'Bolivian bolivianos',
        faIcon: undefined
    },

    BWP: {
        symbol: 'BWP',
        name: 'Botswanan Pula',
        symbol_native: 'P',
        decimal_digits: 2,
        rounding: 0,
        code: 'BWP',
        name_plural: 'Botswanan pulas',
        faIcon: undefined
    },

    BYN: {
        symbol: 'Br',
        name: 'Belarusian Ruble',
        symbol_native: 'руб.',
        decimal_digits: 2,
        rounding: 0,
        code: 'BYN',
        name_plural: 'Belarusian rubles',
        faIcon: undefined
    },

    BZD: {
        symbol: 'BZ$',
        name: 'Belize Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'BZD',
        name_plural: 'Belize dollars',
        faIcon: undefined
    },

    CDF: {
        symbol: 'CDF',
        name: 'Congolese Franc',
        symbol_native: 'FrCD',
        decimal_digits: 2,
        rounding: 0,
        code: 'CDF',
        name_plural: 'Congolese francs',
        faIcon: undefined
    },

    CLP: {
        symbol: 'CL$',
        name: 'Chilean Peso',
        symbol_native: '$',
        decimal_digits: 0,
        rounding: 0,
        code: 'CLP',
        name_plural: 'Chilean pesos',
        faIcon: undefined
    },

    COP: {
        symbol: 'CO$',
        name: 'Colombian Peso',
        symbol_native: '$',
        decimal_digits: 0,
        rounding: 0,
        code: 'COP',
        name_plural: 'Colombian pesos',
        faIcon: undefined
    },

    CRC: {
        symbol: '₡',
        name: 'Costa Rican Colón',
        symbol_native: '₡',
        decimal_digits: 0,
        rounding: 0,
        code: 'CRC',
        name_plural: 'Costa Rican colóns',
        faIcon: undefined
    },

    CVE: {
        symbol: 'CV$',
        name: 'Cape Verdean Escudo',
        symbol_native: 'CV$',
        decimal_digits: 2,
        rounding: 0,
        code: 'CVE',
        name_plural: 'Cape Verdean escudos',
        faIcon: undefined
    },

    DJF: {
        symbol: 'Fdj',
        name: 'Djiboutian Franc',
        symbol_native: 'Fdj',
        decimal_digits: 0,
        rounding: 0,
        code: 'DJF',
        name_plural: 'Djiboutian francs',
        faIcon: undefined
    },

    DOP: {
        symbol: 'RD$',
        name: 'Dominican Peso',
        symbol_native: 'RD$',
        decimal_digits: 2,
        rounding: 0,
        code: 'DOP',
        name_plural: 'Dominican pesos',
        faIcon: undefined
    },

    DZD: {
        symbol: 'DA',
        name: 'Algerian Dinar',
        symbol_native: 'د.ج.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'DZD',
        name_plural: 'Algerian dinars',
        faIcon: undefined
    },

    // EEK: {
    //     symbol: 'Ekr',
    //     name: 'Estonian Kroon',
    //     symbol_native: 'kr',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'EEK',
    //     name_plural: 'Estonian kroons',
    //     faIcon: undefined
    // },

    EGP: {
        symbol: 'EGP',
        name: 'Egyptian Pound',
        symbol_native: 'ج.م.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'EGP',
        name_plural: 'Egyptian pounds',
        faIcon: undefined
    },

    // ERN: {
    //     symbol: 'Nfk',
    //     name: 'Eritrean Nakfa',
    //     symbol_native: 'Nfk',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'ERN',
    //     name_plural: 'Eritrean nakfas',
    //     faIcon: undefined
    // },

    ETB: {
        symbol: 'Br',
        name: 'Ethiopian Birr',
        symbol_native: 'Br',
        decimal_digits: 2,
        rounding: 0,
        code: 'ETB',
        name_plural: 'Ethiopian birrs',
        faIcon: undefined
    },

    // GEL: {
    //     symbol: 'GEL',
    //     name: 'Georgian Lari',
    //     symbol_native: 'GEL',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'GEL',
    //     name_plural: 'Georgian laris',
    //     faIcon: undefined
    // },

    GHS: {
        symbol: 'GH₵',
        name: 'Ghanaian Cedi',
        symbol_native: 'GH₵',
        decimal_digits: 2,
        rounding: 0,
        code: 'GHS',
        name_plural: 'Ghanaian cedis',
        faIcon: undefined
    },

    GNF: {
        symbol: 'FG',
        name: 'Guinean Franc',
        symbol_native: 'FG',
        decimal_digits: 0,
        rounding: 0,
        code: 'GNF',
        name_plural: 'Guinean francs',
        faIcon: undefined
    },

    GTQ: {
        symbol: 'GTQ',
        name: 'Guatemalan Quetzal',
        symbol_native: 'Q',
        decimal_digits: 2,
        rounding: 0,
        code: 'GTQ',
        name_plural: 'Guatemalan quetzals',
        faIcon: undefined
    },

    HNL: {
        symbol: 'HNL',
        name: 'Honduran Lempira',
        symbol_native: 'L',
        decimal_digits: 2,
        rounding: 0,
        code: 'HNL',
        name_plural: 'Honduran lempiras',
        faIcon: undefined
    },

    HRK: {
        symbol: 'kn',
        name: 'Croatian Kuna',
        symbol_native: 'kn',
        decimal_digits: 2,
        rounding: 0,
        code: 'HRK',
        name_plural: 'Croatian kunas',
        faIcon: undefined
    },

    IDR: {
        symbol: 'Rp',
        name: 'Indonesian Rupiah',
        symbol_native: 'Rp',
        decimal_digits: 0,
        rounding: 0,
        code: 'IDR',
        name_plural: 'Indonesian rupiahs',
        faIcon: undefined
    },

    ILS: {
        symbol: '₪',
        name: 'Israeli New Sheqel',
        symbol_native: '₪',
        decimal_digits: 2,
        rounding: 0,
        code: 'ILS',
        name_plural: 'Israeli new sheqels',
        faIcon: undefined
    },

    IQD: {
        symbol: 'IQD',
        name: 'Iraqi Dinar',
        symbol_native: 'د.ع.‏',
        decimal_digits: 0,
        rounding: 0,
        code: 'IQD',
        name_plural: 'Iraqi dinars',
        faIcon: undefined
    },

    IRR: {
        symbol: 'IRR',
        name: 'Iranian Rial',
        symbol_native: '﷼',
        decimal_digits: 0,
        rounding: 0,
        code: 'IRR',
        name_plural: 'Iranian rials',
        faIcon: undefined
    },

    JMD: {
        symbol: 'J$',
        name: 'Jamaican Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'JMD',
        name_plural: 'Jamaican dollars',
        faIcon: undefined
    },

    JOD: {
        symbol: 'JD',
        name: 'Jordanian Dinar',
        symbol_native: 'د.أ.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'JOD',
        name_plural: 'Jordanian dinars',
        faIcon: undefined
    },

    KES: {
        symbol: 'Ksh',
        name: 'Kenyan Shilling',
        symbol_native: 'Ksh',
        decimal_digits: 2,
        rounding: 0,
        code: 'KES',
        name_plural: 'Kenyan shillings',
        faIcon: undefined
    },

    KHR: {
        symbol: 'KHR',
        name: 'Cambodian Riel',
        symbol_native: '៛',
        decimal_digits: 2,
        rounding: 0,
        code: 'KHR',
        name_plural: 'Cambodian riels',
        faIcon: undefined
    },

    KMF: {
        symbol: 'CF',
        name: 'Comorian Franc',
        symbol_native: 'FC',
        decimal_digits: 0,
        rounding: 0,
        code: 'KMF',
        name_plural: 'Comorian francs',
        faIcon: undefined
    },

    KWD: {
        symbol: 'KD',
        name: 'Kuwaiti Dinar',
        symbol_native: 'د.ك.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'KWD',
        name_plural: 'Kuwaiti dinars',
        faIcon: undefined
    },

    KZT: {
        symbol: 'KZT',
        name: 'Kazakhstani Tenge',
        symbol_native: 'тңг.',
        decimal_digits: 2,
        rounding: 0,
        code: 'KZT',
        name_plural: 'Kazakhstani tenges',
        faIcon: undefined
    },

    LBP: {
        symbol: 'LB£',
        name: 'Lebanese Pound',
        symbol_native: 'ل.ل.‏',
        decimal_digits: 0,
        rounding: 0,
        code: 'LBP',
        name_plural: 'Lebanese pounds',
        faIcon: undefined
    },

    LKR: {
        symbol: 'SLRs',
        name: 'Sri Lankan Rupee',
        symbol_native: 'SL Re',
        decimal_digits: 2,
        rounding: 0,
        code: 'LKR',
        name_plural: 'Sri Lankan rupees',
        faIcon: undefined
    },

    // LTL: {
    //     symbol: 'Lt',
    //     name: 'Lithuanian Litas',
    //     symbol_native: 'Lt',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'LTL',
    //     name_plural: 'Lithuanian litai',
    //     faIcon: undefined
    // },

    // LVL: {
    //     symbol: 'Ls',
    //     name: 'Latvian Lats',
    //     symbol_native: 'Ls',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'LVL',
    //     name_plural: 'Latvian lati',
    //     faIcon: undefined
    // },

    LYD: {
        symbol: 'LD',
        name: 'Libyan Dinar',
        symbol_native: 'د.ل.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'LYD',
        name_plural: 'Libyan dinars',
        faIcon: undefined
    },

    MAD: {
        symbol: 'MAD',
        name: 'Moroccan Dirham',
        symbol_native: 'د.م.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'MAD',
        name_plural: 'Moroccan dirhams',
        faIcon: undefined
    },

    MDL: {
        symbol: 'MDL',
        name: 'Moldovan Leu',
        symbol_native: 'MDL',
        decimal_digits: 2,
        rounding: 0,
        code: 'MDL',
        name_plural: 'Moldovan lei',
        faIcon: undefined
    },

    MGA: {
        symbol: 'MGA',
        name: 'Malagasy Ariary',
        symbol_native: 'MGA',
        decimal_digits: 0,
        rounding: 0,
        code: 'MGA',
        name_plural: 'Malagasy Ariaries',
        faIcon: undefined
    },

    MKD: {
        symbol: 'MKD',
        name: 'Macedonian Denar',
        symbol_native: 'MKD',
        decimal_digits: 2,
        rounding: 0,
        code: 'MKD',
        name_plural: 'Macedonian denari',
        faIcon: undefined
    },

    MMK: {
        symbol: 'MMK',
        name: 'Myanma Kyat',
        symbol_native: 'K',
        decimal_digits: 0,
        rounding: 0,
        code: 'MMK',
        name_plural: 'Myanma kyats',
        faIcon: undefined
    },

    MOP: {
        symbol: 'MOP$',
        name: 'Macanese Pataca',
        symbol_native: 'MOP$',
        decimal_digits: 2,
        rounding: 0,
        code: 'MOP',
        name_plural: 'Macanese patacas',
        faIcon: undefined
    },

    MUR: {
        symbol: 'MURs',
        name: 'Mauritian Rupee',
        symbol_native: 'MURs',
        decimal_digits: 0,
        rounding: 0,
        code: 'MUR',
        name_plural: 'Mauritian rupees',
        faIcon: undefined
    },

    MZN: {
        symbol: 'MTn',
        name: 'Mozambican Metical',
        symbol_native: 'MTn',
        decimal_digits: 2,
        rounding: 0,
        code: 'MZN',
        name_plural: 'Mozambican meticals',
        faIcon: undefined
    },

    NAD: {
        symbol: 'N$',
        name: 'Namibian Dollar',
        symbol_native: 'N$',
        decimal_digits: 2,
        rounding: 0,
        code: 'NAD',
        name_plural: 'Namibian dollars',
        faIcon: undefined
    },

    NGN: {
        symbol: '₦',
        name: 'Nigerian Naira',
        symbol_native: '₦',
        decimal_digits: 2,
        rounding: 0,
        code: 'NGN',
        name_plural: 'Nigerian nairas',
        faIcon: undefined
    },

    NIO: {
        symbol: 'C$',
        name: 'Nicaraguan Córdoba',
        symbol_native: 'C$',
        decimal_digits: 2,
        rounding: 0,
        code: 'NIO',
        name_plural: 'Nicaraguan córdobas',
        faIcon: undefined
    },

    NPR: {
        symbol: 'NPRs',
        name: 'Nepalese Rupee',
        symbol_native: 'नेरू',
        decimal_digits: 2,
        rounding: 0,
        code: 'NPR',
        name_plural: 'Nepalese rupees',
        faIcon: undefined
    },

    OMR: {
        symbol: 'OMR',
        name: 'Omani Rial',
        symbol_native: 'ر.ع.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'OMR',
        name_plural: 'Omani rials',
        faIcon: undefined
    },

    PAB: {
        symbol: 'B/.',
        name: 'Panamanian Balboa',
        symbol_native: 'B/.',
        decimal_digits: 2,
        rounding: 0,
        code: 'PAB',
        name_plural: 'Panamanian balboas',
        faIcon: undefined
    },

    PEN: {
        symbol: 'S/.',
        name: 'Peruvian Nuevo Sol',
        symbol_native: 'S/.',
        decimal_digits: 2,
        rounding: 0,
        code: 'PEN',
        name_plural: 'Peruvian nuevos soles',
        faIcon: undefined
    },

    PHP: {
        symbol: '₱',
        name: 'Philippine Peso',
        symbol_native: '₱',
        decimal_digits: 2,
        rounding: 0,
        code: 'PHP',
        name_plural: 'Philippine pesos',
        faIcon: undefined
    },

    PKR: {
        symbol: 'PKRs',
        name: 'Pakistani Rupee',
        symbol_native: '₨',
        decimal_digits: 0,
        rounding: 0,
        code: 'PKR',
        name_plural: 'Pakistani rupees',
        faIcon: undefined
    },

    PYG: {
        symbol: '₲',
        name: 'Paraguayan Guarani',
        symbol_native: '₲',
        decimal_digits: 0,
        rounding: 0,
        code: 'PYG',
        name_plural: 'Paraguayan guaranis',
        faIcon: undefined
    },

    QAR: {
        symbol: 'QR',
        name: 'Qatari Rial',
        symbol_native: 'ر.ق.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'QAR',
        name_plural: 'Qatari rials',
        faIcon: undefined
    },

    RON: {
        symbol: 'RON',
        name: 'Romanian Leu',
        symbol_native: 'RON',
        decimal_digits: 2,
        rounding: 0,
        code: 'RON',
        name_plural: 'Romanian lei',
        faIcon: undefined
    },

    RSD: {
        symbol: 'din.',
        name: 'Serbian Dinar',
        symbol_native: 'дин.',
        decimal_digits: 0,
        rounding: 0,
        code: 'RSD',
        name_plural: 'Serbian dinars',
        faIcon: undefined
    },

    RWF: {
        symbol: 'RWF',
        name: 'Rwandan Franc',
        symbol_native: 'FR',
        decimal_digits: 0,
        rounding: 0,
        code: 'RWF',
        name_plural: 'Rwandan francs',
        faIcon: undefined
    },

    SAR: {
        symbol: 'SR',
        name: 'Saudi Riyal',
        symbol_native: 'ر.س.‏',
        decimal_digits: 2,
        rounding: 0,
        code: 'SAR',
        name_plural: 'Saudi riyals',
        faIcon: undefined
    },

    SDG: {
        symbol: 'SDG',
        name: 'Sudanese Pound',
        symbol_native: 'SDG',
        decimal_digits: 2,
        rounding: 0,
        code: 'SDG',
        name_plural: 'Sudanese pounds',
        faIcon: undefined
    },

    SOS: {
        symbol: 'Ssh',
        name: 'Somali Shilling',
        symbol_native: 'Ssh',
        decimal_digits: 0,
        rounding: 0,
        code: 'SOS',
        name_plural: 'Somali shillings',
        faIcon: undefined
    },

    SYP: {
        symbol: 'SY£',
        name: 'Syrian Pound',
        symbol_native: 'ل.س.‏',
        decimal_digits: 0,
        rounding: 0,
        code: 'SYP',
        name_plural: 'Syrian pounds',
        faIcon: undefined
    },

    TND: {
        symbol: 'DT',
        name: 'Tunisian Dinar',
        symbol_native: 'د.ت.‏',
        decimal_digits: 3,
        rounding: 0,
        code: 'TND',
        name_plural: 'Tunisian dinars',
        faIcon: undefined
    },

    // TOP: {
    //     symbol: 'T$',
    //     name: 'Tongan Paʻanga',
    //     symbol_native: 'T$',
    //     decimal_digits: 2,
    //     rounding: 0,
    //     code: 'TOP',
    //     name_plural: 'Tongan paʻanga',
    //     faIcon: undefined
    // },

    TRY: {
        symbol: 'TL',
        name: 'Turkish Lira',
        symbol_native: 'TL',
        decimal_digits: 2,
        rounding: 0,
        code: 'TRY',
        name_plural: 'Turkish Lira',
        faIcon: undefined
    },

    TTD: {
        symbol: 'TT$',
        name: 'Trinidad and Tobago Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'TTD',
        name_plural: 'Trinidad and Tobago dollars',
        faIcon: undefined
    },

    TWD: {
        symbol: 'NT$',
        name: 'New Taiwan Dollar',
        symbol_native: 'NT$',
        decimal_digits: 2,
        rounding: 0,
        code: 'TWD',
        name_plural: 'New Taiwan dollars',
        faIcon: undefined
    },

    TZS: {
        symbol: 'TSh',
        name: 'Tanzanian Shilling',
        symbol_native: 'TSh',
        decimal_digits: 0,
        rounding: 0,
        code: 'TZS',
        name_plural: 'Tanzanian shillings',
        faIcon: undefined
    },

    UAH: {
        symbol: '₴',
        name: 'Ukrainian Hryvnia',
        symbol_native: '₴',
        decimal_digits: 2,
        rounding: 0,
        code: 'UAH',
        name_plural: 'Ukrainian hryvnias',
        faIcon: undefined
    },

    UGX: {
        symbol: 'USh',
        name: 'Ugandan Shilling',
        symbol_native: 'USh',
        decimal_digits: 0,
        rounding: 0,
        code: 'UGX',
        name_plural: 'Ugandan shillings',
        faIcon: undefined
    },

    UYU: {
        symbol: '$U',
        name: 'Uruguayan Peso',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'UYU',
        name_plural: 'Uruguayan pesos',
        faIcon: undefined
    },

    UZS: {
        symbol: 'UZS',
        name: 'Uzbekistan Som',
        symbol_native: 'UZS',
        decimal_digits: 0,
        rounding: 0,
        code: 'UZS',
        name_plural: 'Uzbekistan som',
        faIcon: undefined
    },

    VEF: {
        symbol: 'Bs.F.',
        name: 'Venezuelan Bolívar',
        symbol_native: 'Bs.F.',
        decimal_digits: 2,
        rounding: 0,
        code: 'VEF',
        name_plural: 'Venezuelan bolívars',
        faIcon: undefined
    },

    VND: {
        symbol: '₫',
        name: 'Vietnamese Dong',
        symbol_native: '₫',
        decimal_digits: 0,
        rounding: 0,
        code: 'VND',
        name_plural: 'Vietnamese dong',
        faIcon: undefined
    },

    XAF: {
        symbol: 'FCFA',
        name: 'CFA Franc BEAC',
        symbol_native: 'FCFA',
        decimal_digits: 0,
        rounding: 0,
        code: 'XAF',
        name_plural: 'CFA francs BEAC',
        faIcon: undefined
    },

    XOF: {
        symbol: 'CFA',
        name: 'CFA Franc BCEAO',
        symbol_native: 'CFA',
        decimal_digits: 0,
        rounding: 0,
        code: 'XOF',
        name_plural: 'CFA francs BCEAO',
        faIcon: undefined
    },

    YER: {
        symbol: 'YR',
        name: 'Yemeni Rial',
        symbol_native: 'ر.ي.‏',
        decimal_digits: 0,
        rounding: 0,
        code: 'YER',
        name_plural: 'Yemeni rials',
        faIcon: undefined
    },

    ZMK: {
        symbol: 'ZK',
        name: 'Zambian Kwacha',
        symbol_native: 'ZK',
        decimal_digits: 0,
        rounding: 0,
        code: 'ZMK',
        name_plural: 'Zambian kwachas',
        faIcon: undefined
    }

    // ZWL: {
    //     symbol: 'ZWL$',
    //     name: 'Zimbabwean Dollar',
    //     symbol_native: 'ZWL$',
    //     decimal_digits: 0,
    //     rounding: 0,
    //     code: 'ZWL',
    //     name_plural: 'Zimbabwean Dollar',
    //     faIcon: undefined
    // }
}
