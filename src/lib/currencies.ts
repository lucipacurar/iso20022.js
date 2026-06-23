import { Decimal } from 'decimal.js';

export type Currency =
  | 'AED'
  | 'AFN'
  | 'ALL'
  | 'AMD'
  | 'ANG'
  | 'AOA'
  | 'ARS'
  | 'AUD'
  | 'AWG'
  | 'AZN'
  | 'BAM'
  | 'BBD'
  | 'BDT'
  | 'BGN'
  | 'BHD'
  | 'BIF'
  | 'BMD'
  | 'BND'
  | 'BOB'
  | 'BOV'
  | 'BRL'
  | 'BSD'
  | 'BTN'
  | 'BWP'
  | 'BYN'
  | 'BZD'
  | 'CAD'
  | 'CDF'
  | 'CHE'
  | 'CHF'
  | 'CHW'
  | 'CLF'
  | 'CLP'
  | 'CNY'
  | 'COP'
  | 'COU'
  | 'CRC'
  | 'CUC'
  | 'CUP'
  | 'CVE'
  | 'CZK'
  | 'DJF'
  | 'DKK'
  | 'DOP'
  | 'DZD'
  | 'EGP'
  | 'ERN'
  | 'ETB'
  | 'EUR'
  | 'FJD'
  | 'FKP'
  | 'GBP'
  | 'GEL'
  | 'GHS'
  | 'GIP'
  | 'GMD'
  | 'GNF'
  | 'GTQ'
  | 'GYD'
  | 'HKD'
  | 'HNL'
  | 'HTG'
  | 'HUF'
  | 'IDR'
  | 'ILS'
  | 'INR'
  | 'IQD'
  | 'IRR'
  | 'ISK'
  | 'JMD'
  | 'JOD'
  | 'JPY'
  | 'KES'
  | 'KGS'
  | 'KHR'
  | 'KMF'
  | 'KPW'
  | 'KRW'
  | 'KWD'
  | 'KYD'
  | 'KZT'
  | 'LAK'
  | 'LBP'
  | 'LKR'
  | 'LRD'
  | 'LSL'
  | 'LYD'
  | 'MAD'
  | 'MDL'
  | 'MGA'
  | 'MKD'
  | 'MMK'
  | 'MNT'
  | 'MOP'
  | 'MRU'
  | 'MUR'
  | 'MVR'
  | 'MWK'
  | 'MXN'
  | 'MXV'
  | 'MYR'
  | 'MZN'
  | 'NAD'
  | 'NGN'
  | 'NIO'
  | 'NOK'
  | 'NPR'
  | 'NZD'
  | 'OMR'
  | 'PAB'
  | 'PEN'
  | 'PGK'
  | 'PHP'
  | 'PKR'
  | 'PLN'
  | 'PYG'
  | 'QAR'
  | 'RON'
  | 'RSD'
  | 'RUB'
  | 'RWF'
  | 'SAR'
  | 'SBD'
  | 'SCR'
  | 'SDG'
  | 'SEK'
  | 'SGD'
  | 'SHP'
  | 'SLE'
  | 'SLL'
  | 'SOS'
  | 'SRD'
  | 'SSP'
  | 'STN'
  | 'SVC'
  | 'SYP'
  | 'SZL'
  | 'THB'
  | 'TJS'
  | 'TMT'
  | 'TND'
  | 'TOP'
  | 'TRY'
  | 'TTD'
  | 'TWD'
  | 'TZS'
  | 'UAH'
  | 'UGX'
  | 'USD'
  | 'USN'
  | 'UYI'
  | 'UYU'
  | 'UYW'
  | 'UZS'
  | 'VED'
  | 'VES'
  | 'VND'
  | 'VUV'
  | 'WST'
  | 'XAF'
  | 'XCD'
  | 'XOF'
  | 'XPF'
  | 'XSU'
  | 'XUA'
  | 'YER'
  | 'ZAR'
  | 'ZMW'
  | 'ZWL';

export function getCurrencyPrecision(currency: string): number {
  switch (currency) {
    case 'BHD': // Bahraini Dinar
    case 'IQD': // Iraqi Dinar
    case 'JOD': // Jordanian Dinar
    case 'KWD': // Kuwaiti Dinar
    case 'LYD': // Libyan Dinar
    case 'OMR': // Omani Rial
    case 'TND': // Tunisian Dinar
      return 3;
    case 'CLF': // Unidad de Fomento (Chile)
      return 4;
    case 'BIF': // Burundian Franc
    case 'BYN': // Belarusian Ruble
    case 'CVE': // Cape Verdean Escudo
    case 'DJF': // Djiboutian Franc
    case 'GNF': // Guinean Franc
    case 'ISK': // Icelandic Krona
    case 'JPY': // Japanese Yen
    case 'KMF': // Comorian Franc
    case 'KRW': // South Korean Won
    case 'PYG': // Paraguayan Guarani
    case 'RWF': // Rwandan Franc
    case 'UGX': // Ugandan Shilling
    case 'UYI': // Uruguayan Peso (Indexed Units)
    case 'VND': // Vietnamese Dong
    case 'VUV': // Vanuatu Vatu
    case 'XAF': // Central African CFA Franc
    case 'XOF': // West African CFA Franc
    case 'XPF': // CFP Franc
      return 0;
    default:
      return 2; // Default to 2 decimal places for most currencies
  }
}

export function formatMinorUnits(amount: number, currency: Currency): string {
  const precision = getCurrencyPrecision(currency);
  return new Decimal(amount)
    .div(new Decimal(10).pow(precision))
    .toFixed(precision);
}

export function minorUnitsToNumber(amount: number, currency: Currency): number {
  const precision = getCurrencyPrecision(currency);
  return new Decimal(amount).div(new Decimal(10).pow(precision)).toNumber();
}
