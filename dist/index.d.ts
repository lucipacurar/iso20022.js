import { Currency } from 'dinero.js';
import { XMLBuilder } from 'fast-xml-parser';

declare const Alpha2CountryCode: {
    readonly AF: "AF";
    readonly AL: "AL";
    readonly DZ: "DZ";
    readonly AS: "AS";
    readonly AD: "AD";
    readonly AO: "AO";
    readonly AI: "AI";
    readonly AQ: "AQ";
    readonly AG: "AG";
    readonly AR: "AR";
    readonly AM: "AM";
    readonly AW: "AW";
    readonly AU: "AU";
    readonly AT: "AT";
    readonly AZ: "AZ";
    readonly BS: "BS";
    readonly BH: "BH";
    readonly BD: "BD";
    readonly BB: "BB";
    readonly BY: "BY";
    readonly BE: "BE";
    readonly BZ: "BZ";
    readonly BJ: "BJ";
    readonly BM: "BM";
    readonly BT: "BT";
    readonly BO: "BO";
    readonly BA: "BA";
    readonly BW: "BW";
    readonly BV: "BV";
    readonly BR: "BR";
    readonly IO: "IO";
    readonly BN: "BN";
    readonly BG: "BG";
    readonly BF: "BF";
    readonly BI: "BI";
    readonly KH: "KH";
    readonly CM: "CM";
    readonly CA: "CA";
    readonly CV: "CV";
    readonly KY: "KY";
    readonly CF: "CF";
    readonly TD: "TD";
    readonly CL: "CL";
    readonly CN: "CN";
    readonly CX: "CX";
    readonly CC: "CC";
    readonly CO: "CO";
    readonly KM: "KM";
    readonly CG: "CG";
    readonly CD: "CD";
    readonly CK: "CK";
    readonly CR: "CR";
    readonly CI: "CI";
    readonly HR: "HR";
    readonly CU: "CU";
    readonly CY: "CY";
    readonly CZ: "CZ";
    readonly DK: "DK";
    readonly DJ: "DJ";
    readonly DM: "DM";
    readonly DO: "DO";
    readonly EC: "EC";
    readonly EG: "EG";
    readonly SV: "SV";
    readonly GQ: "GQ";
    readonly ER: "ER";
    readonly EE: "EE";
    readonly ET: "ET";
    readonly FK: "FK";
    readonly FO: "FO";
    readonly FJ: "FJ";
    readonly FI: "FI";
    readonly FR: "FR";
    readonly GF: "GF";
    readonly PF: "PF";
    readonly TF: "TF";
    readonly GA: "GA";
    readonly GM: "GM";
    readonly GE: "GE";
    readonly DE: "DE";
    readonly GH: "GH";
    readonly GI: "GI";
    readonly GR: "GR";
    readonly GL: "GL";
    readonly GD: "GD";
    readonly GP: "GP";
    readonly GU: "GU";
    readonly GT: "GT";
    readonly GN: "GN";
    readonly GW: "GW";
    readonly GY: "GY";
    readonly HT: "HT";
    readonly HM: "HM";
    readonly VA: "VA";
    readonly HN: "HN";
    readonly HK: "HK";
    readonly HU: "HU";
    readonly IS: "IS";
    readonly IN: "IN";
    readonly ID: "ID";
    readonly IR: "IR";
    readonly IQ: "IQ";
    readonly IE: "IE";
    readonly IL: "IL";
    readonly IT: "IT";
    readonly JM: "JM";
    readonly JP: "JP";
    readonly JO: "JO";
    readonly KZ: "KZ";
    readonly KE: "KE";
    readonly KI: "KI";
    readonly KP: "KP";
    readonly KR: "KR";
    readonly KW: "KW";
    readonly KG: "KG";
    readonly LA: "LA";
    readonly LV: "LV";
    readonly LB: "LB";
    readonly LS: "LS";
    readonly LR: "LR";
    readonly LY: "LY";
    readonly LI: "LI";
    readonly LT: "LT";
    readonly LU: "LU";
    readonly MO: "MO";
    readonly MG: "MG";
    readonly MW: "MW";
    readonly MY: "MY";
    readonly MV: "MV";
    readonly ML: "ML";
    readonly MT: "MT";
    readonly MH: "MH";
    readonly MQ: "MQ";
    readonly MR: "MR";
    readonly MU: "MU";
    readonly YT: "YT";
    readonly MX: "MX";
    readonly FM: "FM";
    readonly MD: "MD";
    readonly MC: "MC";
    readonly MN: "MN";
    readonly MS: "MS";
    readonly MA: "MA";
    readonly MZ: "MZ";
    readonly MM: "MM";
    readonly NA: "NA";
    readonly NR: "NR";
    readonly NP: "NP";
    readonly NL: "NL";
    readonly NC: "NC";
    readonly NZ: "NZ";
    readonly NI: "NI";
    readonly NE: "NE";
    readonly NG: "NG";
    readonly NU: "NU";
    readonly NF: "NF";
    readonly MK: "MK";
    readonly MP: "MP";
    readonly NO: "NO";
    readonly OM: "OM";
    readonly PK: "PK";
    readonly PW: "PW";
    readonly PS: "PS";
    readonly PA: "PA";
    readonly PG: "PG";
    readonly PY: "PY";
    readonly PE: "PE";
    readonly PH: "PH";
    readonly PN: "PN";
    readonly PL: "PL";
    readonly PT: "PT";
    readonly PR: "PR";
    readonly QA: "QA";
    readonly RE: "RE";
    readonly RO: "RO";
    readonly RU: "RU";
    readonly RW: "RW";
    readonly SH: "SH";
    readonly KN: "KN";
    readonly LC: "LC";
    readonly PM: "PM";
    readonly VC: "VC";
    readonly WS: "WS";
    readonly SM: "SM";
    readonly ST: "ST";
    readonly SA: "SA";
    readonly SN: "SN";
    readonly SC: "SC";
    readonly SL: "SL";
    readonly SG: "SG";
    readonly SK: "SK";
    readonly SI: "SI";
    readonly SB: "SB";
    readonly SO: "SO";
    readonly ZA: "ZA";
    readonly GS: "GS";
    readonly ES: "ES";
    readonly LK: "LK";
    readonly SD: "SD";
    readonly SR: "SR";
    readonly SJ: "SJ";
    readonly SZ: "SZ";
    readonly SE: "SE";
    readonly CH: "CH";
    readonly SY: "SY";
    readonly TW: "TW";
    readonly TJ: "TJ";
    readonly TZ: "TZ";
    readonly TH: "TH";
    readonly TL: "TL";
    readonly TG: "TG";
    readonly TK: "TK";
    readonly TO: "TO";
    readonly TT: "TT";
    readonly TN: "TN";
    readonly TR: "TR";
    readonly TM: "TM";
    readonly TC: "TC";
    readonly TV: "TV";
    readonly UG: "UG";
    readonly UA: "UA";
    readonly AE: "AE";
    readonly GB: "GB";
    readonly US: "US";
    readonly UM: "UM";
    readonly UY: "UY";
    readonly UZ: "UZ";
    readonly VU: "VU";
    readonly VE: "VE";
    readonly VN: "VN";
    readonly VG: "VG";
    readonly VI: "VI";
    readonly WF: "WF";
    readonly EH: "EH";
    readonly YE: "YE";
    readonly ZM: "ZM";
    readonly ZW: "ZW";
    readonly AX: "AX";
    readonly BQ: "BQ";
    readonly CW: "CW";
    readonly GG: "GG";
    readonly IM: "IM";
    readonly JE: "JE";
    readonly ME: "ME";
    readonly BL: "BL";
    readonly MF: "MF";
    readonly RS: "RS";
    readonly SX: "SX";
    readonly SS: "SS";
    readonly XK: "XK";
};
type Alpha2Country = (typeof Alpha2CountryCode)[keyof typeof Alpha2CountryCode];

/**
 * Represents a payment instruction with essential details.
 */
interface PaymentInstruction {
    /** Unique identifier for the payment instruction. */
    id?: string;
    /** Unique end-to-end identifier for the payment. */
    endToEndId?: string;
    /** Indicates whether the payment is a credit or debit. */
    direction?: 'credit' | 'debit';
    /** The amount of the payment. Usually in cents. */
    amount: number;
    /** The currency of the payment. */
    currency: Currency;
    /** The party from which the payment is debited. */
    debtor?: Party;
    /** The party to which the payment is credited. */
    creditor?: Party;
    /** Additional information about the payment. */
    remittanceInformation?: string;
}
/**
 * Represents a credit payment instruction, extending the base PaymentInstruction.
 */
interface CreditPaymentInstruction extends PaymentInstruction {
    direction?: 'credit';
    creditor: Party;
}
/**
 * Represents a SWIFT credit payment instruction, extending the base PaymentInstruction.
 */
interface SWIFTCreditPaymentInstruction extends CreditPaymentInstruction {
    /** Specifies that this is a SWIFT payment. */
    type?: 'swift';
}
interface SEPACreditPaymentInstruction extends CreditPaymentInstruction {
    type?: 'sepa';
    currency: 'EUR';
    /** Optional requested payment execution date. If not provided, defaults to current date. */
    requestedPaymentExecutionDate?: Date;
}
interface RTPCreditPaymentInstruction extends CreditPaymentInstruction {
    type?: 'rtp';
    currency: 'USD';
}
/**
 * Represents an ACH credit payment instruction, extending the base PaymentInstruction.
 */
