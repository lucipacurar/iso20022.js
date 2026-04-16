import { Currency } from './currencies';
import { Alpha2Country } from './countries';
export type AtLeastOne<T> = [T, ...T[]];
/**
 * Represents a payment instruction with essential details.
 */
export interface PaymentInstruction {
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
export interface CreditPaymentInstruction extends PaymentInstruction {
    direction?: 'credit';
    creditor: Party;
}
/**
 * Represents a SWIFT credit payment instruction, extending the base PaymentInstruction.
 */
export interface SWIFTCreditPaymentInstruction extends CreditPaymentInstruction {
    /** Specifies that this is a SWIFT payment. */
    type?: 'swift';
}
export interface SEPACreditPaymentInstruction extends CreditPaymentInstruction {
    type?: 'sepa';
    currency: 'EUR';
    /** Optional requested payment execution date. If not provided, defaults to current date. */
    requestedPaymentExecutionDate?: Date;
}
export interface RTPCreditPaymentInstruction extends CreditPaymentInstruction {
    type?: 'rtp';
    currency: 'USD';
}
/**
 * Represents an ACH credit payment instruction, extending the base PaymentInstruction.
 */
export interface ACHCreditPaymentInstruction extends CreditPaymentInstruction {
    /** Specifies that this is an ACH payment. */
    type?: 'ach';
    /** ACH payments must use USD as currency. */
    currency: 'USD';
}
/**
 * Category purpose codes as defined in ISO 20022 ExternalCategoryPurpose1Code.
 * @see {@link https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets}
 */
export declare const ExternalCategoryPurposeCode: {
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
/**
 * Description mapping of ExternalCategoryPurposeCode values to their names.
 */
export declare const ExternalCategoryPurposeCodeDescriptionMap: {
    readonly BONU: "Bonus Payment";
    readonly CASH: "Cash Management";
    readonly CBLK: "Card Bulk Settlement";
    readonly CCRD: "Credit Card Payment";
    readonly CORT: "Trade Settlement";
    readonly DCRD: "Debit Card Payment";
    readonly DIVI: "Dividends";
    readonly DVPM: "Deliver Against Payment";
    readonly EPAY: "Electronic Payment";
    readonly FCIN: "Fee and Interest";
    readonly FCOL: "Card Fee Settlement";
    readonly GP2P: "General Person-to-Person";
    readonly GOVT: "Government Payment";
    readonly HEDG: "Hedging Operation";
    readonly ICCP: "Credit Card Reimbursement";
    readonly IDCP: "Debit Card Reimbursement";
    readonly INTC: "Intra-Company Payment";
    readonly INTE: "Interest Payment";
    readonly LBOX: "Lockbox";
    readonly LOAN: "Loan Transfer";
    readonly MP2B: "Mobile Person-to-Business";
    readonly MP2P: "Mobile Person-to-Person";
    readonly OTHR: "Other";
    readonly PENS: "Pension Payment";
    readonly RPRE: "Re-Present Transaction";
    readonly RRCT: "Commercial Reimbursement";
    readonly RVPM: "Receive Against Payment";
    readonly SALA: "Salary Payment";
    readonly SECU: "Securities Payment";
    readonly SSBE: "Social Security Benefit";
    readonly SUPP: "Supplier Payment";
    readonly TAXS: "Tax Payment";
    readonly TRAD: "Trade Finance";
    readonly TREA: "Treasury Operation";
    readonly VATX: "Value Added Tax";
    readonly WHLD: "Withholding Tax";
    readonly SWEP: "Sweep Instruction";
    readonly TOPG: "Top-up Instruction";
    readonly ZABA: "Zero Balance";
    readonly VOST: "Domestic from Foreign";
    readonly FCDT: "Foreign Currency Domestic";
    readonly CIPC: "Cash Order";
    readonly CONC: "Cash Order Consolidated";
    readonly CGWV: "Cash in Transit";
    readonly SAVG: "Savings Transfer";
    readonly CTDF: "Cross Border Dodd Frank";
};
export type ExternalCategoryPurpose = (typeof ExternalCategoryPurposeCode)[keyof typeof ExternalCategoryPurposeCode];
/**
 * Represents a structured address format.
 */
export interface StructuredAddress {
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
export interface Party {
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
export interface IBANAccount {
    /** The International Bank Account Number. */
    iban: string;
}
/**
 * Represents a basic account with account number and optional type.
 */
export interface BaseAccount {
    /** The account number. */
    accountNumber: string;
    /** The type of the account. */
    accountType?: 'checking' | 'savings';
    /** The currency of the account. */
    currency?: Currency;
    /** The name of the account. */
    name?: string;
}
export type AccountIdentification = AccountIdentificationIBAN | AccountIdentificationOther;
export interface AccountIdentificationIBAN {
    iban: string;
}
export interface AccountIdentificationOther {
    id: string;
    schemeName?: string;
    issuer?: string;
}
/**
 * Represents either an IBAN account or a basic account.
 */
export type Account = IBANAccount | BaseAccount;
/**
 * Represents a financial agent identified by BIC.
 */
export interface BICAgent {
    /** The Bank Identifier Code. */
    bic: string;
    /** The structured address of the bank. */
    bankAddress?: StructuredAddress;
}
/**
 * Represents a financial agent identified by ABA routing number.
 */
export interface ABAAgent {
    /** The ABA routing number. */
    abaRoutingNumber: string;
}
/**
 * Represents either a BIC or ABA identified financial agent.
 * NOTE: Sometimes an agent can include both a BIC and ABA routing number.
 * This library does not support that yet, but we will need to.
 */
export type Agent = BICAgent | ABAAgent;
/**
 * ACH Local Instrument Codes as defined in NACHA standards.
 * These codes identify the specific type of ACH transaction.
 */
export declare const ACHLocalInstrumentCode: {
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
export type ACHLocalInstrument = (typeof ACHLocalInstrumentCode)[keyof typeof ACHLocalInstrumentCode];
export declare const ACHLocalInstrumentCodeDescriptionMap: {
    readonly CCD: "Corporate Credit or Debit";
    readonly PPD: "Prearranged Payment and Deposit";
    readonly WEB: "Internet-Initiated Entry";
    readonly TEL: "Telephone-Initiated Entry";
    readonly POP: "Point-of-Purchase Entry";
    readonly ARC: "Accounts Receivable Entry";
    readonly BOC: "Back Office Conversion";
    readonly RCK: "Represented Check Entry";
};
export interface MessageHeader {
    id: string;
    creationDateTime?: Date;
    originalMessageHeader?: Partial<MessageHeader>;
    requestType?: string;
    queryName?: string;
}
export declare const CashAccountTypeCode: {
    readonly Current: "CACC";
    readonly CashPayment: "CASH";
    readonly Charges: "CHAR";
    readonly CashIncome: "CISH";
    readonly Commission: "COMM";
    readonly ClearingParticipantSettlementAccount: "CPAC";
    readonly LimitedLiquiditySavingsAccount: "LLSV";
    readonly Loan: "LOAN";
    readonly MarginalLending: "MGLD";
    readonly MoneyMarket: "MOMA";
    readonly NonResidentExternal: "NREX";
    readonly Overdraft: "ODFT";
    readonly OverNightDeposit: "ONDP";
    readonly OtherAccount: "OTHR";
    readonly Settlement: "SACC";
    readonly Salary: "SLRY";
    readonly Savings: "SVGS";
    readonly Tax: "TAXE";
    readonly TransactingAccount: "TRAN";
    readonly CashTrading: "TRAS";
};
export type CashAccountType = (typeof CashAccountTypeCode)[keyof typeof CashAccountTypeCode];
export declare const CashAccountTypeCodeDescriptionMap: {
    readonly CACC: "Current";
    readonly CASH: "Cash Payment";
    readonly CHAR: "Charges";
    readonly CISH: "Cash Income";
    readonly COMM: "Commission";
    readonly CPAC: "Clearing Participant Settlement Account";
    readonly LLSV: "Limited Liquidity Savings Account";
    readonly LOAN: "Loan";
    readonly MGLD: "Marginal Lending";
    readonly MOMA: "Money Market";
    readonly NREX: "Non Resident External";
    readonly ODFT: "Overdraft";
    readonly ONDP: "Over Night Deposit";
    readonly OTHR: "Other Account";
    readonly SACC: "Settlement";
    readonly SLRY: "Salary";
    readonly SVGS: "Savings";
    readonly TAXE: "Tax";
    readonly TRAN: "Transacting Account";
    readonly TRAS: "Cash Trading";
};
/**
 * SEPA Direct Debit Local Instrument Codes.
 * Defines the type of SEPA direct debit scheme.
 */
export type SEPALocalInstrument = 'CORE' | 'B2B';
/**
 * SEPA Direct Debit Sequence Type Codes.
 * Indicates the position of a direct debit transaction in a series of recurring direct debits.
 * - FRST: First collection in a series of recurring direct debits
 * - RCUR: Recurring collection in a series of recurring direct debits
 * - OOFF: One-off direct debit collection
 * - FNAL: Final collection in a series of recurring direct debits
 */
export type SEPASequenceType = 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
/**
 * Information about amendments made to a direct debit mandate.
 */
export interface MandateAmendmentInformation {
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
export interface MandateInformation {
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
export interface SEPADirectDebitPaymentInstruction extends PaymentInstruction {
    type?: 'sepa';
    direction?: 'debit';
    currency: 'EUR';
    /**
     * Optional instruction identification. When provided, emitted as `<InstrId>`
     * inside `<PmtId>` (before `<EndToEndId>`). Max 35 characters. Required to
     * echo as `OrgnlInstrId` in pain.007 reversals.
     */
    instrId?: string;
    /** The party being debited (money is collected from this party) */
    debtor: Party;
    /** Mandate information authorizing the direct debit */
    mandate: MandateInformation;
}
export declare const SEPAReversalReasonCode: {
    readonly Duplication: "DUPL";
    readonly TechnicalProblem: "TECH";
    readonly FraudulentOriginal: "FRAD";
    readonly CutOffTime: "CUTA";
    readonly AmountDiffers: "AM05";
    readonly InvalidDebtorAccount: "AC04";
    readonly NotSpecifiedCustomerGenerated: "MS02";
    readonly NotSpecifiedAgentGenerated: "MS03";
};
export type SEPAReversalReason = (typeof SEPAReversalReasonCode)[keyof typeof SEPAReversalReasonCode];