interface ACHCreditPaymentInstruction extends CreditPaymentInstruction {
    /** Specifies that this is an ACH payment. */
    type?: 'ach';
    /** ACH payments must use USD as currency. */
    currency: 'USD';
}
/**
 * Category purpose codes as defined in ISO 20022 ExternalCategoryPurpose1Code.
 * @see {@link https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets}
 */
declare const ExternalCategoryPurposeCode: {
    /** Transaction is the payment of a bonus */
    readonly Bonus: "BONU";
    /** Transaction is a general cash management instruction */
    readonly CashManagement: "CASH";
    /** A service that is settling money for a bulk of card transactions */
    readonly CardBulk: "CBLK";
    /** Transaction is related to a payment of credit card */
    readonly CreditCard: "CCRD";
    /** Transaction is related to settlement of a trade */
    readonly TradeSettlement: "CORT";
    /** Transaction is related to a payment of debit card */
    readonly DebitCard: "DCRD";
    /** Transaction is the payment of dividends */
    readonly Dividends: "DIVI";
    /** Code used to pre-advise forthcoming deliver against payment instruction */
    readonly DeliverAgainstPayment: "DVPM";
    /** Transaction is related to ePayment */
    readonly EPayment: "EPAY";
    /** Transaction is related to the payment of a fee and interest */
    readonly FeeAndInterest: "FCIN";
    /** A service that is settling card transaction related fees between two parties */
    readonly CardFeeSettlement: "FCOL";
    /** General Person-to-Person Payment */
    readonly GeneralP2P: "GP2P";
    /** Transaction is a payment to or from a government department */
    readonly Government: "GOVT";
    /** Transaction is related to the payment of a hedging operation */
    readonly Hedging: "HEDG";
    /** Transaction is reimbursement of credit card payment */
    readonly CreditCardReimbursement: "ICCP";
    /** Transaction is reimbursement of debit card payment */
    readonly DebitCardReimbursement: "IDCP";
    /** Transaction is an intra-company payment */
    readonly IntraCompany: "INTC";
    /** Transaction is the payment of interest */
    readonly Interest: "INTE";
    /** Transaction is related to identify cash handling via Night Safe or Lockbox */
    readonly Lockbox: "LBOX";
    /** Transaction is related to the transfer of a loan to a borrower */
    readonly Loan: "LOAN";
    /** Mobile P2B Payment */
    readonly MobileP2B: "MP2B";
    /** Mobile P2P Payment */
    readonly MobileP2P: "MP2P";
    /** Other payment purpose */
    readonly Other: "OTHR";
    /** Transaction is the payment of pension */
    readonly Pension: "PENS";
    /** Collection used to re-present previously reversed or returned direct debit transactions */
    readonly Represent: "RPRE";
    /** Transaction is related to a reimbursement for commercial reasons */
    readonly CommercialReimbursement: "RRCT";
    /** Code used to pre-advise forthcoming receive against payment instruction */
    readonly ReceiveAgainstPayment: "RVPM";
    /** Transaction is the payment of salaries */
    readonly Salary: "SALA";
    /** Transaction is the payment of securities */
    readonly Securities: "SECU";
    /** Transaction is a social security benefit */
    readonly SocialSecurityBenefit: "SSBE";
    /** Transaction is related to a payment to a supplier */
    readonly Supplier: "SUPP";
    /** Transaction is the payment of taxes */
    readonly Taxes: "TAXS";
    /** Transaction is related to the payment of a trade finance transaction */
    readonly Trade: "TRAD";
    /** Transaction is related to treasury operations */
    readonly Treasury: "TREA";
    /** Transaction is the payment of value added tax */
    readonly VAT: "VATX";
    /** Transaction is the payment of withholding tax */
    readonly WithholdingTax: "WHLD";
    /** Transaction relates to a cash management sweep instruction */
    readonly Sweep: "SWEP";
    /** Transaction relates to a cash management top-up instruction */
    readonly TopUp: "TOPG";
    /** Transaction relates to a zero balance account instruction */
    readonly ZeroBalance: "ZABA";
    /** Transaction to be processed as a domestic payment instruction from foreign bank */
    readonly DomesticFromForeign: "VOST";
    /** Foreign Currency Transaction between domestic financial institutions */
    readonly ForeignCurrencyDomestic: "FCDT";
    /** Transaction is a direct debit for a cash order of notes and/or coins */
    readonly CashOrder: "CIPC";
    /** Transaction is a direct debit for a cash order of notes and/or coins */
    readonly CashOrderConsolidated: "CONC";
    /** Transaction is a payment for cash collection by Cash in Transit company */
    readonly CashInTransit: "CGWV";
    /** Transfer to/from savings or retirement account */
    readonly Savings: "SAVG";
    /** Cross border transaction subject to Dodd Frank 1073 */
    readonly CrossBorderDoddFrank: "CTDF";
};
type ExternalCategoryPurpose = (typeof ExternalCategoryPurposeCode)[keyof typeof ExternalCategoryPurposeCode];
/**
 * Represents a structured address format.
 */
interface StructuredAddress {
    /** The name of the street. */
    streetName?: string;
    /** The building number on the street. */
    buildingNumber?: string;
    /** The name of the town or city. */
    townName?: string;
    /** The subdivision of the country (e.g., state, province). */
    countrySubDivision?: string;
    /** The postal or ZIP code. */
    postalCode?: string;
    /** The country, typically represented by a country code. */
    country?: Alpha2Country;
}
/**
 * Represents a party involved in a payment transaction.
 */
interface Party {
    /** Unique identifier for the party. */
    id?: string;
    /** The name of the party. */
    name?: string;
    /** The structured address of the party. */
    address?: StructuredAddress;
    /** The account details of the party. */
    account?: Account;
    /** The financial agent (e.g., bank) of the party. */
    agent?: Agent;
}
/**
 * Represents an account identified by IBAN.
 */
interface IBANAccount {
    /** The International Bank Account Number. */
    iban: string;
}
/**
 * Represents a basic account with account number and optional type.
 */
interface BaseAccount {
    /** The account number. */
    accountNumber: string;
    /** The type of the account. */
    accountType?: 'checking' | 'savings';
    /** The currency of the account. */
    currency?: Currency;
    /** The name of the account. */
    name?: string;
}
/**
 * Represents either an IBAN account or a basic account.
 */
type Account = IBANAccount | BaseAccount;
/**
 * Represents a financial agent identified by BIC.
 */
interface BICAgent {
    /** The Bank Identifier Code. */
    bic: string;
    /** The structured address of the bank. */
    bankAddress?: StructuredAddress;
}
/**
 * Represents a financial agent identified by ABA routing number.
 */
interface ABAAgent {
    /** The ABA routing number. */
    abaRoutingNumber: string;
}
/**
 * Represents either a BIC or ABA identified financial agent.
 * NOTE: Sometimes an agent can include both a BIC and ABA routing number.
 * This library does not support that yet, but we will need to.
 */
type Agent = BICAgent | ABAAgent;
/**
 * ACH Local Instrument Codes as defined in NACHA standards.
 * These codes identify the specific type of ACH transaction.
 */
declare const ACHLocalInstrumentCode: {
    /** Corporate Credit or Debit */
    readonly CorporateCreditDebit: "CCD";
    /** Prearranged Payment and Deposit */
    readonly PrearrangedPaymentDeposit: "PPD";
    /** Internet-Initiated Entry */
    readonly InternetInitiated: "WEB";
    /** Telephone-Initiated Entry */
    readonly TelephoneInitiated: "TEL";
    /** Point-of-Purchase Entry */
    readonly PointOfPurchase: "POP";
    /** Accounts Receivable Entry */
    readonly AccountsReceivable: "ARC";
    /** Back Office Conversion */
    readonly BackOfficeConversion: "BOC";
    /** Represented Check Entry */
    readonly RepresentedCheck: "RCK";
};
type ACHLocalInstrument = (typeof ACHLocalInstrumentCode)[keyof typeof ACHLocalInstrumentCode];
declare const ACHLocalInstrumentCodeDescriptionMap: {
    readonly CCD: "Corporate Credit or Debit";
    readonly PPD: "Prearranged Payment and Deposit";
    readonly WEB: "Internet-Initiated Entry";
    readonly TEL: "Telephone-Initiated Entry";
    readonly POP: "Point-of-Purchase Entry";
    readonly ARC: "Accounts Receivable Entry";
    readonly BOC: "Back Office Conversion";
    readonly RCK: "Represented Check Entry";
};
/**
 * SEPA Direct Debit Local Instrument Codes.
 * Defines the type of SEPA direct debit scheme.
 */
type SEPALocalInstrument = 'CORE' | 'B2B';
/**
 * SEPA Direct Debit Sequence Type Codes.
 * Indicates the position of a direct debit transaction in a series of recurring direct debits.
 * - FRST: First collection in a series of recurring direct debits
 * - RCUR: Recurring collection in a series of recurring direct debits
 * - OOFF: One-off direct debit collection
 * - FNAL: Final collection in a series of recurring direct debits
 */
type SEPASequenceType = 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
/**
 * Information about amendments made to a direct debit mandate.
 */
interface MandateAmendmentInformation {
    /** Original mandate identification before amendment */
    originalMandateId?: string;
    /** Original creditor scheme identification before amendment */
    originalCreditorSchemeId?: {
        name?: string;
        id?: string;
    };
    /** Original debtor before amendment */
    originalDebtor?: Party;
    /** Original debtor account before amendment */
    originalDebtorAccount?: Account;
}
/**
 * Direct debit mandate information.
 * A mandate is an authorization from a debtor allowing a creditor to collect payments.
 */
interface MandateInformation {
    /** Unique mandate identification */
    mandateId: string;
    /** Date when the mandate was signed by the debtor */
    dateOfSignature: Date;
    /** Indicates whether the mandate has been amended */
    amendmentIndicator: boolean;
    /** Amendment details if the mandate has been amended */
    amendmentInformation?: MandateAmendmentInformation;
}
/**
 * Represents a SEPA direct debit payment instruction.
 */
interface SEPADirectDebitPaymentInstruction extends PaymentInstruction {
    type?: 'sepa';
    direction?: 'debit';
    currency: 'EUR';
    /** The party being debited (money is collected from this party) */
    debtor: Party;
    /** Mandate information authorizing the direct debit */
    mandate: MandateInformation;
}

/**
 * Abstract base class for ISO20022 payment initiation (PAIN) messages.
 * @abstract
 */
declare abstract class PaymentInitiation {
    type: 'swift' | 'rtp' | 'sepa' | 'ach';
    constructor({ type }: {
        type: 'swift' | 'rtp' | 'sepa' | 'ach';
    });
    /**
     * Serializes the payment initiation to a string format.
     * @abstract
     * @returns {string} The serialized payment initiation.
     */
    abstract serialize(): string;
    /**
     * Formats a party's information according to ISO20022 standards.
     * @param {Party} party - The party's information.
     * @returns {Object} Formatted XML party information.
     */
    party(party: Party): any;
    /**
     * Formats an account according to ISO20022 standards.
     * This method handles both IBAN and non-IBAN accounts.
     *
     * @param {Account} account - The account to be formatted. Can be either an IBANAccount or a BaseAccount.
     * @returns {Object} An object representing the formatted account information.
     *                   For IBAN accounts, it returns an object with an IBAN identifier.
     *                   For non-IBAN accounts, it returns an object with an 'Other' identifier.
     *
     * @example
     * // For an IBAN account
     * account({ iban: 'DE89370400440532013000' })
     * // Returns: { Id: { IBAN: 'DE89370400440532013000' } }
     *
     * @example
     * // For a non-IBAN account
     * account({ accountNumber: '1234567890' })
     * // Returns: { Id: { Othr: { Id: '1234567890' } } }
     */
    account(account: Account): {
        Id: {
            IBAN: string;
        };
    } | {
        Id: {
            Othr: {
                Id: string;
            };
        };
    };
    /**
     * Formats an IBAN account according to ISO20022 standards.
     * @param {IBANAccount} account - The IBAN account information.
     * @returns {Object} Formatted XML IBAN account information.
     */
    internationalAccount(account: IBANAccount): {
        Id: {
            IBAN: string;
        };
    };
    /**
     * Formats an agent according to ISO20022 standards.
     * This method handles both BIC and ABA agents.
     *
     * @param {Agent} agent - The agent to be formatted. Can be either a BICAgent or an ABAAgent.
     * @returns {Object} An object representing the formatted agent information.
     *                   For BIC agents, it returns an object with a BIC identifier.
     *                   For ABA agents, it returns an object with clearing system member identification.
     *
     * @example
     * // For a BIC agent
     * agent({ bic: 'BOFAUS3NXXX' })
     * // Returns: { FinInstnId: { BIC: 'BOFAUS3NXXX' } }
     *
     * @example
     * // For an ABA agent
     * agent({ abaRoutingNumber: '026009593' })
     * // Returns: { FinInstnId: { ClrSysMmbId: { MmbId: '026009593' } } }
     */
    agent(agent: Agent): {
        FinInstnId: {
            BIC: string;
            ClrSysMmbId?: undefined;
        };
    } | {
        FinInstnId: {
            ClrSysMmbId: {
                ClrSysId: {
                    Cd: string;
                };
                MmbId: string;
            };
            BIC?: undefined;
        };
    };
    /**
     * Returns the string representation of the payment initiation.
     * @returns {string} The serialized payment initiation.
     */
    toString(): string;
    static getBuilder(): XMLBuilder;
}

type AtLeastOne$6<T> = [T, ...T[]];
/**
 * Configuration for SWIFT Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the payment.
 * @property {AtLeastOne<SWIFTCreditPaymentInstruction>} paymentInstructions - An array of payment instructions.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
interface SWIFTCreditPaymentInitiationConfig$1 {
    /** The party initiating the payment. */
    initiatingParty: Party;
    /** An array of payment instructions. */
    paymentInstructions: AtLeastOne$6<SWIFTCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a SWIFT Credit Payment v3 Initiation message (pain.001.001.03).
 * @class
 * @extends PaymentInitiation
 * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration for the SWIFT Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new SWIFTCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SWIFTCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
declare class SWIFTCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: SWIFTCreditPaymentInstruction[];
    paymentInformationId: string;
    /**
     * Creates an instance of SWIFTCreditPaymentInitiation.
     * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration object.
     */
    constructor(config: SWIFTCreditPaymentInitiationConfig$1);
    /**
     * Validates the payment initiation data has the information required to create a valid XML file.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If any creditor has incomplete address information.
     */
    private validate;
    /**
     * Generates payment information for a single payment instruction.
     * @param {SWIFTCreditPaymentInstruction} paymentInstruction - The payment instruction.
     * @returns {Object} The credit transfer object.
     */
    creditTransfer(paymentInstruction: SWIFTCreditPaymentInstruction): Record<string, any>;
    /**
     * Serializes the payment initiation to an XML string.
     * @returns {string} The XML representation of the payment initiation.
     */
    static fromXML(rawXml: string): SWIFTCreditPaymentInitiation;
    serialize(): string;
}

type AtLeastOne$5<T> = [T, ...T[]];
/**
 * Configuration for SEPA Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the SEPA credit transfer.
 * @property {AtLeastOne<SEPACreditPaymentInstruction>} paymentInstructions - An array containing at least one payment instruction for SEPA credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code following ISO20022 ExternalCategoryPurpose1Code standard.
 */
interface SEPACreditPaymentInitiationConfig$1 {
    /** The party initiating the SEPA credit transfer. */
    initiatingParty: Party;
    /** An array containing at least one payment instruction for SEPA credit transfer. */
    paymentInstructions: AtLeastOne$5<SEPACreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
    /** Optional category purpose code following ISO20022 ExternalCategoryPurpose1Code standard */
    categoryPurpose?: ExternalCategoryPurpose;
}
/**
 * Represents a SEPA Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPACreditPaymentInitiationConfig} config - The configuration for the SEPA Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA payment message
 * const payment = new SEPACreditPaymentInitiation({
 *   // configuration options
 * });
 * // Uploading the payment
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SEPACreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
declare class SEPACreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: AtLeastOne$5<SEPACreditPaymentInstruction>;
    paymentInformationId: string;
    categoryPurpose?: ExternalCategoryPurpose;
    private formattedPaymentSum;
    /**
     * Creates an instance of SEPACreditPaymentInitiation.
     * @param {SEPACreditPaymentInitiationConfig} config - The configuration object for the SEPA credit transfer.
     */
    constructor(config: SEPACreditPaymentInitiationConfig$1);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<SEPACreditPaymentInstruction>} instructions - Array of payment instructions.
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     * @throws {Error} If payment instructions have different currencies.
     */
    private sumPaymentInstructions;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If payment instructions have different currencies.
     * @throws {Error} If any creditor has incomplete address information.
     */
    private validate;
    private validateAllInstructionsHaveSameCurrency;
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction: SEPACreditPaymentInstruction): {
        Cdtr: any;
        CdtrAcct: {
            Id: {
                IBAN: string;
            };
            Ccy: "EUR";
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
        CdtrAgt?: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        } | undefined;
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "EUR";
            };
        };
    };
    /**
     * Serializes the SEPA credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the SEPA credit transfer initiation.
     */
    serialize(): string;
    static fromXML(rawXml: string): SEPACreditPaymentInitiation;
}

type AtLeastOne$4<T> = [T, ...T[]];
/**
 * Represents a group of payment instructions for a single debtor (PmtInf block).
 *
 * @property {Party} initiatingParty - The party (debtor) for this specific payment information block.
 * @property {AtLeastOne<SEPACreditPaymentInstruction>} payments - An array containing at least one payment instruction for this debtor.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code for this payment information block.
 */
interface SEPAMultiCreditPaymentInstructionGroup {
    /** The party (debtor) for this specific payment information block. */
    initiatingParty: Party;
    /** An array containing at least one payment instruction for this debtor. */
    payments: AtLeastOne$4<SEPACreditPaymentInstruction>;
    /** Optional category purpose code for this payment information block. */
    categoryPurpose?: ExternalCategoryPurpose;
    /** Indicates whether transactions should be booked in batch. Defaults to false. */
    batchBooking?: boolean;
}
/**
 * Configuration for SEPA Multi Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The top-level party initiating the message (used in GrpHdr).
 * @property {AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>} paymentInstructions - An array containing at least one payment instruction group.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
interface SEPAMultiCreditPaymentInitiationConfig$1 {
    /** The top-level party initiating the message (used in GrpHdr). */
    initiatingParty: Party;
    /** An array containing at least one payment instruction group. */
    paymentInstructions: AtLeastOne$4<SEPAMultiCreditPaymentInstructionGroup>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a SEPA Multi Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * with multiple payment information blocks (multiple debtors) according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration for the SEPA Multi Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA multi-payment message
 * const payment = new SEPAMultiCreditPaymentInitiation({
 *   initiatingParty: { name: 'Company Ltd', id: '12345' },
 *   paymentInstructions: [
 *     {
 *       initiatingParty: debtor1,
 *       payments: [payment1, payment2]
 *     },
 *     {
 *       initiatingParty: debtor2,
 *       payments: [payment3]
 *     }
 *   ]
 * });
 * ```
 */
declare class SEPAMultiCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: AtLeastOne$4<SEPAMultiCreditPaymentInstructionGroup>;
    private formattedPaymentSum;
    private totalTransactionCount;
    /**
     * Creates an instance of SEPAMultiCreditPaymentInitiation.
     * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration object for the SEPA multi credit transfer.
     */
    constructor(config: SEPAMultiCreditPaymentInitiationConfig$1);
    /**
     * Counts the total number of transactions across all payment instruction groups.
     * @private
     * @returns {number} The total count of all transactions.
     */
    private countAllTransactions;
    /**
     * Calculates the sum of all payment instructions across all groups.
     * @private
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     */
    private sumAllPayments;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If any group's payment instructions have different currencies.
     */
    private validate;
    /**
     * Validates that all payment instructions in a group have the same currency.
     * @private
     * @param {AtLeastOne<SEPACreditPaymentInstruction>} payments - Array of payment instructions.
     * @throws {Error} If payment instructions have different currencies.
     */
    private validateGroupInstructionsHaveSameCurrency;
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction: SEPACreditPaymentInstruction): {
        Cdtr: any;
        CdtrAcct: {
            Id: {
                IBAN: string;
            };
            Ccy: "EUR";
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
        CdtrAgt?: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        } | undefined;
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "EUR";
            };
        };
    };
    /**
     * Serializes the SEPA multi credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the SEPA multi credit transfer initiation.
     */
    serialize(): string;
    /**
     * Parses an XML string and creates a SEPAMultiCreditPaymentInitiation instance.
     * Supports multiple PmtInf blocks in the XML document.
     * @param {string} rawXml - The XML string to parse.
     * @returns {SEPAMultiCreditPaymentInitiation} A new instance created from the XML data.
     * @throws {InvalidXmlError} If the XML format is invalid.
     * @throws {InvalidXmlNamespaceError} If the namespace is not pain.001.001.03.
     */
    static fromXML(rawXml: string): SEPAMultiCreditPaymentInitiation;
}

type AtLeastOne$3<T> = [T, ...T[]];
/**
 * Configuration for RTP Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the RTP credit transfer.
 * @property {AtLeastOne<RTPCreditPaymentInstruction>} paymentInstructions - Array containing at least one payment instruction for the RTP credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
interface RTPCreditPaymentInitiationConfig$1 {
    /** The party initiating the RTP credit transfer. */
    initiatingParty: Party;
    /** Array containing at least one payment instruction for the RTP credit transfer. */
    paymentInstructions: AtLeastOne$3<RTPCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a RTP Credit Payment Initiation.
 * This class handles the creation and serialization of RTP credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {RTPCreditPaymentInitiationConfig} config - The configuration for the RTP Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new RTPCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = RTPCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/rtpcredit} for more information.
 */
declare class RTPCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    paymentInstructions: AtLeastOne$3<RTPCreditPaymentInstruction>;
    messageId: string;
    creationDate: Date;
    paymentInformationId: string;
    private formattedPaymentSum;
    constructor(config: RTPCreditPaymentInitiationConfig$1);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<RTPCreditPaymentInstruction>} instructions - Array of payment instructions.
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     * @throws {Error} If payment instructions have different currencies.
     */
    private sumPaymentInstructions;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If payment instructions have different currencies.
     * @throws {Error} If any creditor has incomplete address information.
     */
    private validate;
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {RTPCreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction: RTPCreditPaymentInstruction): {
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "USD";
            };
        };
        CdtrAgt: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        };
        Cdtr: any;
        CdtrAcct: {
            Id: {
                Othr: {
                    Id: string;
                };
            };
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
    };
    /**
     * Serializes the RTP credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the RTP credit transfer initiation.
     */
    serialize(): string;
    static fromXML(rawXml: string): RTPCreditPaymentInitiation;
}

type AtLeastOne$2<T> = [T, ...T[]];
/**
 * Configuration for ACH Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the ACH credit transfer.
 * @property {AtLeastOne<ACHCreditPaymentInstruction>} paymentInstructions - Array containing at least one payment instruction for the ACH credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
interface ACHCreditPaymentInitiationConfig$1 {
    /** The party initiating the ACH credit transfer. */
    initiatingParty: Party;
    /** Array containing at least one payment instruction for the ACH credit transfer. */
    paymentInstructions: AtLeastOne$2<ACHCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
    /** Optional local instrument code for the ACH credit transfer. If not provided, 'CCD' (Corporate Credit or Debit) will be used. */
    localInstrument?: ACHLocalInstrument;
}
/**
 * Represents an ACH Credit Payment Initiation.
 * This class handles the creation and serialization of ACH credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {ACHCreditPaymentInitiationConfig} config - The configuration for the ACH Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new ACHCreditPaymentInitiation({
 *   initiatingParty: {
 *     name: 'John Doe Corporation',
 *     id: 'JOHNDOE99',
 *     account: {
 *       accountNumber: '0123456789'
 *     },
 *     agent: {
 *       abaRoutingNumber: '123456789',
 *     }
 *   },
 *   paymentInstructions: [{
 *     type: 'ach',
 *     direction: 'credit',
 *     amount: 1000,
 *     currency: 'USD',
 *     creditor: {
 *       name: 'John Doe Funding LLC',
 *       account: {
 *         accountNumber: '0123456789'
 *       },
 *       agent: {
 *         abaRoutingNumber: '0123456789'
 *       }
 *     }
 *   }]
 * });
 *
 * // Serializing to XML
 * const xml = payment.serialize();
 *
 * // Parsing from XML
 * const parsedPayment = ACHCreditPaymentInitiation.fromXML(xml);
 * ```
 */
declare class ACHCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    paymentInstructions: AtLeastOne$2<ACHCreditPaymentInstruction>;
    messageId: string;
    creationDate: Date;
    paymentInformationId: string;
    localInstrument: string;
    serviceLevel: string;
    instructionPriority: string;
    private formattedPaymentSum;
    constructor(config: ACHCreditPaymentInitiationConfig$1);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<ACHCreditPaymentInstruction>} instructions - Array of payment instructions.
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     * @throws {Error} If payment instructions have different currencies.
     */
    private sumPaymentInstructions;
    /**
     * Validates the payment initiation data according to ACH requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If payment instructions have different currencies.
     * @throws {Error} If any creditor has incomplete information.
     */
    private validate;
    /**
     * Generates payment information for a single ACH credit transfer instruction.
     * @param {ACHCreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to ACH specifications.
     */
    creditTransfer(instruction: ACHCreditPaymentInstruction): {
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "USD";
            };
        };
        CdtrAgt: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        };
        Cdtr: any;
        CdtrAcct: {
            Id: {
                Othr: {
                    Id: string;
                };
            };
            Tp: {
                Cd: string;
            };
            Ccy: "USD";
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
    };
    /**
     * Serializes the ACH credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the ACH credit transfer initiation.
     */
    serialize(): string;
    /**
     * Creates an ACHCreditPaymentInitiation instance from an XML string.
     * @param {string} rawXml - The XML string to parse.
     * @returns {ACHCreditPaymentInitiation} A new ACHCreditPaymentInitiation instance.
     * @throws {InvalidXmlError} If the XML format is invalid.
     * @throws {InvalidXmlNamespaceError} If the XML namespace is invalid.
     * @throws {Error} If multiple payment information blocks are found.
     */
    static fromXML(rawXml: string): ACHCreditPaymentInitiation;
}

type AtLeastOne$1<T> = [T, ...T[]];
/**
 * Represents a group of direct debit payment instructions for a single creditor (PmtInf block).
 *
 * @property {Party} creditor - The party collecting money from debtors.
 * @property {string} creditorSchemeId - The creditor's SEPA scheme identifier (e.g., "DE96ZZZ00000345986").
 * @property {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - An array containing at least one payment instruction for this creditor.
 * @property {Date} requestedCollectionDate - The date when funds should be collected from all debtors in this group.
 * @property {SEPASequenceType} sequenceType - Sequence type indicating the position in a series of direct debits (FRST, RCUR, OOFF, FNAL).
 * @property {SEPALocalInstrument} [localInstrument] - The SEPA direct debit scheme (CORE or B2B). Defaults to 'CORE'.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code for this payment information block.
 * @property {boolean} [batchBooking] - Indicates whether transactions should be booked in batch. Defaults to false.
 */
interface SEPADirectDebitPaymentInstructionGroup {
    /** The party collecting money from debtors. */
    creditor: Party;
    /** The creditor's SEPA scheme identifier. */
    creditorSchemeId: string;
    /** An array containing at least one direct debit instruction. */
    payments: AtLeastOne$1<SEPADirectDebitPaymentInstruction>;
    /** The date when funds should be collected from all debtors. */
    requestedCollectionDate: Date;
    /** Sequence type for all transactions in this group (FRST, RCUR, OOFF, FNAL). */
    sequenceType: SEPASequenceType;
    /** The SEPA direct debit scheme (CORE or B2B). Defaults to 'CORE'. */
    localInstrument?: SEPALocalInstrument;
    /** Optional category purpose code for this payment information block. */
    categoryPurpose?: ExternalCategoryPurpose;
    /** Indicates whether transactions should be booked in batch. Defaults to false. */
    batchBooking?: boolean;
}
/**
 * Configuration for SEPA Direct Debit Payment Initiation.
 *
 * @property {Party} initiatingParty - The top-level party initiating the message (used in GrpHdr).
 * @property {AtLeastOne<SEPADirectDebitPaymentInstructionGroup>} paymentInstructions - An array containing at least one payment instruction group.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
interface SEPADirectDebitPaymentInitiationConfig$1 {
    /** The top-level party initiating the message (used in GrpHdr). */
    initiatingParty: Party;
    /** An array containing at least one payment instruction group. */
    paymentInstructions: AtLeastOne$1<SEPADirectDebitPaymentInstructionGroup>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a SEPA Direct Debit Payment Initiation.
 * This class handles the creation and serialization of SEPA direct debit messages
 * with multiple payment information blocks (multiple creditors) according to the ISO20022 pain.008 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration for the SEPA Direct Debit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA direct debit message
 * const payment = new SEPADirectDebitPaymentInitiation({
 *   initiatingParty: { name: 'Company Ltd', id: '12345' },
 *   paymentInstructions: [
 *     {
 *       creditor: creditor1,
 *       creditorSchemeId: 'DE96ZZZ00000345986',
 *       requestedCollectionDate: new Date('2025-11-22'),
 *       sequenceType: 'RCUR',
 *       payments: [debit1, debit2]
 *     }
 *   ]
 * });
 * ```
 */
declare class SEPADirectDebitPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: AtLeastOne$1<SEPADirectDebitPaymentInstructionGroup>;
    private formattedPaymentSum;
    private totalTransactionCount;
    /**
     * Creates an instance of SEPADirectDebitPaymentInitiation.
     * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration object for the SEPA direct debit.
     */
    constructor(config: SEPADirectDebitPaymentInitiationConfig$1);
    /**
     * Counts the total number of transactions across all payment instruction groups.
     * @private
     * @returns {number} The total count of all transactions.
     */
    private countAllTransactions;
    /**
     * Calculates the sum of all payment instructions across all groups.
     * @private
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     */
    private sumAllPayments;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If any group's payment instructions have different currencies.
     */
    private validate;
    /**
     * Validates that all payment instructions in a group have the same currency (EUR).
     * @private
     * @param {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - Array of payment instructions.
     * @throws {Error} If payment instructions have different currencies.
     */
    private validateGroupInstructionsHaveSameCurrency;
    /**
     * Generates payment information for a single SEPA direct debit transfer instruction.
     * @param {SEPADirectDebitPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA direct debit specifications.
     */
    directDebitTransfer(instruction: SEPADirectDebitPaymentInstruction): {
        RmtInf?: {
            Ustrd: string;
        } | undefined;
        Dbtr: any;
        DbtrAcct: {
            Id: {
                IBAN: string;
            };
        } | {
            Id: {
                Othr: {
                    Id: string;
                };
            };
        };
        DbtrAgt?: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        } | undefined;
        PmtId: {
            EndToEndId: string;
        };
        InstdAmt: {
            '#': string;
            '@Ccy': "EUR";
        };
        DrctDbtTx: {
            MndtRltdInf: {
                AmdmntInfDtls?: {
                    OrgnlCdtrSchmeId?: {
                        Id?: {
                            PrvtId: {
                                Othr: {
                                    Id: string;
                                    SchmeNm: {
                                        Prtry: string;
                                    };
                                };
                            };
                        } | undefined;
                        Nm?: string | undefined;
                    } | undefined;
                    OrgnlMndtId?: string | undefined;
                } | undefined;
                MndtId: string;
                DtOfSgntr: string;
                AmdmntInd: boolean;
            };
        };
    };
    /**
     * Serializes the SEPA direct debit initiation to an XML string.
     * @returns {string} The XML representation of the SEPA direct debit initiation.
     */
    serialize(): string;
    /**
     * Parses an XML string and creates a SEPADirectDebitPaymentInitiation instance.
     * Supports multiple PmtInf blocks in the XML document.
     * @param {string} rawXml - The XML string to parse.
     * @returns {SEPADirectDebitPaymentInitiation} A new instance created from the XML data.
     * @throws {InvalidXmlError} If the XML format is invalid.
     * @throws {InvalidXmlNamespaceError} If the namespace is not pain.008.
     */
    static fromXML(rawXml: string): SEPADirectDebitPaymentInitiation;
}

type ISO20022MessageTypeName = `${string}.${string}`;
interface GenericISO20022Message {
    /** serialize to XML string */
    serialize(): string;
    /** export to a json object that can then be serialized */
    toJSON(): any;
    readonly data: any;
}

/**
 * Represents a bank statement in the CAMT.053 format.
 */
interface Statement {
    /** Unique identifier for the statement. */
    id: string;
    /** Electronic sequence number of the statement. */
    electronicSequenceNumber?: number;
    /** Legal sequence number of the statement. */
    legalSequenceNumber?: number;
    /** Date and time when the statement was created. */
    creationDate: Date;
    /** Start date of the statement period. */
    fromDate?: Date;
    /** End date of the statement period. */
    toDate?: Date;
    /** Account details for which the statement is generated. */
    account: Account;
    /** Financial institution details. */
    agent?: Agent;
    /** Total number of entries in the statement. */
    numOfEntries?: number;
    /** Sum of all entries in the statement. */
    sumOfEntries?: number;
    /** Net amount of all entries in the statement. */
    netAmountOfEntries?: number;
    /** Number of credit entries in the statement. */
    numOfCreditEntries?: number;
    /** Sum of all credit entries in the statement. */
    sumOfCreditEntries?: number;
    /** Number of debit entries in the statement. */
    numOfDebitEntries?: number;
    /** Sum of all debit entries in the statement. */
    sumOfDebitEntries?: number;
    /** Array of balance information. */
    balances: Balance[];
    /** Array of transaction entries. */
    entries: Entry[];
}
/**
 * Represents a balance in the statement, delinated by date and type.
 */
interface Balance {
    /** Date of the balance. */
    date: Date;
    /** Type of the balance. */
    type: BalanceType;
    /** Amount of the balance. */
    amount: number;
    /** Indicates whether the balance is credit (positive) or debit (negative). */
    creditDebitIndicator: 'credit' | 'debit';
    /** Currency of the balance. */
    currency: Currency;
}
/**
 * Represents a transaction entry in the statement.
 */
interface Entry {
    /** Unique reference ID for the entry, if included in the statement. */
    referenceId?: string;
    /** Indicates whether the entry is a credit or debit. */
    creditDebitIndicator: 'credit' | 'debit';
    /** Indicates if the entry is a reversal. */
    reversal: boolean;
    /** Date when the entry was booked. */
    bookingDate: Date;
    /** Amount of the entry. */
    amount: number;
    /** Currency of the entry. */
    currency: Currency;
    /** Proprietary code associated with the entry. */
    proprietaryCode: string;
    /** Array of individual transactions within this entry. */
    transactions: Transaction[];
    /** Additional entry information */
    additionalInformation?: string;
    /** Reference ID assigned by the account servicer. */
    accountServicerReferenceId?: string;
    /** Details about the type of transaction */
    bankTransactionCode: BankTransactionCode;
}
/**
 * Represents an individual transaction within an entry.
 */
interface Transaction {
    /** Unique message ID for the transaction. */
    messageId?: string;
    /** Reference ID assigned by the account servicer. */
    accountServicerReferenceId?: string;
    /** ID of the payment information. */
    paymentInformationId?: string;
    /** Instruction ID for the transaction. */
    instructionId?: string;
    /** Unique transaction ID. */
    transactionId?: string;
    /** Instructed amount for the transaction. */
    instructedAmount?: number;
    /** Currency of the instructed amount. */
    instructedCurrency?: Currency;
    /** Proprietary purpose code for the transaction. */
    proprietaryPurpose?: string;
    /** Details of the debtor party. */
    debtor?: Party;
    /** Details of the creditor party. */
    creditor?: Party;
    /** Additional information about the remittance. */
    remittanceInformation?: string;
    /** Reason for return, if applicable. */
    returnReason?: string;
    /** Additional information about the return. */
    returnAdditionalInformation?: string;
    /** End-to-end ID for the entry. */
    endToEndId?: string;
}
interface BankTransactionCode {
    /** Specifies the business area of the underlying transaction. */
    domainCode?: string;
    /** Specifies the family within the domain of the underlying transaction.  */
    domainFamilyCode?: string;
    /** Specifies the sub-product family within a specific family of the underlying transaction. */
    domainSubFamilyCode?: string;
    /** Bank transaction code in a proprietary form, as defined by the issuer. */
    proprietaryCode?: string;
    /** Identification of the issuer of the proprietary bank transaction code. */
    proprietaryCodeIssuer?: string;
}
/**
 * Balance types as defined in ISO 20022.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
declare const BalanceTypeCode: {
    /** Closing balance of amount of money that is at the disposal of the account owner on the date specified. */
    readonly ClosingAvailable: "CLAV";
    /** Balance of the account at the end of the pre-agreed account reporting period. It is the sum of the opening booked balance at the beginning of the period and all entries booked to the account during the pre-agreed account reporting period. */
    readonly ClosingBooked: "CLBD";
    /** Forward available balance of money that is at the disposal of the account owner on the date specified. */
    readonly ForwardAvailable: "FWAV";
    /** Balance for informational purposes. */
    readonly Information: "INFO";
    /** Available balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
    readonly InterimAvailable: "ITAV";
    /** Balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
    readonly InterimBooked: "ITBD";
    /** Opening balance of amount of money that is at the disposal of the account owner on the date specified. */
    readonly OpeningAvailable: "OPAV";
    /** Book balance of the account at the beginning of the account reporting period. It always equals the closing book balance from the previous report. */
    readonly OpeningBooked: "OPBD";
    /** Balance of the account at the previously closed account reporting period. The opening booked balance for the new period has to be equal to this balance. Usage: the previously booked closing balance should equal (inclusive date) the booked closing balance of the date it references and equal the actual booked opening balance of the current date. */
    readonly PreviouslyClosedBooked: "PRCD";
    /** Balance, composed of booked entries and pending items known at the time of calculation, which projects the end of day balance if everything is booked on the account and no other entry is posted. */
    readonly Expected: "XPCD";
    /** The difference between the excess/(deficit) investable balance and the excess/(deficit) collected balance due to the reserve requirement. This balance is not used if the account's Earnings Credit Rate is net of reserves. This may be used when the earnings allowance rate is not adjusted for reserves. It may be that reserves have been subtracted from the collected balance to determine the investable balance. Therefore, they must be added back to the excess/(deficit) investable balance to determine the collected balance position. The presentation of this calculation is optional. AFP code=00 04 21 */
    readonly AdditionalBalReserveRequirement: "ABRR";
};
/**
 * Description mapping of BalanceTypeCode values to their names.
 */
declare const BalanceTypeCodeDescriptionMap: {
    readonly CLAV: "Closing Available";
    readonly CLBD: "Closing Booked";
    readonly FWAV: "Forward Available";
    readonly INFO: "Information";
    readonly ITAV: "Interim Available";
    readonly ITBD: "Interim Booked";
    readonly OPAV: "Opening Available";
    readonly OPBD: "Opening Booked";
    readonly PRCD: "Previously Closed Booked";
    readonly XPCD: "Expected";
    readonly ABRR: "Additional Balance Reserve Requirement";
};
type BalanceType = (typeof BalanceTypeCode)[keyof typeof BalanceTypeCode];

/**
 * Configuration interface for creating a CashManagementAccountReport instance.
 */
interface CashManagementAccountReportConfig {
    /** Unique identifier for the message */
    messageId: string;
    /** Date and time when the report was created */
    creationDate: Date;
    /** Recipient (party without bank and institution) receiving the report */
    recipient?: {
        id?: string;
        name?: string;
        address?: StructuredAddress;
    };
    /** Array of bank account reports included in the report */
    statements: Statement[];
}
/**
 * Represents a Cash Management Account Report (CAMT.052.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.052 XML file.
 */
declare class CashManagementAccountReport implements GenericISO20022Message {
    private _messageId;
    private _creationDate;
    private _recipient?;
    private _statements;
    constructor(config: CashManagementAccountReportConfig);
    static supportedMessages(): ISO20022MessageTypeName[];
    get data(): CashManagementAccountReportConfig;
    static fromDocumentObject(obj: {
        Document: any;
    }): CashManagementAccountReport;
    /**
     * Creates a CashManagementAccountReport instance from a raw XML string.
     *
     * @param {string} rawXml - The raw XML string containing the CAMT.052 data.
     * @returns {CashManagementAccountReport} A new instance of CashManagementAccountReport.
     * @throws {Error} If the XML parsing fails or required data is missing.
     */
    static fromXML(rawXml: string): CashManagementAccountReport;
    /**
     *
     * @param json - JSON string representing a CashManagementAccountReport
     * @returns {CashManagementAccountReport} A new instance of CashManagementAccountReport
     * @throws {Error} If the JSON parsing fails or required data is missing.
     */
    static fromJSON(json: string): CashManagementAccountReport;
    toJSON(): any;
    serialize(): string;
    /**
     * Retrieves all balances from all statements in the report.
     * @returns {Balance[]} An array of all balances across all statements.
     */
    get balances(): Balance[];
    /**
     * Retrieves all transactions from all statements in the report.
     * @returns {Transaction[]} An array of all transactions across all statements.
     */
    get transactions(): Transaction[];
    /**
     * Retrieves all entries from all statements in the report.
     * @returns {Entry[]} An array of all entries across all statements.
     */
    get entries(): Entry[];
    /**
     * Gets the unique identifier for the message.
     * @returns {string} The message ID.
     */
    get messageId(): string;
    /**
     * Gets the party receiving the report.
     * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
     */
    get recipient(): Party | undefined;
    /**
     * Gets the date and time when the report was created.
     * @returns {Date} The creation date of the report.
     */
    get creationDate(): Date;
    /**
     * Gets all statements included in the report.
     * @returns {Statement[]} An array of all statements in the report.
     */
    get statements(): Statement[];
}

type AtLeastOne<T> = [T, ...T[]];
/**
 * Configuration interface for the ISO20022 class.
 * @interface ISO20022Config
 * @example
 * const config: ISO20022Config = {
 *     initiatingParty: {
 *         name: 'Example Corp',
 *         id: 'EXAMPLECORP',
 *         account: {
 *             accountNumber: '123456789',
 *         },
 *         agent: {
 *             bic: 'CHASUS33',
 *             bankAddress: {
 *                 country: 'US',
 *             },
 *         },
 *     },
 * };
 */
interface ISO20022Config {
    /**
     * The party initiating the ISO20022 messages.
     * This party is typically the sender of the messages or the entity responsible for the transaction.
     * @type {Party}
     */
    initiatingParty: Party;
}
/**
 * Configuration interface for SWIFT Credit Payment Initiation.
 * @interface SWIFTCreditPaymentInitiationConfig
 * @example
 * const config: SWIFTCreditPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         type: 'swift',
 *         direction: 'credit',
 *         amount: 1000,
 *         currency: 'USD',
 *         creditor: {
 *           name: 'Hans Schneider',
 *           account: {
 *             iban: 'DE1234567890123456',
 *           },
 *           agent: {
 *             bic: 'DEUTDEFF',
 *             bankAddress: {
 *               country: 'DE',
 *             },
 *           },
 *           address: {
 *             streetName: 'Hauptstraße',
 *             buildingNumber: '42',
 *             postalCode: '10115',
 *             townName: 'Berlin',
 *             country: 'DE',
 *           },
 *         },
 *         remittanceInformation: 'Invoice payment #123',
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface SWIFTCreditPaymentInitiationConfig {
    /**
     * An array of payment instructions.
     * @type {AtLeastOne<SWIFTCreditPaymentInstruction>}
     */
    paymentInstructions: AtLeastOne<SWIFTCreditPaymentInstruction>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Configuration interface for SEPA Credit Payment Initiation.
 * @interface SEPACreditPaymentInitiationConfig
 * @example
 * const config: SEPACreditPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         type: 'sepa',
 *         direction: 'credit',
 *         amount: 1000, // €10.00 Euros
 *         currency: 'EUR',
 *         creditor: {
 *           name: 'Hans Schneider',
 *           account: {
 *             iban: 'DE1234567890123456',
 *           },
 *         },
 *         remittanceInformation: 'Invoice payment #123',
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface SEPACreditPaymentInitiationConfig {
    /**
     * An array of payment instructions.
     * @type {AtLeastOne<SEPACreditPaymentInstruction>}
     */
    paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Configuration interface for SEPA Multi Credit Payment Initiation.
 * @interface SEPAMultiCreditPaymentInitiationConfig
 * @example
 * const config: SEPAMultiCreditPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         initiatingParty: debtor1,
 *         payments: [
 *           {
 *             type: 'sepa',
 *             direction: 'credit',
 *             amount: 1000, // €10.00 Euros
 *             currency: 'EUR',
 *             creditor: {
 *               name: 'Hans Schneider',
 *               account: {
 *                 iban: 'DE1234567890123456',
 *               },
 *             },
 *             remittanceInformation: 'Invoice payment #123',
 *           },
 *         ],
 *         categoryPurpose: 'SALA', // Optional
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface SEPAMultiCreditPaymentInitiationConfig {
    /**
     * An array of payment instruction groups, each with its own debtor.
     * @type {AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>}
     */
    paymentInstructions: AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Configuration interface for RTP Credit Payment Initiation.
 * @interface RTPCreditPaymentInitiationConfig
 * @example
 * const config: RTPCreditPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         type: 'rtp',
 *         direction: 'credit',
 *         amount: 100000, // $1000.00
 *         currency: 'USD',
 *         creditor: {
 *           name: 'All-American Dogs Co.',
 *           account: {
 *             accountNumber: '123456789012',
 *           },
 *           agent: {
 *             abaRoutingNumber: '37714568112',
 *           },
 *         },
 *         remittanceInformation: '1000 Hot Dogs Feb26',
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface RTPCreditPaymentInitiationConfig {
    /**
     * An array of payment instructions.
     * @type {AtLeastOne<RTPCreditPaymentInstruction>}
     */
    paymentInstructions: AtLeastOne<RTPCreditPaymentInstruction>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Configuration interface for ACH Credit Payment Initiation.
 * @interface ACHCreditPaymentInitiationConfig
 * @example
 * const config: ACHCreditPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         type: 'ach',
 *         direction: 'credit',
 *         amount: 100000, // $1000.00
 *         currency: 'USD',
 *         creditor: {
 *           name: 'John Doe Funding LLC',
 *           account: {
 *             accountNumber: '123456789012',
 *           },
 *           agent: {
 *             abaRoutingNumber: '123456789',
 *           },
 *         },
 *         remittanceInformation: 'Invoice #12345',
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface ACHCreditPaymentInitiationConfig {
    /**
     * An array of payment instructions.
     * @type {AtLeastOne<ACHCreditPaymentInstruction>}
     */
    paymentInstructions: AtLeastOne<ACHCreditPaymentInstruction>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Configuration interface for SEPA Direct Debit Payment Initiation.
 * @interface SEPADirectDebitPaymentInitiationConfig
 * @example
 * const config: SEPADirectDebitPaymentInitiationConfig = {
 *     paymentInstructions: [
 *       {
 *         creditor: {
 *           name: 'Landlord Company Ltd',
 *           account: {
 *             iban: 'DE54120300001030860744',
 *           },
 *           agent: {
 *             bic: 'BYLADEM1001',
 *           },
 *         },
 *         creditorSchemeId: 'DE96ZZZ00000345986',
 *         requestedCollectionDate: new Date('2025-11-22'),
 *         sequenceType: 'RCUR',
 *         payments: [
 *           {
 *             type: 'sepa',
 *             direction: 'debit',
 *             amount: 31700, // €317.00 Euros
 *             currency: 'EUR',
 *             debtor: {
 *               name: 'John Doe',
 *               account: {
 *                 iban: 'DE20120300001088243355',
 *               },
 *               agent: {
 *                 bic: 'BYLADEM1001',
 *               },
 *             },
 *             mandate: {
 *               mandateId: 'MR-12345-001',
 *               dateOfSignature: new Date('2024-01-15'),
 *               amendmentIndicator: false,
 *             },
 *             remittanceInformation: 'Rent payment November 2024',
 *           },
 *         ],
 *         localInstrument: 'CORE', // Optional, defaults to CORE
 *       },
 *     ],
 *     messageId: 'MSGID123', // Optional
 *     creationDate: new Date(), // Optional
 * };
 */
interface SEPADirectDebitPaymentInitiationConfig {
    /**
     * An array of payment instruction groups, each with its own creditor.
     * @type {AtLeastOne<SEPADirectDebitPaymentInstructionGroup>}
     */
    paymentInstructions: AtLeastOne<SEPADirectDebitPaymentInstructionGroup>;
    /**
     * Optional unique identifier for the message. If not provided, a UUID will be generated.
     * @type {string}
     */
    messageId?: string;
    /**
     * Optional creation date for the message. If not provided, current date will be used.
     * @type {Date}
     */
    creationDate?: Date;
}
/**
 * Represents an ISO20022 core message creator.
 * This class provides methods to create various basic ISO20022 compliant messages.
 *
 * @example
 * const iso20022 = new ISO20022({
 *     initiatingParty: {
 *         name: 'Example Corp',
 *         id: 'EXAMPLECORP',
 *         account: {
 *             accountNumber: '123456789',
 *         },
 *         agent: {
 *             bic: 'CHASUS33',
 *             bankAddress: {
 *                 country: 'US',
 *             },
 *         },
 *     },
 * });
 */
declare class ISO20022 {
    private initiatingParty;
    /**
     * Creates an instance of ISO20022.
     * @param {ISO20022Config} config - The configuration object for ISO20022.
     */
    constructor(config: ISO20022Config);
    /**
     * Creates a SWIFT Credit Payment Initiation message.
     * @param {SWIFTCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
     * @example
     * const payment = iso20022.createSWIFTCreditPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       type: 'swift',
     *       direction: 'credit',
     *       amount: 1000,
     *       currency: 'USD',
     *       creditor: {
     *         name: 'Hans Schneider',
     *         account: {
     *           iban: 'DE1234567890123456',
     *         },
     *         agent: {
     *           bic: 'DEUTDEFF',
     *           bankAddress: {
     *             country: 'DE',
     *           },
     *         },
     *         address: {
     *           streetName: 'Hauptstraße',
     *           buildingNumber: '42',
     *           postalCode: '10115',
     *           townName: 'Berlin',
     *           country: 'DE',
     *         },
     *       },
     *       remittanceInformation: 'Invoice payment #123',
     *     },
     *   ],
     *   messageId: 'SWIFT-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {SWIFTCreditPaymentInitiation} A new SWIFT Credit Payment Initiation object.
     */
    createSWIFTCreditPaymentInitiation(config: SWIFTCreditPaymentInitiationConfig): SWIFTCreditPaymentInitiation;
    /**
     * Creates a SEPA Credit Payment Initiation message.
     * @param {SEPACreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
     * @example
     * const payment = iso20022.createSEPACreditPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       type: 'sepa',
     *       direction: 'credit',
     *       amount: 1000, // €10.00 Euros
     *       currency: 'EUR',
     *       creditor: {
     *         name: 'Hans Schneider',
     *         account: {
     *           iban: 'DE1234567890123456',
     *         },
     *       },
     *       remittanceInformation: 'Invoice payment #123',
     *     },
     *   ],
     *   messageId: 'SEPA-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {SEPACreditPaymentInitiation} A new SEPA Credit Payment Initiation object.
     */
    createSEPACreditPaymentInitiation(config: SEPACreditPaymentInitiationConfig): SEPACreditPaymentInitiation;
    /**
     * Creates a SEPA Multi Credit Payment Initiation message with multiple payment information blocks.
     * @param {SEPAMultiCreditPaymentInitiationConfig} config - Configuration containing payment instruction groups and optional parameters.
     * @example
     * const payment = iso20022.createSEPAMultiCreditPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       initiatingParty: debtor1,
     *       payments: [
     *         {
     *           type: 'sepa',
     *           direction: 'credit',
     *           amount: 1000, // €10.00 Euros
     *           currency: 'EUR',
     *           creditor: {
     *             name: 'Hans Schneider',
     *             account: {
     *               iban: 'DE1234567890123456',
     *             },
     *           },
     *           remittanceInformation: 'Invoice payment #123',
     *         },
     *       ],
     *       categoryPurpose: 'SALA', // Optional
     *     },
     *   ],
     *   messageId: 'SEPA-MULTI-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {SEPAMultiCreditPaymentInitiation} A new SEPA Multi Credit Payment Initiation object.
     */
    createSEPAMultiCreditPaymentInitiation(config: SEPAMultiCreditPaymentInitiationConfig): SEPAMultiCreditPaymentInitiation;
    /**
     * Creates a RTP Credit Payment Initiation message.
     * @param {RTPCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
     * @example
     * const payment = iso20022.createRTPCreditPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       type: 'rtp',
     *       direction: 'credit',
     *       amount: 100000, // $1000.00
     *       currency: 'USD',
     *       creditor: {
     *         name: 'All-American Dogs Co.',
     *         account: {
     *           accountNumber: '123456789012',
     *         },
     *         agent: {
     *           abaRoutingNumber: '37714568112',
     *         },
     *       },
     *       remittanceInformation: '1000 Hot Dogs Feb26',
     *     },
     *   ],
     *   messageId: 'RTP-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {RTPCreditPaymentInitiation} A new RTP Credit Payment Initiation object.
     */
    createRTPCreditPaymentInitiation(config: RTPCreditPaymentInitiationConfig): RTPCreditPaymentInitiation;
    /**
     * Creates an ACH Credit Payment Initiation message.
     * @param {ACHCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
     * @example
     * const payment = iso20022.createACHCreditPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       type: 'ach',
     *       direction: 'credit',
     *       amount: 100000, // $1000.00
     *       currency: 'USD',
     *       creditor: {
     *         name: 'John Doe Funding LLC',
     *         account: {
     *           accountNumber: '123456789012',
     *         },
     *         agent: {
     *           abaRoutingNumber: '123456789',
     *         },
     *       },
     *       remittanceInformation: 'Invoice #12345',
     *     },
     *   ],
     *   messageId: 'ACH-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {ACHCreditPaymentInitiation} A new ACH Credit Payment Initiation object.
     */
    createACHCreditPaymentInitiation(config: ACHCreditPaymentInitiationConfig): ACHCreditPaymentInitiation;
    /**
     * Creates a SEPA Direct Debit Payment Initiation message.
     * @param {SEPADirectDebitPaymentInitiationConfig} config - Configuration containing payment instruction groups and optional parameters.
     * @example
     * const payment = iso20022.createSEPADirectDebitPaymentInitiation({
     *   paymentInstructions: [
     *     {
     *       creditor: {
     *         name: 'Landlord Company Ltd',
     *         account: {
     *           iban: 'DE54120300001030860744',
     *         },
     *         agent: {
     *           bic: 'BYLADEM1001',
     *         },
     *       },
     *       creditorSchemeId: 'DE96ZZZ00000345986',
     *       requestedCollectionDate: new Date('2025-11-22'),
     *       sequenceType: 'RCUR',
     *       payments: [
     *         {
     *           type: 'sepa',
     *           direction: 'debit',
     *           amount: 31700, // €317.00 Euros
     *           currency: 'EUR',
     *           debtor: {
     *             name: 'John Doe',
     *             account: {
     *               iban: 'DE20120300001088243355',
     *             },
     *             agent: {
     *               bic: 'BYLADEM1001',
     *             },
     *           },
     *           mandate: {
     *             mandateId: 'MR-12345-001',
     *             dateOfSignature: new Date('2024-01-15'),
     *             amendmentIndicator: false,
     *           },
     *           remittanceInformation: 'Rent payment November 2024',
     *         },
     *       ],
     *       localInstrument: 'CORE', // Optional
     *     },
     *   ],
     *   messageId: 'DD-MSG-001', // Optional
     *   creationDate: new Date('2025-03-01'), // Optional
     * });
     * @returns {SEPADirectDebitPaymentInitiation} A new SEPA Direct Debit Payment Initiation object.
     */
    createSEPADirectDebitPaymentInitiation(config: SEPADirectDebitPaymentInitiationConfig): SEPADirectDebitPaymentInitiation;
    /** Create a message CAMT or other */
    createMessage(type: ISO20022MessageTypeName, config: any): GenericISO20022Message;
}

/**
 * Represents the original group information in a payment status report.
 */
interface OriginalGroupInformation {
    /** The original message ID associated with the group. */
    originalMessageId: string;
}
/**
 * Represents the type of status in a payment status report.
 */
type StatusType = 'group' | 'payment' | 'transaction';
/**
 * Represents the status codes in a payment status report.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
declare const PaymentStatusCode: {
    readonly Rejected: "RJCT";
    readonly PartiallyAccepted: "ACCP";
    readonly Pending: "PNDG";
    readonly Accepted: "ACCP";
    readonly AcceptedSettlementInProgress: "ACSP";
    readonly AcceptedCreditSettlementCompleted: "ACSC";
    readonly AcceptedSettlementCompleted: "ACSC";
    readonly AcceptedTechnicalValidation: "ACTC";
};
type PaymentStatus = (typeof PaymentStatusCode)[keyof typeof PaymentStatusCode];
/**
 * Represents the base structure for status information in a payment status report.
 */
interface BaseStatusInformation {
    /** The type of status (group, payment, or transaction). */
    type: StatusType;
    /** The status value. */
    status: PaymentStatus;
    /** Optional reason for the status. */
    reason?: {
        /** Optional reason code. */
        code?: string;
        /** Optional additional information about the reason. */
        additionalInformation?: string;
    };
}
/**
 * Represents the status information for a group in a payment status report.
 */
interface GroupStatusInformation extends BaseStatusInformation {
    /** The type is always 'group' for GroupStatus. */
    type: 'group';
    /** The original message ID associated with the group. */
    originalMessageId: string;
}
/**
 * Represents the status information for a payment in a payment status report.
 */
interface PaymentStatusInformation extends BaseStatusInformation {
    /** The type is always 'payment' for PaymentStatus. */
    type: 'payment';
    /** The original payment ID associated with the payment. */
    originalPaymentId: string;
}
/**
 * Represents the status information for a transaction in a payment status report.
 */
interface TransactionStatusInformation extends BaseStatusInformation {
    /** The type is always 'transaction' for TransactionStatus. */
    type: 'transaction';
    /** The original end-to-end ID associated with the transaction. */
    originalEndToEndId: string;
}
/**
 * Represents the union type of all possible status information types in a payment status report.
 */
type StatusInformation = GroupStatusInformation | PaymentStatusInformation | TransactionStatusInformation;

/**
 * Configuration interface for creating a PaymentStatusReport instance.
 */
interface PaymentStatusReportConfig {
    /** Unique identifier for the message */
    messageId: string;
    creationDate: Date;
    initatingParty: Party;
    originalGroupInformation: OriginalGroupInformation;
    statusInformations: StatusInformation[];
}
/**
 * Represents a Payment Status Report, containing information about the status of payments and transactions.
 */
declare class PaymentStatusReport {
    private _messageId;
    private _creationDate;
    private _initatingParty;
    private _originalGroupInformation;
    private _statusInformations;
    /**
     * Creates a new PaymentStatusReport instance.
     * @param {PaymentStatusReportConfig} config - The configuration object for the PaymentStatusReport.
     */
    constructor(config: PaymentStatusReportConfig);
    /**
     * Creates a PaymentStatusReport instance from an XML string.
     * @param {string} rawXml - The raw XML string to parse.
     * @returns {PaymentStatusReport} A new PaymentStatusReport instance.
     */
    static fromXML(rawXml: string): PaymentStatusReport;
    /**
     * Gets the message ID of the Payment Status Report.
     * @returns {string} The message ID.
     */
    get messageId(): string;
    /**
     * Gets the creation date of the Payment Status Report.
     * @returns {Date} The creation date.
     */
    get creationDate(): Date;
    /**
     * Gets the initiating party of the Payment Status Report.
     * @returns {Party} The initiating party.
     */
    get initatingParty(): Party;
    /**
     * Gets the original message ID from the original group information.
     * @returns {string} The original message ID.
     */
    get originalMessageId(): string;
    /**
     * Gets all status information entries in the Payment Status Report.
     * @returns {StatusInformation[]} An array of StatusInformation objects.
     */
    get statusInformations(): StatusInformation[];
    /**
     * Gets the first status information entry in the Payment Status Report.
     * @returns {StatusInformation} The first StatusInformation object in the statuses array.
     */
    get firstStatusInformation(): StatusInformation;
    /**
     * Gets the original ID based on the type of the first status information.
     * @returns {string} The original ID, which could be the original message ID, payment ID, or end-to-end ID.
     */
    get originalId(): string;
    /**
     * Gets the status from the first status information entry.
     * @returns {PaymentStatus} The Status from the first status information.
     */
    get status(): PaymentStatus;
}

/**
 * Configuration interface for creating a CashManagementEndOfDayReport instance.
 */
interface CashManagementEndOfDayReportConfig {
    /** Unique identifier for the message */
    messageId: string;
    /** Date and time when the report was created */
    creationDate: Date;
    /** Recipient (party without bank and institution) receiving the report */
    recipient?: {
        id?: string;
        name?: string;
        address?: StructuredAddress;
    };
    /** Array of bank statements included in the report */
    statements: Statement[];
}
/**
 * Represents a Cash Management End of Day Report (CAMT.053.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.053 XML file.
 */
declare class CashManagementEndOfDayReport implements GenericISO20022Message {
    private _messageId;
    private _creationDate;
    private _recipient?;
    private _statements;
    constructor(config: CashManagementEndOfDayReportConfig);
    static supportedMessages(): ISO20022MessageTypeName[];
    get data(): CashManagementEndOfDayReportConfig;
    static fromDocumentObject(obj: {
        Document: any;
    }): CashManagementEndOfDayReport;
    /**
     * Creates a CashManagementEndOfDayReport instance from a raw XML string.
     *
     * @param {string} rawXml - The raw XML string containing the CAMT.053 data.
     * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport.
     * @throws {Error} If the XML parsing fails or required data is missing.
     */
    static fromXML(rawXml: string): CashManagementEndOfDayReport;
    /**
     *
     * @param json - JSON string representing a CashManagementEndOfDayReport
     * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport
     * @throws {Error} If the JSON parsing fails or required data is missing.
     */
    static fromJSON(json: string): CashManagementEndOfDayReport;
    toJSON(): any;
    serialize(): string;
    /**
     * Retrieves all balances from all statements in the report.
     * @returns {Balance[]} An array of all balances across all statements.
     */
    get balances(): Balance[];
    /**
     * Retrieves all transactions from all statements in the report.
     * @returns {Transaction[]} An array of all transactions across all statements.
     */
    get transactions(): Transaction[];
    /**
     * Retrieves all entries from all statements in the report.
     * @returns {Entry[]} An array of all entries across all statements.
     */
    get entries(): Entry[];
    /**
     * Gets the unique identifier for the message.
     * @returns {string} The message ID.
     */
    get messageId(): string;
    /**
     * Gets the party receiving the report.
     * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
     */
    get recipient(): Party | undefined;
    /**
     * Gets the date and time when the report was created.
     * @returns {Date} The creation date of the report.
     */
    get creationDate(): Date;
    /**
     * Gets all statements included in the report.
     * @returns {Statement[]} An array of all statements in the report.
     */
    get statements(): Statement[];
}

/**
 * Base error class for all ISO 20022 related errors in the library.
 * Extends the native Error class with proper stack trace capture.
 */
declare class Iso20022JsError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when XML parsing or validation fails.
 * This error indicates that the provided XML is malformed or does not conform to expected structure.
 */
declare class InvalidXmlError extends Iso20022JsError {
    constructor(message: string);
}
/**
 * Error thrown when XML namespace validation fails.
 * This error indicates that the XML document contains invalid or missing required ISO 20022 namespaces.
 */
declare class InvalidXmlNamespaceError extends Iso20022JsError {
    constructor(message: string);
}

export { type ABAAgent, ACHCreditPaymentInitiation, type ACHCreditPaymentInitiationConfig$1 as ACHCreditPaymentInitiationConfig, type ACHCreditPaymentInstruction, type ACHLocalInstrument, ACHLocalInstrumentCode, ACHLocalInstrumentCodeDescriptionMap, type Account, type Agent, type BICAgent, type Balance, type BalanceType, BalanceTypeCode, BalanceTypeCodeDescriptionMap, type BaseAccount, type BaseStatusInformation as BaseStatus, CashManagementAccountReport, CashManagementEndOfDayReport, type Entry, type GroupStatusInformation as GroupStatus, type IBANAccount, ISO20022, InvalidXmlError, InvalidXmlNamespaceError, Iso20022JsError, type MandateAmendmentInformation, type MandateInformation, type OriginalGroupInformation, type Party, type PaymentStatusInformation as PaymentStatus, PaymentStatusCode, PaymentStatusReport, RTPCreditPaymentInitiation, type RTPCreditPaymentInitiationConfig$1 as RTPCreditPaymentInitiationConfig, type RTPCreditPaymentInstruction, SEPACreditPaymentInitiation, type SEPACreditPaymentInitiationConfig$1 as SEPACreditPaymentInitiationConfig, type SEPACreditPaymentInstruction, SEPADirectDebitPaymentInitiation, type SEPADirectDebitPaymentInitiationConfig$1 as SEPADirectDebitPaymentInitiationConfig, type SEPADirectDebitPaymentInstruction, type SEPADirectDebitPaymentInstructionGroup, type SEPALocalInstrument, SEPAMultiCreditPaymentInitiation, type SEPAMultiCreditPaymentInitiationConfig$1 as SEPAMultiCreditPaymentInitiationConfig, type SEPAMultiCreditPaymentInstructionGroup, type SEPASequenceType, SWIFTCreditPaymentInitiation, type SWIFTCreditPaymentInitiationConfig$1 as SWIFTCreditPaymentInitiationConfig, type SWIFTCreditPaymentInstruction, type Statement, type PaymentStatus as Status, type StatusInformation, type StatusType, type StructuredAddress, type Transaction, type TransactionStatusInformation as TransactionStatus };
